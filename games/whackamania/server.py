#!/usr/bin/env python3
import os
from app import app, DEFAULT_PORT, GAME_VERSION

if __name__ == '__main__':
    port = int(os.environ.get('PORT', DEFAULT_PORT))
    app.run(debug=True, host='0.0.0.0', port=port)
