# Elevated Mod Uninstaller / Restorer for C&C 3
$gameDir = "C:\Program Files\EA Games\Command and Conquer 3 TW and KW\Command Conquer 3 Tiberium Wars"

Write-Host "[INFO] Restoring Vanilla C&C 3 files..." -ForegroundColor Cyan

# 1. Restore all .bak files
Get-ChildItem -Path $gameDir -Recurse -Filter "*.bak" | ForEach-Object {
    $original = $_.FullName.Substring(0, $_.FullName.Length - 4)
    Copy-Item $_.FullName $original -Force
    Remove-Item $_.FullName -Force
    Write-Host "[OK] Restored: $original" -ForegroundColor Green
}

# 2. Remove mod big files
$modFiles = @(
    "$gameDir\MarylandShowdown_1.0_Streams.big",
    "$gameDir\MarylandShowdown_1.0_Misc.big",
    "$gameDir\Core\1.9\MarylandShowdown_1.0_Streams.big",
    "$gameDir\Core\1.9\MarylandShowdown_1.0_Misc.big",
    "$gameDir\Core\1.10\MarylandShowdown_1.0_Streams.big",
    "$gameDir\Core\1.10\MarylandShowdown_1.0_Misc.big",
    "$gameDir\Core\1.0\MarylandShowdown_1.0_Streams.big",
    "$gameDir\Core\1.0\MarylandShowdown_1.0_Misc.big",
    "$gameDir\RetailExe\1.9\MarylandShowdown_1.0_Streams.big",
    "$gameDir\RetailExe\1.9\MarylandShowdown_1.0_Misc.big"
)

foreach ($f in $modFiles) {
    if (Test-Path $f) {
        Remove-Item $f -Force
        Write-Host "[OK] Removed mod file: $f" -ForegroundColor Green
    }
}

Write-Host "`n[SUCCESS] Game 100% restored to original vanilla state!" -ForegroundColor Yellow
Start-Sleep -Seconds 3
