import os
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    port = 8005
    print(f"Starting Castle Defenders server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
