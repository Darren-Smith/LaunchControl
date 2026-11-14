@echo off
setlocal
echo ==================================================
echo   Installing Launch Control for Windows 11 / 10
echo ==================================================

set "SCRIPT_DIR=%~dp0"
set "INSTALL_DIR=%APPDATA%\LaunchControl\app"
set "EXE_PATH=%INSTALL_DIR%\launchcontrol.exe"

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo -> Copying files to %INSTALL_DIR%...
xcopy /E /I /Y /Q "%SCRIPT_DIR%*" "%INSTALL_DIR%\" >nul

echo -> Creating desktop shortcut...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'Launch Control.lnk')); $s.TargetPath = '%EXE_PATH%'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = 'Launch Control Games'; $s.Save()"

echo -> Creating Start Menu shortcut...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $p = [System.IO.Path]::Combine([Environment]::GetFolderPath('Programs'), 'Launch Control.lnk'); $s = $ws.CreateShortcut($p); $s.TargetPath = '%EXE_PATH%'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = 'Launch Control Games'; $s.Save()"

echo.
echo ==================================================
echo   Installation Complete!
echo   You can launch games from:
echo   - Your Desktop (Launch Control.lnk)
echo   - Your Start Menu
echo   - Or directly: %EXE_PATH%
echo ==================================================
echo.
pause
