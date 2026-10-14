import os
import json
from flask import Flask, send_from_directory, request, jsonify

app = Flask(__name__, static_folder='static')

HIGHSCORES_FILE = 'highscores.json'

def load_scores():
    if not os.path.exists(HIGHSCORES_FILE):
        return []
    try:
        with open(HIGHSCORES_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return []

def save_scores(scores):
    with open(HIGHSCORES_FILE, 'w') as f:
        json.dump(scores, f, indent=4)

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/scores', methods=['GET'])
def get_scores():
    return jsonify(load_scores())

@app.route('/api/scores', methods=['POST'])
def post_score():
    try:
        new_score = request.get_json()
        if not new_score:
            print("Error: Received empty JSON")
            return jsonify({"error": "No data received"}), 400
            
        print(f"Adding new score: {new_score}")
        scores = load_scores()
        scores.append(new_score)
        # Sort by score (integer), handling missing keys safely
        scores.sort(key=lambda x: x.get('score', 0), reverse=True)
        scores = scores[:10]  # Keep top 10
        save_scores(scores)
        return jsonify(scores)
    except Exception as e:
        print(f"Error processing score: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True, port=8010)
