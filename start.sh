#!/bin/bash
# Start Launch Control (installed copy) on http://127.0.0.1:9000 and open the browser.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

notify() {
    echo "$1" >&2
    command -v notify-send >/dev/null 2>&1 && notify-send "Launch Control" "$1"
}

if [ ! -x ".venv/bin/python3" ]; then
    notify "Not installed yet - run: bash \"$DIR/install.sh\""
    exit 1
fi

# Is something already answering on port 9000?
RESPONSE="$(curl -s --max-time 2 http://127.0.0.1:9000/api/version)"
if [ -n "$RESPONSE" ]; then
    # Only reuse it if it is THIS installation (not a dev copy or another folder).
    if printf '%s' "$RESPONSE" | grep -qF "$DIR"; then
        xdg-open http://127.0.0.1:9000 >/dev/null 2>&1 &
        exit 0
    fi
    notify "Port 9000 is already used by a different Launch Control. Stop it and try again."
    exit 1
fi

# The launcher opens the browser itself once the server is up.
exec .venv/bin/python3 launchcontrol.py
