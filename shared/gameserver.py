"""Game runner/server dispatcher.

Runs a single game process (either static HTTP or Flask application) in an isolated,
self-contained runtime context with dedicated working directory and user save state.
"""
import http.server
import importlib.util
import json
import os
import shutil
import socketserver
import sys
from pathlib import Path

from shared.paths import get_app_root, get_saves_dir, get_user_games_path


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP Request handler with cache disabling for local game assets."""

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def find_game(game_id: str):
    root = get_app_root()
    main_games_file = root / "games.json"
    games = []
    if main_games_file.exists():
        try:
            games.extend(json.loads(main_games_file.read_text()))
        except Exception as e:
            print(f"[GameServer] Error reading games.json: {e}", file=sys.stderr)

    user_games_file = get_user_games_path()
    if user_games_file.exists():
        try:
            games.extend(json.loads(user_games_file.read_text()))
        except Exception as e:
            print(f"[GameServer] Error reading user_games.json: {e}", file=sys.stderr)

    for g in games:
        if str(g.get("id")) == str(game_id):
            return g
    return None


def run_static_server(game_dir: Path, port: int):
    os.chdir(str(game_dir))
    handler = NoCacheHandler

    class ReusableTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    print(f"[GameServer] Serving static game from {game_dir} on 127.0.0.1:{port}")
    with ReusableTCPServer(("127.0.0.1", port), handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[GameServer] Stopping static server...")


def run_flask_app(game_dir: Path, port: int, entry_file: str):
    os.chdir(str(game_dir))
    if str(game_dir) not in sys.path:
        sys.path.insert(0, str(game_dir))

    entry_path = game_dir / entry_file
    if not entry_path.exists():
        raise FileNotFoundError(f"Flask entry file not found: {entry_path}")

    # Dynamically load the python module
    module_name = entry_path.stem
    spec = importlib.util.spec_from_file_location(module_name, str(entry_path))
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load spec for {entry_path}")

    mod = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = mod
    spec.loader.exec_module(mod)

    app = getattr(mod, "app", None)
    if app is None:
        raise AttributeError(f"Module {module_name} does not define 'app'")

    print(f"[GameServer] Running Flask app '{module_name}' on 127.0.0.1:{port}")
    # Disable reloader/debug in production runner to ensure clean process control
    app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False)


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 -m shared.gameserver <game_id>", file=sys.stderr)
        sys.exit(1)

    game_id = sys.argv[1]
    game = find_game(game_id)
    if not game:
        print(f"[GameServer] Error: Game ID '{game_id}' not found.", file=sys.stderr)
        sys.exit(1)

    root = get_app_root()
    raw_dir = Path(game["dir"])
    game_dir = raw_dir if raw_dir.is_absolute() else (root / raw_dir).resolve()

    if not game_dir.exists():
        print(f"[GameServer] Error: Game directory does not exist: {game_dir}", file=sys.stderr)
        sys.exit(1)

    # Establish user save state isolation
    saves_dir = get_saves_dir(game_id)
    os.environ["GAME_USER_DATA_DIR"] = str(saves_dir)

    # Seed default save files if needed
    for seed_file in ("leaderboard.json", "highscores.json"):
        src = game_dir / seed_file
        dst = saves_dir / seed_file
        if src.exists() and not dst.exists():
            try:
                shutil.copy2(src, dst)
            except Exception as e:
                print(f"[GameServer] Notice: could not seed {seed_file}: {e}", file=sys.stderr)

    port = int(game.get("port", 8000))
    game_type = game.get("type", "static")

    if game_type == "flask":
        entry = game.get("entry", "app.py")
        run_flask_app(game_dir, port, entry)
    else:
        run_static_server(game_dir, port)


if __name__ == "__main__":
    main()
