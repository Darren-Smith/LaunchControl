#!/usr/bin/env python3
"""Launch Control - Portable Game Launcher & Runner.

Serves the Launch Control web UI on http://127.0.0.1:9000 and dispatches child
game processes in a fully isolated, portable environment.
"""
import json
import os
import subprocess
import sys
import threading
import time
import uuid
import webbrowser
from pathlib import Path

# Add project root to sys.path
_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from shared.paths import (
    get_app_root,
    get_favourites_path,
    get_saves_dir,
    get_user_data_dir,
    get_user_games_dir,
    get_user_games_path,
)

# If invoked with --run-game, act as the game runner child process
if len(sys.argv) >= 3 and sys.argv[1] == "--run-game":
    from shared import gameserver
    sys.argv = [sys.argv[0], sys.argv[2]]
    gameserver.main()
    sys.exit(0)

from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder="static")

running_processes = {}
process_logs = {}


def load_bundled_games():
    games_file = get_app_root() / "games.json"
    if not games_file.exists():
        return []
    try:
        return json.loads(games_file.read_text())
    except Exception as e:
        print(f"[Launcher] Error reading bundled games.json: {e}", file=sys.stderr)
        return []


def load_user_games():
    path = get_user_games_path()
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text())
    except Exception as e:
        print(f"[Launcher] Error reading user_games.json: {e}", file=sys.stderr)
        return []


def save_user_games(games):
    path = get_user_games_path()
    try:
        path.write_text(json.dumps(games, indent=2))
        return True
    except Exception as e:
        print(f"[Launcher] Error saving user_games.json: {e}", file=sys.stderr)
        return False


def load_favourites():
    path = get_favourites_path()
    if not path.exists():
        return set()
    try:
        return set(json.loads(path.read_text()))
    except Exception:
        return set()


def save_favourites(favs_set):
    path = get_favourites_path()
    try:
        path.write_text(json.dumps(sorted(list(favs_set)), indent=2))
        return True
    except Exception as e:
        print(f"[Launcher] Error saving favourites: {e}", file=sys.stderr)
        return False


def get_all_games():
    bundled = load_bundled_games()
    user = load_user_games()
    favs = load_favourites()

    all_games = []
    seen_ids = set()

    for g in bundled:
        gid = str(g.get("id"))
        seen_ids.add(gid)
        item = dict(g)
        item["favourite"] = gid in favs
        item["is_bundled"] = True
        all_games.append(item)

    for g in user:
        gid = str(g.get("id"))
        if gid not in seen_ids:
            seen_ids.add(gid)
            item = dict(g)
            item["favourite"] = gid in favs
            item["is_bundled"] = False
            all_games.append(item)

    return all_games


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/api/games", methods=["GET"])
def api_get_games():
    games = get_all_games()
    now = time.time()
    root = get_app_root()

    for game in games:
        gid = str(game.get("id"))
        proc = running_processes.get(gid)
        game["running"] = proc is not None and proc.poll() is None

        # Check if dir was modified recently
        raw_dir = Path(game.get("dir", ""))
        full_dir = raw_dir if raw_dir.is_absolute() else root / raw_dir
        game["is_new"] = False
        if full_dir.exists():
            try:
                mtime = full_dir.stat().st_mtime
                if (now - mtime) <= (30 * 24 * 60 * 60):
                    game["is_new"] = True
            except Exception:
                pass

    return jsonify(games)


@app.route("/api/toggle_favourite/<game_id>", methods=["POST"])
def api_toggle_favourite(game_id):
    favs = load_favourites()
    gid = str(game_id)
    if gid in favs:
        favs.remove(gid)
        new_state = False
    else:
        favs.add(gid)
        new_state = True

    if save_favourites(favs):
        return jsonify({"status": "success", "favourite": new_state})
    return jsonify({"error": "Failed to save favourite state"}), 500


@app.route("/api/launch/<game_id>", methods=["POST"])
def api_launch(game_id):
    gid = str(game_id)
    games = get_all_games()
    game = next((g for g in games if str(g.get("id")) == gid), None)

    if not game:
        return jsonify({"error": "Game not found"}), 404

    # Check if process is already running
    if gid in running_processes:
        proc = running_processes[gid]
        if proc.poll() is None:
            return jsonify({
                "status": "already_running",
                "port": game.get("port"),
                "url": f"http://localhost:{game.get('port')}",
            })

    root = get_app_root()
    raw_dir = Path(game.get("dir", ""))
    game_dir = raw_dir if raw_dir.is_absolute() else (root / raw_dir).resolve()

    if not game_dir.exists():
        return jsonify({"error": f"Game directory not found: {game_dir}"}), 404

    logs_dir = get_user_data_dir() / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_file_path = logs_dir / f"{gid}.log"

    try:
        log_file = open(log_file_path, "w")
        process_logs[gid] = log_file

        env = os.environ.copy()
        env.pop("WERKZEUG_SERVER_FD", None)
        env.pop("WERKZEUG_RUN_MAIN", None)
        env["GAME_USER_DATA_DIR"] = str(get_saves_dir(gid))

        # Command determination:
        # Bundled games or user python games use the built-in self-dispatch runner.
        if getattr(sys, "frozen", False):
            cmd = [sys.executable, "--run-game", gid]
        else:
            entry_script = Path(__file__).resolve()
            cmd = [sys.executable, str(entry_script), "--run-game", gid]

        print(f"[Launcher] Launching {game.get('title')} via {cmd} in {game_dir}...")
        proc = subprocess.Popen(
            cmd,
            cwd=str(game_dir),
            stdout=log_file,
            stderr=subprocess.STDOUT,
            start_new_session=True,
            env=env,
        )
        running_processes[gid] = proc

        # Give process time to bind port
        time.sleep(1.5)

        if proc.poll() is not None:
            with open(log_file_path, "r") as f:
                err = f.read()
            return jsonify({"error": f"Game process exited immediately: {err}"}), 500

        port = game.get("port")
        return jsonify({
            "status": "started",
            "port": port,
            "url": f"http://localhost:{port}",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/stop/<game_id>", methods=["POST"])
def api_stop(game_id):
    gid = str(game_id)
    if gid in running_processes:
        proc = running_processes[gid]
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                proc.kill()
        del running_processes[gid]
        if gid in process_logs:
            try:
                process_logs[gid].close()
            except Exception:
                pass
            del process_logs[gid]
        return jsonify({"status": "stopped"})
    return jsonify({"status": "not_running"})


@app.route("/api/stop_all", methods=["POST"])
def api_stop_all():
    stopped = []
    for gid in list(running_processes.keys()):
        proc = running_processes[gid]
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                proc.kill()
        del running_processes[gid]
        stopped.append(gid)
        if gid in process_logs:
            try:
                process_logs[gid].close()
            except Exception:
                pass
            del process_logs[gid]
    return jsonify({"status": "all_stopped", "stopped": stopped})


def detect_game_details(dir_path):
    p = Path(dir_path)
    if not p.is_dir():
        return {}

    folder_name = p.name
    files = [f.name for f in p.iterdir() if f.is_file()]

    game_type = "static"
    entry = ""
    if "index.html" in files:
        game_type = "static"
    elif "app.py" in files:
        game_type = "flask"
        entry = "app.py"
    elif "server.py" in files:
        game_type = "flask"
        entry = "server.py"

    return {
        "folder_name": folder_name,
        "suggested_title": folder_name.replace("_", " ").title(),
        "type": game_type,
        "entry": entry,
    }


@app.route("/api/inspect_folder", methods=["POST"])
def api_inspect_folder():
    data = request.json or {}
    dir_path = data.get("dir", "")
    if not dir_path or not Path(dir_path).is_dir():
        return jsonify({"error": "Directory not found"}), 404
    details = detect_game_details(dir_path)
    return jsonify({"status": "success", **details})


@app.route("/api/browse_dir", methods=["GET", "POST"])
def api_browse_dir():
    data = request.json if (request.is_json and request.json) else {}
    target_dir = request.args.get("path") or data.get("path") or str(get_user_games_dir())

    target_path = Path(target_dir).resolve()
    if not target_path.is_dir():
        target_path = Path.home()

    folders = []
    try:
        for entry in sorted(target_path.iterdir()):
            if entry.name.startswith("."):
                continue
            if entry.is_dir():
                folders.append({"name": entry.name, "path": str(entry)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    parent_dir = str(target_path.parent) if target_path != target_path.parent else None
    return jsonify({
        "current": str(target_path),
        "parent": parent_dir,
        "folders": folders,
    })


@app.route("/api/select_folder", methods=["GET", "POST"])
def api_select_folder():
    data = request.json if (request.is_json and request.json) else {}
    initial_dir = data.get("initial_dir") or str(get_user_games_dir())
    if not Path(initial_dir).is_dir():
        initial_dir = str(Path.home())

    zenity_bin = "/usr/bin/zenity"
    if not os.path.exists(zenity_bin):
        return jsonify({"status": "fallback", "message": "Zenity not installed"}), 200

    env = os.environ.copy()
    if "DISPLAY" not in env or not env["DISPLAY"]:
        env["DISPLAY"] = ":0"

    try:
        cmd = [
            zenity_bin,
            "--file-selection",
            "--directory",
            "--title=Select Game Directory",
            f"--filename={initial_dir}/",
        ]
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=120)
        if result.returncode == 0:
            selected_path = result.stdout.strip()
            if selected_path:
                details = detect_game_details(selected_path)
                return jsonify({"status": "success", "path": selected_path, **details})
        elif result.returncode in (1, 255):
            return jsonify({"status": "cancelled"})
    except subprocess.TimeoutExpired:
        return jsonify({"status": "timeout", "error": "Folder selection timed out"}), 408
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

    return jsonify({"status": "cancelled"})


@app.route("/api/add_game", methods=["POST"])
def api_add_game():
    new_game = request.json or {}
    if not new_game.get("id"):
        new_game["id"] = str(uuid.uuid4())[:8]

    # Assign default port if missing
    if not new_game.get("port"):
        existing_ports = {int(g.get("port", 0)) for g in get_all_games()}
        candidate = 8020
        while candidate in existing_ports:
            candidate += 1
        new_game["port"] = candidate

    user_games = load_user_games()
    user_games.append(new_game)
    if save_user_games(user_games):
        return jsonify({"status": "success", "game": new_game})
    return jsonify({"error": "Failed to save user game"}), 500


@app.route("/api/edit_game/<game_id>", methods=["POST"])
def api_edit_game(game_id):
    updated = request.json or {}
    user_games = load_user_games()
    gid = str(game_id)

    for i, g in enumerate(user_games):
        if str(g.get("id")) == gid:
            updated["id"] = gid
            user_games[i] = updated
            if save_user_games(user_games):
                return jsonify({"status": "success", "game": updated})
            return jsonify({"error": "Failed to save user game"}), 500

    return jsonify({"error": "Game not found or cannot edit bundled game"}), 404


@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory("static", path)


def open_browser_later():
    time.sleep(1.0)
    try:
        webbrowser.open("http://127.0.0.1:9000")
    except Exception as e:
        print(f"[Launcher] Notice: could not auto-launch browser: {e}", file=sys.stderr)


if __name__ == "__main__":
    print("Starting Launch Control Server on http://127.0.0.1:9000")
    # Only launch browser when running interactively (not under reloader)
    if not os.environ.get("WERKZEUG_RUN_MAIN"):
        threading.Thread(target=open_browser_later, daemon=True).start()
    app.run(host="127.0.0.1", port=9000, debug=False)
