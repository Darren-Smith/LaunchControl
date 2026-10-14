"""Dynamic path resolution and user state storage for Launch Control.

Handles running from source as well as running inside a PyInstaller frozen binary.
Ensures zero hardcoded user paths and keeps user state (saves, favourites, user games)
safely separated in ~/.local/share/LaunchControl.
"""
import os
import sys
from pathlib import Path


def get_app_root() -> Path:
    """Return the absolute path to the application root directory."""
    if getattr(sys, "frozen", False):
        # PyInstaller onedir binary: executable is inside the distributed app root
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent.parent


def get_user_data_dir() -> Path:
    """Return the user data directory (~/.local/share/LaunchControl)."""
    xdg = os.environ.get("XDG_DATA_HOME")
    base = Path(xdg) if xdg else Path.home() / ".local" / "share"
    d = base / "LaunchControl"
    d.mkdir(parents=True, exist_ok=True)
    return d


def get_saves_dir(game_id: str) -> Path:
    """Return the persistent saves directory for a specific game."""
    d = get_user_data_dir() / "saves" / game_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def get_favourites_path() -> Path:
    """Return path to favourites.json in user data."""
    return get_user_data_dir() / "favourites.json"


def get_user_games_path() -> Path:
    """Return path to user_games.json for games added by the user."""
    return get_user_data_dir() / "user_games.json"


def get_user_games_dir() -> Path:
    """Return directory where user-added custom games can reside."""
    d = get_user_data_dir() / "user_games"
    d.mkdir(parents=True, exist_ok=True)
    return d
