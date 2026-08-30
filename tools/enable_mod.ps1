# Elevated Mod Installer for C&C 3 EA App
$workspaceDir = Split-Path -Parent $PSScriptRoot

Write-Host "[INFO] Running Direct Core Engine Patching..." -ForegroundColor Cyan
Set-Location $workspaceDir
python "$workspaceDir\tools\patch_core_configs.py"

Write-Host "`n[SUCCESS] Maryland Showdown fully injected into Core engine! You can now launch C&C 3 normally from EA App or Desktop!" -ForegroundColor Yellow
Start-Sleep -Seconds 3
