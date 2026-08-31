@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\launch_mod.ps1" -TruckFixPreview
if errorlevel 1 pause
