#!/usr/bin/env python3
"""BuzzBee Game Server - Flask backend"""

from flask import Flask, render_template, jsonify, request
import json
import time
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

# In-memory leaderboard (persisted to file)
LEADERBOARD_FILE = 'leaderboard.json'

def load_leaderboard():
    if os.path.exists(LEADERBOARD_FILE):
        with open(LEADERBOARD_FILE, 'r') as f:
            return json.load(f)
    return []

def save_leaderboard(data):
    with open(LEADERBOARD_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    board = load_leaderboard()
    # Sort by score descending, return top 10
    board.sort(key=lambda x: x['score'], reverse=True)
    return jsonify(board[:10])

@app.route('/api/leaderboard', methods=['POST'])
def post_score():
    data = request.get_json()
    name = data.get('name', 'Anonymous')[:20]
    score = int(data.get('score', 0))
    wave = int(data.get('wave', 1))
    
    board = load_leaderboard()
    board.append({
        'name': name,
        'score': score,
        'wave': wave,
        'timestamp': time.strftime('%Y-%m-%d %H:%M')
    })
    # Keep only top 50
    board.sort(key=lambda x: x['score'], reverse=True)
    board = board[:50]
    save_leaderboard(board)
    
    return jsonify({'status': 'ok', 'rank': next(
        (i+1 for i, e in enumerate(board) if e['name'] == name and e['score'] == score),
        len(board)
    )})

@app.route('/api/gameconfig', methods=['GET'])
def get_config():
    """Return server-side game configuration"""
    return jsonify({
        'version': '1.0.0',
        'difficulty': {
            'easy':   {'spawnRate': 0.6, 'enemySpeed': 0.7, 'nectarCount': 3},
            'normal': {'spawnRate': 1.0, 'enemySpeed': 1.0, 'nectarCount': 2},
            'hard':   {'spawnRate': 1.5, 'enemySpeed': 1.4, 'nectarCount': 1},
        },
        'scoring': {
            'yellowPollen': 10,
            'stingThief': 50,
            'stingSpray': 30,
            'nectarStolen': -100,
            'badPollenHit': -20,
            'comboMultiplier': 1.5,
        }
    })

if __name__ == '__main__':
    print("🐝 BuzzBee Game Server starting on http://localhost:8008")
    app.run(debug=True, host='0.0.0.0', port=8008)
