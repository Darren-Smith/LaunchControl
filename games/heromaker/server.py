from flask import Flask, send_from_directory
import os

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching in dev

# Serve the game root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

# Serve any static file (js/, css, assets/, etc.)
@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(BASE_DIR, filename)

if __name__ == '__main__':
    PORT = 8009
    print(f"Serving HeroMaker at http://localhost:{PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=True)
