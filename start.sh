#!/bin/bash
# Start Launch Control (installed copy) on http://127.0.0.1:9000 and open the browser.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

if [ ! -x ".venv/bin/python3" ]; then
    echo "Not installed yet - run: bash \"$DIR/install.sh\"" >&2
    exit 1
fi

# If it's already running, just open the browser.
if curl -s -o /dev/null --max-time 2 http://127.0.0.1:9000/api/version; then
    xdg-open http://127.0.0.1:9000 >/dev/null 2>&1 &
    exit 0
fi

# The launcher opens the browser itself once the server is up.
exec .venv/bin/python3 launchcontrol.py
