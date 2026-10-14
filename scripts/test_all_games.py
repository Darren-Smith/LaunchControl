#!/usr/bin/env python3
"""Automated smoke test for all games in Launch Control.

Launches the Launch Control server, queries /api/games, tests launching every
single game, confirms HTTP 200 response on its allocated port, stops the game,
and reports results.
"""
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    py_exec = sys.executable
    env = os.environ.copy()
    env["BROWSER"] = "true"

    launcher = subprocess.Popen(
        [py_exec, str(ROOT / "launchcontrol.py")],
        cwd=str(ROOT),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    time.sleep(2)

    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

    try:
        req = urllib.request.Request("http://127.0.0.1:9000/api/games")
        games = json.loads(opener.open(req).read().decode())
        print(f"Loaded {len(games)} games from Launch Control.")

        passed = 0
        failed = []

        for g in games:
            gid = g["id"]
            port = g["port"]
            title = g["title"]

            # Launch
            l_req = urllib.request.Request(
                f"http://127.0.0.1:9000/api/launch/{gid}",
                data=b"{}",
                headers={"Content-Type": "application/json"},
            )
            resp = json.loads(opener.open(l_req).read().decode())

            # Poll for HTTP 200
            ok = False
            for _ in range(6):
                time.sleep(0.5)
                try:
                    g_resp = opener.open(f"http://127.0.0.1:{port}/")
                    if g_resp.getcode() == 200:
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
            else:
                failed.append((gid, title, port))

        print(f"\n==========================================")
        print(f"Summary: {passed}/{len(games)} games passed.")
        if failed:
            print(f"Failed: {failed}")
            sys.exit(1)
        print("ALL GAMES PASSED SMOKE TEST!")
        print(f"==========================================")
    finally:
        launcher.terminate()
        launcher.wait()


if __name__ == "__main__":
    main()
