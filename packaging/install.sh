#!/usr/bin/env bash
# Launch Control - Friend's One-Click Installation Script for Linux Mint / Ubuntu
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_ROOT="${XDG_DATA_HOME:-$HOME/.local/share}/LaunchControl"
APP_DIR="$INSTALL_ROOT/app"
DESKTOP_APPS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
DESKTOP_DIR="$HOME/Desktop"

echo "==============================================="
echo "   Installing Launch Control for Linux Mint   "
echo "==============================================="

mkdir -p "$INSTALL_ROOT"
mkdir -p "$APP_DIR"
mkdir -p "$DESKTOP_APPS_DIR"

echo "-> Copying application files to $APP_DIR..."
# Determine if running from unpacked release directory or repo
if [ -f "$SCRIPT_DIR/launchcontrol" ]; then
    cp -r "$SCRIPT_DIR/"* "$APP_DIR/"
elif [ -d "$SCRIPT_DIR/dist/LaunchControl" ]; then
    cp -r "$SCRIPT_DIR/dist/LaunchControl/"* "$APP_DIR/"
elif [ -f "$SCRIPT_DIR/../launchcontrol.py" ]; then
    cp -r "$SCRIPT_DIR/.."/* "$APP_DIR/"
fi

# Set execution permissions
chmod +x "$APP_DIR/launchcontrol" 2>/dev/null || true
if [ -f "$APP_DIR/updater/updater" ]; then
    chmod +x "$APP_DIR/updater/updater" 2>/dev/null || true
fi

echo "-> Installing desktop shortcuts..."
DESKTOP_TEMPLATE="$SCRIPT_DIR/LaunchControl.desktop"
if [ ! -f "$DESKTOP_TEMPLATE" ]; then
    DESKTOP_TEMPLATE="$APP_DIR/packaging/LaunchControl.desktop"
fi

if [ -f "$DESKTOP_TEMPLATE" ]; then
    sed "s|@@APP_DIR@@|$APP_DIR|g" "$DESKTOP_TEMPLATE" > "$DESKTOP_APPS_DIR/LaunchControl.desktop"
    chmod +x "$DESKTOP_APPS_DIR/LaunchControl.desktop"
    
    if [ -d "$DESKTOP_DIR" ]; then
        cp "$DESKTOP_APPS_DIR/LaunchControl.desktop" "$DESKTOP_DIR/"
        chmod +x "$DESKTOP_DIR/LaunchControl.desktop"
    fi
fi

if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$DESKTOP_APPS_DIR" 2>/dev/null || true
fi

echo ""
echo "==============================================="
echo " Installation Complete!"
echo " You can now launch Launch Control from:"
echo " - Your Applications Menu"
echo " - Your Desktop"
echo " - Or run: $APP_DIR/launchcontrol"
echo "==============================================="
