@echo off
setlocal

REM Keep one canonical Path variable. BinaryAssetBuilder uses an old .NET
REM serializer that crashes when both PATH and Path are present.
set "MARYLAND_PATH=%PATH%"
set PATH=
set "Path=%MARYLAND_PATH%"

"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\build_mod.ps1" -Install
set "RESULT=%ERRORLEVEL%"

if not "%RESULT%"=="0" (
    echo.
    echo [FAILED] Maryland Showdown was not built. Read the error above.
    pause
    exit /b %RESULT%
)

echo.
echo [SUCCESS] Maryland Showdown is built and installed.
echo Run launch_game.bat to start it.
pause
exit /b 0
