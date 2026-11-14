#!/usr/bin/env python3
"""WoodlandProtector Game Server - Standardized Flask Backend (v1.2.0)"""

import json
import os
import time
try:
    from flask import Flask, Response, jsonify, request, send_from_directory
except ModuleNotFoundError:
    import sys as _sys
    _venv_py = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".venv", "bin", "python")
    if os.path.exists(_venv_py) and os.path.abspath(_sys.executable) != os.path.abspath(_venv_py):
        os.execv(_venv_py, [_venv_py, os.path.abspath(__file__)] + _sys.argv[1:])
    raise

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("GAME_USER_DATA_DIR", BASE_DIR)
HIGHSCORES_FILE = os.path.join(DATA_DIR, "highscores.json")
STORAGE_FILE = os.path.join(DATA_DIR, "storage.json")
GAME_VERSION = "1.2.0"
GAME_ID = "woodland_protector"
SCORE_KEY = "woodland_protector_scores"
DEFAULT_PORT = 8006

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0


@app.after_request
def add_no_cache_headers(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


def load_scores():
    if os.path.exists(HIGHSCORES_FILE):
        try:
            with open(HIGHSCORES_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
        except Exception:
            pass
    return []


def save_scores(scores):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(HIGHSCORES_FILE, "w", encoding="utf-8") as f:
        json.dump(scores, f, indent=2)


def load_storage():
    if os.path.exists(STORAGE_FILE):
        try:
            with open(STORAGE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
        except Exception:
            pass
    return {}


def save_storage(data):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(STORAGE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/api/version", methods=["GET"])
def api_version():
    return jsonify({"version": GAME_VERSION, "game": GAME_ID})


@app.route("/api/init_state", methods=["GET"])
def api_init_state():
    scores = load_scores()
    scores.sort(key=lambda x: x.get("score", 0) if isinstance(x, dict) else 0, reverse=True)
    return jsonify({
        "version": GAME_VERSION,
        "score_key": SCORE_KEY,
        "scores": scores[:10],
        "storage": load_storage(),
    })


@app.route("/api/storage", methods=["GET", "POST"])
def api_storage():
    if request.method == "GET":
        return jsonify(load_storage())
    data = request.get_json(silent=True) or {}
    key = data.get("key")
    val = data.get("value")
    if key is not None:
        st = load_storage()
        st[str(key)] = str(val)
        save_storage(st)
    return jsonify({"status": "ok"})


@app.route("/api/scores", methods=["GET"])
@app.route("/api/leaderboard", methods=["GET"])
def get_scores():
    scores = load_scores()
    scores.sort(key=lambda x: x.get("score", 0) if isinstance(x, dict) else 0, reverse=True)
    return jsonify(scores[:10])


@app.route("/api/scores", methods=["POST"])
@app.route("/api/leaderboard", methods=["POST"])
def post_score():
    data = request.get_json(silent=True)
    if isinstance(data, list):
        data.sort(key=lambda x: x.get("score", 0) if isinstance(x, dict) else 0, reverse=True)
        scores = data[:10]
        save_scores(scores)
        return jsonify(scores)

    entry = dict(data or {})
    entry["name"] = str(entry.get("name", "ANON")).strip()[:16] or "ANON"
    entry["score"] = int(entry.get("score", 0))
    entry.setdefault("date", time.strftime("%Y-%m-%d"))
    entry.setdefault("id", f"score_{int(time.time() * 1000)}")

    scores = load_scores()
    scores.append(entry)
    scores.sort(key=lambda x: x.get("score", 0) if isinstance(x, dict) else 0, reverse=True)
    scores = scores[:10]
    save_scores(scores)
    return jsonify(scores)


@app.route("/flask_sync.js")
def flask_sync_js():
    js_code = '(function() {\n  if (window.__FLASK_SYNC_INITIALIZED__) return;\n  window.__FLASK_SYNC_INITIALIZED__ = true;\n\n  var nativeSetItem = Storage.prototype.setItem;\n  var nativeGetItem = Storage.prototype.getItem;\n  var nativeRemoveItem = Storage.prototype.removeItem;\n  var isHydrating = false;\n\n  var serverState = {\n    version: "__GAME_VERSION__",\n    score_key: "__SCORE_KEY__",\n    scores: [],\n    storage: {}\n  };\n\n  // 1. Synchronous initial hydration from Flask backend before game scripts run\n  try {\n    var xhr = new XMLHttpRequest();\n    xhr.open("GET", "/api/init_state", false);\n    xhr.send(null);\n    if (xhr.status === 200) {\n      var data = JSON.parse(xhr.responseText);\n      if (data && typeof data === "object") {\n        serverState = data;\n        isHydrating = true;\n        // Restore key-value storage from server\n        if (data.storage && typeof data.storage === "object") {\n          Object.keys(data.storage).forEach(function(k) {\n            try {\n              nativeSetItem.call(window.localStorage, k, data.storage[k]);\n            } catch (e) {}\n          });\n        }\n        // If server has highscores.json and we have a primary score_key\n        if (Array.isArray(data.scores) && data.scores.length > 0 && data.score_key) {\n          try {\n            nativeSetItem.call(window.localStorage, data.score_key, JSON.stringify(data.scores));\n          } catch (e) {}\n        } else if (data.score_key) {\n          // If server highscores.json is empty, seed server from existing browser localStorage\n          var existingRaw = nativeGetItem.call(window.localStorage, data.score_key);\n          if (existingRaw) {\n            try {\n              var parsed = JSON.parse(existingRaw);\n              if (Array.isArray(parsed) && parsed.length > 0) {\n                fetch("/api/scores", {\n                  method: "POST",\n                  headers: { "Content-Type": "application/json" },\n                  body: JSON.stringify(parsed)\n                }).catch(function() {});\n              }\n            } catch (e) {}\n          }\n        }\n        isHydrating = false;\n      }\n    }\n  } catch (e) {\n    isHydrating = false;\n  }\n\n  // 2. Intercept localStorage.setItem to persist scores & state to Flask backend\n  Storage.prototype.setItem = function(key, value) {\n    nativeSetItem.call(this, key, value);\n    if (this !== window.localStorage || isHydrating) return;\n\n    var strVal = String(value);\n    fetch("/api/storage", {\n      method: "POST",\n      headers: { "Content-Type": "application/json" },\n      body: JSON.stringify({ key: String(key), value: strVal })\n    }).catch(function() {});\n\n    var kLower = String(key).toLowerCase();\n    if (key === serverState.score_key || kLower.indexOf("score") !== -1 || kLower.indexOf("leaderboard") !== -1) {\n      try {\n        var parsed = JSON.parse(strVal);\n        if (Array.isArray(parsed)) {\n          fetch("/api/scores", {\n            method: "POST",\n            headers: { "Content-Type": "application/json" },\n            body: JSON.stringify(parsed)\n          }).catch(function() {});\n        }\n      } catch (e) {}\n    }\n  };\n\n  // 3. Expose global helper API\n  window.FlaskGameServer = {\n    version: "v" + serverState.version,\n    getScores: function() {\n      return fetch("/api/scores", { cache: "no-store" }).then(function(r) { return r.json(); });\n    },\n    postScore: function(entry) {\n      return fetch("/api/scores", {\n        method: "POST",\n        headers: { "Content-Type": "application/json" },\n        body: JSON.stringify(entry)\n      }).then(function(r) { return r.json(); });\n    }\n  };\n\n  // 4. Ensure version badge is visible in bottom-right corner\n  function ensureVersionBadge() {\n    var verText = "v" + (serverState.version || "__GAME_VERSION__");\n    var existing = document.getElementById("game-version") ||\n                   document.querySelector(".version-tag") ||\n                   document.querySelector(".version-badge") ||\n                   document.querySelector(".game-version");\n    if (existing) {\n      existing.textContent = verText;\n    } else if (document.body) {\n      var badge = document.createElement("div");\n      badge.id = "game-version";\n      badge.className = "version-tag";\n      badge.textContent = verText;\n      badge.style.cssText = "position:fixed;bottom:10px;right:14px;z-index:9999;font-family:monospace;font-size:12px;color:rgba(255,255,255,0.65);background:rgba(0,0,0,0.35);padding:2px 8px;border-radius:4px;pointer-events:none;user-select:none;";\n      document.body.appendChild(badge);\n    }\n    var infoVer = document.getElementById("info-version-text") || document.querySelector(".info-version-text");\n    if (infoVer) {\n      infoVer.textContent = verText;\n    }\n  }\n\n  if (document.readyState === "loading") {\n    document.addEventListener("DOMContentLoaded", ensureVersionBadge);\n  } else {\n    ensureVersionBadge();\n  }\n})();\n'
    js_code = js_code.replace("__GAME_VERSION__", GAME_VERSION).replace("__SCORE_KEY__", SCORE_KEY)
    return Response(js_code, mimetype="application/javascript")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(BASE_DIR, filename)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", DEFAULT_PORT))
    print(f"🎮 WoodlandProtector Server (v{GAME_VERSION}) starting on http://localhost:{port}")
    app.run(debug=True, host="0.0.0.0", port=port)
