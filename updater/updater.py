#!/usr/bin/env python3
"""Launch Control Updater - Standalone Tkinter update client.

Checks for releases on GitHub (or a local staging server), compares semantic versions,
downloads release archives with progress display, and applies updates safely.
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path

# Embedded token fallback for private repo (can be overridden via GITHUB_TOKEN env var)
DEFAULT_REPO = "Darren-Smith/LaunchControl"


def parse_semver(v_str: str):
    """Extract (major, minor, patch) tuple from version string (e.g., 'v1.2.3' -> (1, 2, 3))."""
    m = re.search(r"v?(\d+)\.(\d+)\.(\d+)", str(v_str))
    if not m:
        return (0, 0, 0)
    return tuple(map(int, m.groups()))


def get_current_version(app_dir: Path):
    vf = app_dir / "version.json"
    if vf.exists():
        try:
            data = json.loads(vf.read_text())
            return data.get("version", "0.1.0"), data.get("notes", "")
        except Exception:
            pass
    return "0.1.0", ""


def get_opener(url: str):
    if "127.0.0.1" in url or "localhost" in url:
        return urllib.request.build_opener(urllib.request.ProxyHandler({}))
    return urllib.request.build_opener()


class UpdateService:
    def __init__(self, app_dir: Path, repo: str = DEFAULT_REPO, token: str = None, api_url: str = None):
        self.app_dir = app_dir
        self.repo = repo
        self.token = token or os.environ.get("GITHUB_TOKEN", "")
        self.api_url = api_url or f"https://api.github.com/repos/{repo}/releases/latest"

    def fetch_latest_release(self):
        req = urllib.request.Request(self.api_url)
        req.add_header("User-Agent", "LaunchControl-Updater")
        req.add_header("Accept", "application/vnd.github+json")
        if self.token:
            req.add_header("Authorization", f"Bearer {self.token}")

        opener = get_opener(self.api_url)
        with opener.open(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            return data

    def check_for_update(self):
        cur_ver, notes = get_current_version(self.app_dir)
        release = self.fetch_latest_release()

        tag = release.get("tag_name", "0.0.0")
        remote_ver = tag.lstrip("v")
        has_update = parse_semver(remote_ver) > parse_semver(cur_ver)

        # Locate release asset (.zip on Windows, .tar.gz on Linux)
        target_ext = ".zip" if sys.platform.startswith("win") else ".tar.gz"
        fallback_ext = ".tar.gz" if sys.platform.startswith("win") else ".zip"
        assets = release.get("assets", [])
        asset_url = None

        for ext in (target_ext, fallback_ext):
            for a in assets:
                name = a.get("name", "")
                if name.endswith(ext):
                    asset_url = a.get("url") if self.token else a.get("browser_download_url")
                    break
            if asset_url:
                break

        return {
            "current_version": cur_ver,
            "remote_version": remote_ver,
            "has_update": has_update,
            "notes": release.get("body", "No release notes provided."),
            "asset_url": asset_url,
            "release_data": release,
        }

    def download_asset(self, url: str, target_file: Path, progress_callback=None):
        req = urllib.request.Request(url)
        req.add_header("User-Agent", "LaunchControl-Updater")
        if self.token and "api.github.com" in url:
            req.add_header("Authorization", f"Bearer {self.token}")
            req.add_header("Accept", "application/octet-stream")

        opener = get_opener(url)
        with opener.open(req, timeout=30) as resp, open(target_file, "wb") as out:
            total_size = int(resp.headers.get("Content-Length", 0))
            downloaded = 0
            chunk_size = 64 * 1024
            while True:
                chunk = resp.read(chunk_size)
                if not chunk:
                    break
                out.write(chunk)
                downloaded += len(chunk)
                if progress_callback:
                    progress_callback(downloaded, total_size)

    def apply_update(self, archive_path: Path, new_version: str, notes: str):
        import zipfile
        with tempfile.TemporaryDirectory() as stage_dir:
            stage_path = Path(stage_dir)
            if archive_path.name.endswith(".zip"):
                with zipfile.ZipFile(archive_path, "r") as zf:
                    zf.extractall(path=stage_path)
            else:
                with tarfile.open(archive_path, "r:gz") as tar:
                    tar.extractall(path=stage_path)

            # Locate root of extracted archive (may be top-level or inside a folder)
            extracted_items = list(stage_path.iterdir())
            content_root = extracted_items[0] if (len(extracted_items) == 1 and extracted_items[0].is_dir()) else stage_path

            # Copy files into app_dir (safe overwrite of program files)
            for item in content_root.iterdir():
                dest = self.app_dir / item.name
                if item.is_dir():
                    if dest.exists():
                        shutil.rmtree(dest)
                    shutil.copytree(item, dest)
                else:
                    shutil.copy2(item, dest)

            # Update version.json
            v_data = {"version": new_version, "notes": notes, "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")}
            (self.app_dir / "version.json").write_text(json.dumps(v_data, indent=2))


class UpdaterGUI:
    def __init__(self, root, service: UpdateService):
        self.root = root
        self.service = service
        self.update_info = None

        self.root.title("Launch Control Updater")
        self.root.geometry("540x400")
        self.root.minsize(480, 360)
        self.root.configure(bg="#1e1e24")

        self.build_ui()
        self.start_check_thread()

    def build_ui(self):
        import tkinter as tk
        from tkinter import ttk

        # Styling
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TProgressbar", thickness=18, troughcolor="#2a2a35", background="#4e8cff")

        # Header Frame
        header = tk.Frame(self.root, bg="#1e1e24", pady=15)
        header.pack(fill="x", padx=20)

        title = tk.Label(header, text="🚀 Launch Control Updater", font=("Helvetica", 16, "bold"), fg="#ffffff", bg="#1e1e24")
        title.pack(anchor="w")

        cur_v, _ = get_current_version(self.service.app_dir)
        self.lbl_version = tk.Label(header, text=f"Installed Version: v{cur_v}", font=("Helvetica", 10), fg="#a0a0b0", bg="#1e1e24")
        self.lbl_version.pack(anchor="w", pady=(2, 0))

        # Status Label
        self.lbl_status = tk.Label(self.root, text="Checking for updates...", font=("Helvetica", 12), fg="#61afef", bg="#1e1e24")
        self.lbl_status.pack(pady=(10, 5), padx=20, anchor="w")

        # Progress bar
        self.progress = ttk.Progressbar(self.root, orient="horizontal", mode="indeterminate", style="TProgressbar")
        self.progress.pack(fill="x", padx=20, pady=5)
        self.progress.start(10)

        self.lbl_progress_detail = tk.Label(self.root, text="", font=("Helvetica", 9), fg="#888899", bg="#1e1e24")
        self.lbl_progress_detail.pack(padx=20, anchor="w")

        # Notes Box
        tk.Label(self.root, text="Release Notes:", font=("Helvetica", 10, "bold"), fg="#cccccc", bg="#1e1e24").pack(padx=20, anchor="w", pady=(10, 2))
        self.txt_notes = tk.Text(self.root, height=7, bg="#2a2a35", fg="#e0e0e0", relief="flat", font=("Helvetica", 9), padx=8, pady=8)
        self.txt_notes.pack(fill="both", expand=True, padx=20, pady=(0, 15))
        self.txt_notes.insert("1.0", "Checking for latest changes...")
        self.txt_notes.configure(state="disabled")

        # Buttons Frame
        btn_frame = tk.Frame(self.root, bg="#1e1e24", pady=10)
        btn_frame.pack(fill="x", padx=20)

        self.btn_action = tk.Button(btn_frame, text="Update Now", font=("Helvetica", 10, "bold"), bg="#4e8cff", fg="#ffffff", activebackground="#3a75e0", activeforeground="#ffffff", relief="flat", padx=15, pady=6, state="disabled", command=self.start_update_thread)
        self.btn_action.pack(side="right", padx=(10, 0))

        self.btn_secondary = tk.Button(btn_frame, text="Check Again", font=("Helvetica", 10), bg="#383845", fg="#e0e0e0", activebackground="#454555", activeforeground="#ffffff", relief="flat", padx=15, pady=6, command=self.start_check_thread)
        self.btn_secondary.pack(side="right")

    def set_notes(self, text):
        self.txt_notes.configure(state="normal")
        self.txt_notes.delete("1.0", "end")
        self.txt_notes.insert("1.0", text)
        self.txt_notes.configure(state="disabled")

    def start_check_thread(self):
        self.lbl_status.config(text="Connecting to update server...", fg="#61afef")
        self.progress.config(mode="indeterminate")
        self.progress.start(10)
        self.lbl_progress_detail.config(text="")
        self.btn_action.config(state="disabled", text="Update Now")
        self.btn_secondary.config(state="disabled")

        threading.Thread(target=self._run_check, daemon=True).start()

    def _run_check(self):
        try:
            info = self.service.check_for_update()
            self.root.after(0, self._on_check_complete, info, None)
        except Exception as e:
            self.root.after(0, self._on_check_complete, None, str(e))

    def _on_check_complete(self, info, err):
        self.progress.stop()
        self.btn_secondary.config(state="normal")

        if err:
            self.lbl_status.config(text="Network Error or Check Failed", fg="#e06c75")
            self.lbl_progress_detail.config(text=err)
            self.set_notes("Could not connect to the update service. Please verify your connection or try again later.")
            return

        self.update_info = info
        self.set_notes(info["notes"])

        if info["has_update"]:
            self.lbl_status.config(text=f"✨ Update Available: v{info['remote_version']}", fg="#98c379")
            self.lbl_progress_detail.config(text="Click 'Update Now' to download and apply.")
            self.btn_action.config(state="normal" if info["asset_url"] else "disabled", text="Update Now")
        else:
            self.lbl_status.config(text="✓ Launch Control is up to date!", fg="#98c379")
            self.lbl_progress_detail.config(text=f"Version v{info['current_version']} is the latest release.")
            self.btn_action.config(state="normal", text="Launch Games", command=self.launch_app)

    def start_update_thread(self):
        if not self.update_info or not self.update_info["asset_url"]:
            return

        self.btn_action.config(state="disabled")
        self.btn_secondary.config(state="disabled")
        self.lbl_status.config(text="Downloading update...", fg="#61afef")
        self.progress.config(mode="determinate", value=0, maximum=100)

        threading.Thread(target=self._run_update, daemon=True).start()

    def _run_update(self):
        try:
            with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tf:
                tmp_archive = Path(tf.name)

            def on_progress(done, total):
                if total > 0:
                    pct = int((done / total) * 100)
                    mb_done = done / (1024 * 1024)
                    mb_tot = total / (1024 * 1024)
                    msg = f"{mb_done:.1f} MB / {mb_tot:.1f} MB ({pct}%)"
                    self.root.after(0, lambda: self._update_progress_bar(pct, msg))

            self.service.download_asset(self.update_info["asset_url"], tmp_archive, on_progress)

            self.root.after(0, lambda: self.lbl_status.config(text="Applying updates..."))
            self.service.apply_update(tmp_archive, self.update_info["remote_version"], self.update_info["notes"])
            tmp_archive.unlink(missing_ok=True)

            self.root.after(0, self._on_update_success)
        except Exception as e:
            self.root.after(0, self._on_update_failed, str(e))

    def _update_progress_bar(self, val, detail):
        self.progress["value"] = val
        self.lbl_progress_detail.config(text=detail)

    def _on_update_success(self):
        self.progress["value"] = 100
        cur_v, _ = get_current_version(self.service.app_dir)
        self.lbl_version.config(text=f"Installed Version: v{cur_v}")
        self.lbl_status.config(text="🎉 Update Complete!", fg="#98c379")
        self.lbl_progress_detail.config(text="Launch Control has been updated to the latest version.")
        self.btn_action.config(state="normal", text="Launch Games", command=self.launch_app)
        self.btn_secondary.config(state="normal", text="Exit", command=self.root.destroy)

    def _on_update_failed(self, err):
        self.lbl_status.config(text="Update Failed", fg="#e06c75")
        self.lbl_progress_detail.config(text=err)
        self.btn_secondary.config(state="normal", text="Check Again", command=self.start_check_thread)

    def launch_app(self):
        launcher_py = self.service.app_dir / "launchcontrol.py"
        launcher_bin = self.service.app_dir / ("launchcontrol.exe" if sys.platform.startswith("win") else "launchcontrol")

        cmd = [str(launcher_bin)] if launcher_bin.exists() else [sys.executable, str(launcher_py)]
        popen_kwargs = {"cwd": str(self.service.app_dir)}
        if sys.platform.startswith("win"):
            popen_kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
        else:
            popen_kwargs["start_new_session"] = True
        subprocess.Popen(cmd, **popen_kwargs)
        self.root.destroy()


def main():
    ap = argparse.ArgumentParser(description="Launch Control Standalone Updater")
    ap.add_argument("--app-dir", type=Path, default=Path(__file__).resolve().parent.parent)
    ap.add_argument("--repo", default=DEFAULT_REPO)
    ap.add_argument("--token", default=None)
    ap.add_argument("--api-url", default=None, help="Custom API URL for local testing")
    args = ap.parse_args()

    service = UpdateService(app_dir=args.app_dir, repo=args.repo, token=args.token, api_url=args.api_url)

    # CLI check mode if no DISPLAY available (POSIX only, Windows handles GUI without DISPLAY)
    if not sys.platform.startswith("win") and not os.environ.get("DISPLAY"):
        print("[Updater] No GUI display detected. Running CLI check...")
        try:
            info = service.check_for_update()
            print(f"Current: v{info['current_version']} | Remote: v{info['remote_version']} | Update Available: {info['has_update']}")
            if info["has_update"] and info["asset_url"]:
                print(f"Update asset: {info['asset_url']}")
        except Exception as e:
            print(f"[Updater] Error: {e}", file=sys.stderr)
        return

    import tkinter as tk
    root = tk.Tk()
    UpdaterGUI(root, service)
    root.mainloop()


if __name__ == "__main__":
    main()
