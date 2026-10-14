#!/usr/bin/env python3
"""Milestone 2: Automated Update Simulation Test.

Mocks the GitHub release API, spins up a local server serving a v0.2.0 update package,
runs UpdateService to detect, download, and apply the update, and validates file integrity.
"""
import http.server
import json
import os
import shutil
import socketserver
import sys
import tarfile
import tempfile
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from updater.updater import UpdateService


def create_mock_release_package(dest_tar: Path):
    with tempfile.TemporaryDirectory() as pkg_dir:
        p = Path(pkg_dir)
        (p / "version.json").write_text(json.dumps({"version": "0.2.0", "notes": "Test release with new feature"}))
        (p / "UPDATE_SUCCESS.txt").write_text("Update simulation was successful!\n")
        (p / "games.json").write_text("[]")

        with tarfile.open(dest_tar, "w:gz") as tar:
            for item in p.iterdir():
                tar.add(item, arcname=item.name)


def run_test():
    with tempfile.TemporaryDirectory() as srv_dir, tempfile.TemporaryDirectory() as client_dir:
        s_path = Path(srv_dir)
        c_path = Path(client_dir)

        # 1. Setup client baseline v0.1.0
        (c_path / "version.json").write_text(json.dumps({"version": "0.1.0"}))
        (c_path / "original_file.txt").write_text("Existing game file")

        # 2. Build mock update archive
        pkg_tar = s_path / "LaunchControl-v0.2.0-linux-x86_64.tar.gz"
        create_mock_release_package(pkg_tar)

        # 3. Create mock release metadata
        port = 9876
        release_meta = {
            "tag_name": "v0.2.0",
            "body": "✨ Test Update v0.2.0:\n- High performance update engine\n- Verified game saves",
            "assets": [
                {
                    "name": pkg_tar.name,
                    "browser_download_url": f"http://127.0.0.1:{port}/{pkg_tar.name}",
                }
            ],
        }
        (s_path / "latest.json").write_text(json.dumps(release_meta))

        # 4. Start local mock HTTP server
        class SrvHandler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=str(s_path), **kwargs)

            def log_message(self, format, *args):
                pass

        httpd = socketserver.TCPServer(("127.0.0.1", port), SrvHandler)
        srv_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        srv_thread.start()
        time.sleep(0.5)

        try:
            print("Running UpdateService against mock release API...")
            service = UpdateService(
                app_dir=c_path,
                api_url=f"http://127.0.0.1:{port}/latest.json",
            )

            # Check
            info = service.check_for_update()
            print("Check result:", info)
            assert info["has_update"] is True, "Expected has_update == True"
            assert info["remote_version"] == "0.2.0", f"Expected remote 0.2.0, got {info['remote_version']}"

            # Download
            download_dest = c_path / "temp_download.tar.gz"
            progresses = []

            def on_prog(done, total):
                progresses.append((done, total))

            service.download_asset(info["asset_url"], download_dest, on_prog)
            assert download_dest.exists(), "Download target does not exist"
            print(f"Downloaded {download_dest.stat().st_size} bytes successfully (progress ticks: {len(progresses)}).")

            # Apply
            service.apply_update(download_dest, info["remote_version"], info["notes"])
            download_dest.unlink(missing_ok=True)

            # Verify
            new_v_data = json.loads((c_path / "version.json").read_text())
            print("Updated version.json:", new_v_data)
            assert new_v_data["version"] == "0.2.0", "Version was not updated to 0.2.0"
            assert (c_path / "UPDATE_SUCCESS.txt").exists(), "UPDATE_SUCCESS.txt was not extracted!"

            print("\n==========================================")
            print("MILESTONE 2: UPDATE SIMULATION TEST PASSED!")
            print("==========================================")
        finally:
            httpd.shutdown()
            httpd.server_close()


if __name__ == "__main__":
    run_test()
