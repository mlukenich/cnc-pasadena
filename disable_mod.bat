@echo off
setlocal
echo [INFO] Requesting Administrator permission to restore the original game configuration...
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\restore_vanilla.ps1" -Elevate
set "RESULT=%ERRORLEVEL%"
echo.
if not "%RESULT%"=="0" echo [FAILED] See build\restore-vanilla.log for cleanup details.
pause
exit /b %RESULT%
