#!/bin/bash
# Launch Control installer.
# Run from inside the cloned repo, e.g.:
#   git clone https://github.com/Darren-Smith/LaunchControl.git ~/Games/LaunchControl
#   bash ~/Games/LaunchControl/install.sh
# Creates a private Python venv (with Flask) and a desktop shortcut.
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 is required but was not found." >&2
    exit 1
fi

echo "Creating virtual environment in $DIR/.venv ..."
python3 -m venv .venv
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet flask

chmod +x "$DIR/start.sh"

# Desktop shortcut (also added to the applications menu)
DESKTOP_FILE_CONTENT="[Desktop Entry]
Name=Launch Control
Comment=Launch Games
Exec=bash \"$DIR/start.sh\"
Path=$DIR
Terminal=false
Type=Application
Icon=applications-games
Categories=Game;
"

DESKTOP_DIR="$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")"
mkdir -p "$HOME/.local/share/applications"
printf '%s' "$DESKTOP_FILE_CONTENT" > "$HOME/.local/share/applications/LaunchControl.desktop"
if [ -d "$DESKTOP_DIR" ]; then
    printf '%s' "$DESKTOP_FILE_CONTENT" > "$DESKTOP_DIR/Launch Control.desktop"
    chmod +x "$DESKTOP_DIR/Launch Control.desktop"
    echo "Desktop shortcut created: $DESKTOP_DIR/Launch Control.desktop"
fi

echo "Install complete. Start it with: bash \"$DIR/start.sh\""
