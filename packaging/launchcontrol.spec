# -*- mode: python ; coding: utf-8 -*-
import sys
from pathlib import Path

block_cipher = None
ROOT = Path.cwd().resolve()

datas = [
    (str(ROOT / 'games'), 'games'),
    (str(ROOT / 'static'), 'static'),
    (str(ROOT / 'games.json'), '.'),
    (str(ROOT / 'version.json'), '.'),
]

hidden_imports = [
    'flask',
    'jinja2',
    'werkzeug',
    'shared',
    'shared.paths',
    'shared.gameserver',
    'updater',
    'updater.updater',
    'http.server',
    'socketserver',
    'importlib.util',
]

a = Analysis(
    [str(ROOT / 'launchcontrol.py')],
    pathex=[str(ROOT)],
    binaries=[],
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['.venv', 'venv'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='launchcontrol',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='LaunchControl',
)
