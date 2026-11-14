#!/usr/bin/env python3
"""Build & Release Pipeline for Launch Control.

Automatically syncs the latest game files and metadata from AntiGravityProjects
and LaunchControl, compiles the standalone executable bundle using PyInstaller,
embeds all assets, creates .tar.gz distribution package, and generates SHA256SUMS.
"""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECTS_ROOT = ROOT.parent
LAUNCH_CONTROL_SRC = PROJECTS_ROOT / "LaunchControl"
DIST_DIR = ROOT / "dist" / "LaunchControl"
RELEASE_DIR = ROOT / "release"

SKIP_SYNC_NAMES = {
    ".git",
    ".venv",
    "venv",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    "launch_error.log",
}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def sync_from_source():
    """Sync latest game files and LaunchControl metadata into LaunchControlDist."""
    print("\n-> Syncing latest LaunchControl metadata & game files from AntiGravityProjects...")
    src_games_file = LAUNCH_CONTROL_SRC / "games.json"
    if not src_games_file.exists():
        print(f"   [!] {src_games_file} not found, skipping source sync.")
        return

    # Sync version.json if newer in LaunchControl
    src_ver_file = LAUNCH_CONTROL_SRC / "version.json"
    if src_ver_file.exists():
        try:
            src_ver = json.loads(src_ver_file.read_text(encoding="utf-8"))
            dst_ver_file = ROOT / "version.json"
            dst_ver = json.loads(dst_ver_file.read_text(encoding="utf-8")) if dst_ver_file.exists() else {}
            dst_ver["version"] = src_ver.get("version", dst_ver.get("version", "0.3.0"))
            dst_ver["notes"] = src_ver.get("notes", dst_ver.get("notes", ""))
            dst_ver_file.write_text(json.dumps(dst_ver, indent=2) + "\n", encoding="utf-8")
        except Exception as e:
            print(f"   [!] Warning syncing version.json: {e}")

    src_games = json.loads(src_games_file.read_text(encoding="utf-8"))
    dist_games_file = ROOT / "games.json"
    existing_dist_games = []
    if dist_games_file.exists():
        try:
            existing_dist_games = json.loads(dist_games_file.read_text(encoding="utf-8"))
        except Exception:
            pass

    existing_by_title = {g.get("title", "").lower(): g for g in existing_dist_games}
    updated_dist_games = []

    for sg in src_games:
        src_dir = Path(sg.get("dir", ""))
        if not src_dir.exists():
            continue

        title_key = sg.get("title", "").lower()
        prev = existing_by_title.get(title_key, {})

        # Keep existing dist slug/dir if present, otherwise derive clean folder slug
        rel_dir = prev.get("dir") or f"games/{src_dir.name.lower()}"
        dest_dir = ROOT / rel_dir
        dest_dir.parent.mkdir(parents=True, exist_ok=True)

        # Copy latest game files (excluding .venv, venv, logs, etc.)
        if dest_dir.exists():
            shutil.rmtree(dest_dir)
        shutil.copytree(
            src_dir,
            dest_dir,
            ignore=lambda d, names: [n for n in names if n in SKIP_SYNC_NAMES or n.startswith(".git")],
        )

        # Determine entry point (server.py or app.py)
        entry = "server.py"
        if (dest_dir / "app.py").exists() and not (dest_dir / "server.py").exists():
            entry = "app.py"
        elif prev.get("entry") and (dest_dir / prev["entry"]).exists():
            entry = prev["entry"]

        game_type = "flask" if (dest_dir / entry).exists() else "static"

        dist_entry = {
            "id": prev.get("id") or sg.get("id") or src_dir.name.lower(),
            "title": sg.get("title", src_dir.name),
            "description": sg.get("description", ""),
            "dir": rel_dir,
            "type": game_type,
            "port": int(sg.get("port", prev.get("port", 8000))),
            "color": sg.get("color", prev.get("color", "#62a0ea")),
            "icon": sg.get("icon", prev.get("icon", "🎮")),
            "version": sg.get("version", prev.get("version", "1.0.0")),
            "released": sg.get("released", prev.get("released", "2026-11-07")),
        }
        if game_type == "flask":
            dist_entry["entry"] = entry

        updated_dist_games.append(dist_entry)
        print(f"   Synced {dist_entry['title']} -> {rel_dir} ({game_type}: {entry}, v{dist_entry['version']})")

    dist_games_file.write_text(json.dumps(updated_dist_games, indent=4) + "\n", encoding="utf-8")
    print(f"-> Updated {dist_games_file} with {len(updated_dist_games)} games.")


def main():
    ap = argparse.ArgumentParser(description="Build Launch Control Distribution Release")
    ap.add_argument("--skip-pyinstaller", action="store_true", help="Skip recompiling binary")
    ap.add_argument("--skip-sync", action="store_true", help="Skip syncing latest game files from AntiGravityProjects")
    args = ap.parse_args()

    if not args.skip_sync:
        sync_from_source()

    v_file = ROOT / "version.json"
    v_data = json.loads(v_file.read_text())
    ver = v_data.get("version", "0.1.0")
    print(f"==================================================")
    print(f"Building Launch Control Release v{ver}")
    print(f"==================================================")

    # 1. Compile with PyInstaller
    if not args.skip_pyinstaller:
        print("\n-> Running PyInstaller for LaunchControl...")
        scripts_dir = "Scripts" if sys.platform.startswith("win") else "bin"
        pyinstaller_name = "pyinstaller.exe" if sys.platform.startswith("win") else "pyinstaller"
        pyinstaller_bin = ROOT / ".venv" / scripts_dir / pyinstaller_name
        if not pyinstaller_bin.exists():
            pyinstaller_bin = Path(shutil.which("pyinstaller") or "pyinstaller")

        cmd = [
            str(pyinstaller_bin),
            str(ROOT / "packaging" / "launchcontrol.spec"),
            "--clean",
            "-y",
        ]
        res = subprocess.run(cmd, cwd=str(ROOT))
        if res.returncode != 0:
            print("PyInstaller build failed!", file=sys.stderr)
            sys.exit(res.returncode)

    if not DIST_DIR.exists():
        print(f"Error: Build directory not found: {DIST_DIR}", file=sys.stderr)
        sys.exit(1)

    # 2. Add installer, desktop file, updater, and documentation to distribution folder
    print("\n-> Adding installer assets to distribution folder...")
    if sys.platform.startswith("win"):
        shutil.copy2(ROOT / "packaging" / "install.bat", DIST_DIR / "install.bat")
    else:
        shutil.copy2(ROOT / "packaging" / "install.sh", DIST_DIR / "install.sh")
        (DIST_DIR / "install.sh").chmod(0o755)
        shutil.copy2(ROOT / "packaging" / "LaunchControl.desktop", DIST_DIR / "LaunchControl.desktop")
        if (DIST_DIR / "launchcontrol").exists():
            (DIST_DIR / "launchcontrol").chmod(0o755)

    shutil.copy2(ROOT / "version.json", DIST_DIR / "version.json")
    shutil.copy2(ROOT / "README.md", DIST_DIR / "README.md")

    # Copy updater directory into distribution
    dist_updater = DIST_DIR / "updater"
    dist_updater.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / "updater" / "updater.py", dist_updater / "updater.py")

    # 3. Create compressed distribution archive
    RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    if sys.platform.startswith("win"):
        import zipfile
        archive_name = f"LaunchControl-v{ver}-windows-x64.zip"
        archive_path = RELEASE_DIR / archive_name
        print(f"\n-> Packaging archive {archive_path.name}...")
        with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for root_folder, _, filenames in os.walk(DIST_DIR):
                for fn in filenames:
                    file_path = Path(root_folder) / fn
                    rel_path = file_path.relative_to(DIST_DIR.parent)
                    zf.write(file_path, arcname=str(rel_path))
    else:
        archive_name = f"LaunchControl-v{ver}-linux-x86_64.tar.gz"
        archive_path = RELEASE_DIR / archive_name
        print(f"\n-> Packaging archive {archive_path.name}...")
        with tarfile.open(archive_path, "w:gz") as tar:
            tar.add(DIST_DIR, arcname="LaunchControl")

    size_mb = archive_path.stat().st_size / (1024 * 1024)
    print(f"Package created: {archive_path.name} ({size_mb:.2f} MB)")

    # 4. Generate/Update SHA256 checksums
    checksum = sha256_file(archive_path)
    sums_file = RELEASE_DIR / "SHA256SUMS"
    entries = {}
    if sums_file.exists():
        for line in sums_file.read_text(encoding="utf-8").splitlines():
            parts = line.strip().split(None, 1)
            if len(parts) == 2:
                entries[parts[1]] = parts[0]
    entries[archive_name] = checksum
    sums_file.write_text(
        "\n".join(f"{h}  {f}" for f, h in sorted(entries.items())) + "\n",
        encoding="utf-8"
    )
    print(f"SHA256: {checksum}")

    print("\n==================================================")
    print("Build Complete!")
    print(f"Distribution Archive: {archive_path}")
    print(f"Checksums:            {sums_file}")
    print("==================================================")


if __name__ == "__main__":
    main()
