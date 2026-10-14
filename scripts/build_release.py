#!/usr/bin/env python3
"""Build & Release Pipeline for Launch Control.

Compiles standalone executable bundle using PyInstaller, embeds all assets,
creates .tar.gz distribution package, generates sha256 checksums, and prepares
release metadata.
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
DIST_DIR = ROOT / "dist" / "LaunchControl"
RELEASE_DIR = ROOT / "release"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser(description="Build Launch Control Distribution Release")
    ap.add_argument("--skip-pyinstaller", action="store_true", help="Skip recompiling binary")
    args = ap.parse_args()

    v_file = ROOT / "version.json"
    v_data = json.loads(v_file.read_text())
    ver = v_data.get("version", "0.1.0")
    print(f"==================================================")
    print(f"Building Launch Control Release v{ver}")
    print(f"==================================================")

    # 1. Compile with PyInstaller
    if not args.skip_pyinstaller:
        print("\n-> Running PyInstaller for LaunchControl...")
        pyinstaller_bin = ROOT / ".venv" / "bin" / "pyinstaller"
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
    shutil.copy2(ROOT / "packaging" / "install.sh", DIST_DIR / "install.sh")
    (DIST_DIR / "install.sh").chmod(0o755)

    shutil.copy2(ROOT / "packaging" / "LaunchControl.desktop", DIST_DIR / "LaunchControl.desktop")
    shutil.copy2(ROOT / "version.json", DIST_DIR / "version.json")
    shutil.copy2(ROOT / "README.md", DIST_DIR / "README.md")

    # Copy updater directory into distribution
    dist_updater = DIST_DIR / "updater"
    dist_updater.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / "updater" / "updater.py", dist_updater / "updater.py")

    # Ensure binary execution permissions
    (DIST_DIR / "launchcontrol").chmod(0o755)

    # 3. Create compressed tarball
    RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    archive_name = f"LaunchControl-v{ver}-linux-x86_64.tar.gz"
    archive_path = RELEASE_DIR / archive_name

    print(f"\n-> Packaging archive {archive_path.name}...")
    with tarfile.open(archive_path, "w:gz") as tar:
        tar.add(DIST_DIR, arcname="LaunchControl")

    size_mb = archive_path.stat().st_size / (1024 * 1024)
    print(f"Package created: {archive_path.name} ({size_mb:.2f} MB)")

    # 4. Generate SHA256 checksums
    checksum = sha256_file(archive_path)
    sums_file = RELEASE_DIR / "SHA256SUMS"
    sums_file.write_text(f"{checksum}  {archive_name}\n")
    print(f"SHA256: {checksum}")

    print("\n==================================================")
    print("Build Complete!")
    print(f"Distribution Archive: {archive_path}")
    print(f"Checksums:            {sums_file}")
    print("==================================================")


if __name__ == "__main__":
    main()
