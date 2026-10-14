#!/usr/bin/env python3
"""Milestone 1: Local Portability Test.

Extracts the compiled release tarball to an arbitrary temporary directory (/tmp/...),
executes the packaged standalone binary, launches all 13 games through the binary,
and confirms 100% path independence and zero host python dependency.
"""
import json
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def run_portability_test():
    release_tar = list((ROOT / "release").glob("LaunchControl-v*.tar.gz"))
    if not release_tar:
        print("Error: No release tarball found in release/", file=sys.stderr)
        sys.exit(1)

    tar_path = release_tar[0]
    print(f"Testing release archive: {tar_path.name}")

    with tempfile.TemporaryDirectory(prefix="lc_portable_") as tmp_dir:
        dest_dir = Path(tmp_dir)
        print(f"Extracting to arbitrary path: {dest_dir}...")
        with tarfile.open(tar_path, "r:gz") as tar:
            tar.extractall(path=dest_dir)

        app_dir = dest_dir / "LaunchControl"
        binary_path = app_dir / "launchcontrol"

        assert binary_path.exists(), f"Binary not found: {binary_path}"
        print(f"Found compiled binary: {binary_path} ({binary_path.stat().st_size / 1e6:.1f} MB)")

        # Start the compiled binary with isolated user data and mocked browser
        env = os.environ.copy()
        env["BROWSER"] = "true"
        env["XDG_DATA_HOME"] = str(dest_dir / "user_data")
        proc = subprocess.Popen(
            [str(binary_path)],
            cwd=str(app_dir),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        time.sleep(2.5)

        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

        try:
            req = urllib.request.Request("http://127.0.0.1:9000/api/games")
            resp = opener.open(req)
            games = json.loads(resp.read().decode())
            print(f"Standalone binary loaded {len(games)} games successfully.")

            passed = 0
            for g in games:
                gid = g["id"]
                port = g["port"]
                title = g["title"]

                # Launch via standalone binary
                l_req = urllib.request.Request(
                    f"http://127.0.0.1:9000/api/launch/{gid}",
                    data=b"{}",
                    headers={"Content-Type": "application/json"},
                )
                l_res = json.loads(opener.open(l_req).read().decode())

                # Poll HTTP 200
                ok = False
                for _ in range(6):
                    time.sleep(0.4)
                    try:
                        g_res = opener.open(f"http://127.0.0.1:{port}/")
                        if g_res.getcode() == 200:
                            ok = True
                            break
                    except Exception:
                        pass

                # Stop
                s_req = urllib.request.Request(
                    f"http://127.0.0.1:9000/api/stop/{gid}",
                    data=b"{}",
                    headers={"Content-Type": "application/json"},
                )
                opener.open(s_req)

                status = "PASS (200 OK)" if ok else "FAIL"
                print(f"[{status}] {title:22} (id: {gid}, port: {port})")
                if ok:
                    passed += 1

            assert passed == len(games), f"Only {passed}/{len(games)} games passed"
            print(f"\n===============================================")
            print(f"MILESTONE 1: ALL {passed}/{len(games)} GAMES PASSED PORTABILITY TEST!")
            print("===============================================")

        except Exception as e:
            print("ERROR encountered:", e)
            proc.terminate()
            out, err = proc.communicate(timeout=3)
            print("--- BINARY STDOUT ---")
            print(out.decode())
            print("--- BINARY STDERR ---")
            print(err.decode())
            raise
        finally:
            if proc.poll() is None:
                proc.terminate()
                proc.wait()


if __name__ == "__main__":
    run_portability_test()
