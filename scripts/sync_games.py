#!/usr/bin/env python3
"""Copy games listed in LaunchControl/games.json into LaunchControlDist/games/<slug>/,
skipping anything matched by packaging/exclude_patterns.txt.

Never modifies the source (dev) folders. Re-run any time to refresh copies.

Usage: scripts/sync_games.py [--dry-run] [--src-registry PATH] [game_slug ...]
"""
import argparse
import fnmatch
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAMES_DIR = ROOT / "games"
DEFAULT_REGISTRY = ROOT.parent / "LaunchControl" / "games.json"


def load_patterns():
    pats = []
    for line in (ROOT / "packaging" / "exclude_patterns.txt").read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            pats.append(line.lower())
    return pats


def is_excluded(rel: Path, patterns) -> bool:
    return any(fnmatch.fnmatch(part.lower(), p) for part in rel.parts for p in patterns)


def slug_for(game) -> str:
    return Path(game["dir"]).name.lower()


def copy_game(src: Path, dst: Path, patterns, dry: bool):
    copied = skipped = 0
    size = 0
    if dst.exists() and not dry:
        shutil.rmtree(dst)
    for f in sorted(src.rglob("*")):
        rel = f.relative_to(src)
        if is_excluded(rel, patterns):
            skipped += 1
            continue
        if f.is_file():
            copied += 1
            size += f.stat().st_size
            if not dry:
                (dst / rel).parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(f, dst / rel)
    return copied, skipped, size


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--src-registry", type=Path, default=DEFAULT_REGISTRY)
    ap.add_argument("only", nargs="*")
    a = ap.parse_args()

    patterns = load_patterns()
    games = json.loads(a.src_registry.read_text())
    total = 0
    for g in games:
        slug = slug_for(g)
        if a.only and slug not in a.only:
            continue
        src = Path(g["dir"])
        if not src.is_dir():
            print(f"!! {slug}: source missing {src}", file=sys.stderr)
            continue
        c, s, size = copy_game(src, GAMES_DIR / slug, patterns, a.dry_run)
        total += size
        print(f"{slug:20} {c:5} files  {size/1e6:8.1f} MB   ({s} excluded entries)")
    print(f"{'TOTAL':20} {'':11} {total/1e6:8.1f} MB" + ("  [dry run]" if a.dry_run else ""))


if __name__ == "__main__":
    main()
