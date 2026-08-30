import os
import shutil

game_dir = r"C:\Program Files\EA Games\Command and Conquer 3 TW and KW\Command Conquer 3 Tiberium Wars"
onedrive_dir = r"C:\Users\mluke\OneDrive\Documents\Command & Conquer 3 Tiberium Wars\Mods\MarylandShowdown"

def create_install_scripts():
    os.makedirs('tools', exist_ok=True)

    # PowerShell script to run elevated
    ps1_enable = f"""# Elevated Mod Installer for C&C 3 EA App
$gameDir = "{game_dir}"
$modDir = "{onedrive_dir}"

Write-Host "[INFO] Installing Maryland Showdown mod directly into C&C 3..." -ForegroundColor Cyan

# 1. Copy big files into game directory
Copy-Item "$modDir\\MarylandShowdown_1.0_Streams.big" "$gameDir\\MarylandShowdown_1.0_Streams.big" -Force
Copy-Item "$modDir\\MarylandShowdown_1.0_Misc.big" "$gameDir\\MarylandShowdown_1.0_Misc.big" -Force
Write-Host "[OK] Copied mod BIG files to game directory." -ForegroundColor Green

# 2. Backup & patch SkuDefs
$skudefs = @("$gameDir\\CNC3_english_1.9.SkuDef", "$gameDir\\CNC3_english_1.10.SkuDef")

foreach ($sku in $skudefs) {{
    if (Test-Path $sku) {{
        $bak = "$sku.bak"
        if (-not (Test-Path $bak)) {{
            Copy-Item $sku $bak
            Write-Host "[OK] Created backup: $bak" -ForegroundColor Green
        }}
        
        $content = Get-Content $bak -Raw
        # Remove any existing mod lines
        $lines = $content -split "`r?`n" | Where-Object {{ $_ -notmatch "MarylandShowdown" }}
        
        # Insert mod lines right before 'add-search-path big:'
        $newLines = @()
        foreach ($l in $lines) {{
            if ($l -match "add-search-path big:") {{
                $newLines += "add-big MarylandShowdown_1.0_Streams.big"
                $newLines += "add-big MarylandShowdown_1.0_Misc.big"
            }}
            $newLines += $l
        }}
        
        $newContent = ($newLines -join "`r`n").Trim() + "`r`n"
        [System.IO.File]::WriteAllText($sku, $newContent)
        Write-Host "[OK] Patched $sku with Maryland Showdown mod!" -ForegroundColor Green
    }}
}}

Write-Host "`n[SUCCESS] Mod successfully activated! You can now launch C&C 3 normally from the EA App, Desktop, or launch_game.bat!" -ForegroundColor Yellow
Start-Sleep -Seconds 3
"""

    with open('tools/enable_mod.ps1', 'w', encoding='utf-8') as f:
        f.write(ps1_enable)

    # Disable PowerShell script
    ps1_disable = f"""# Restore Vanilla C&C 3
$gameDir = "{game_dir}"

Write-Host "[INFO] Restoring vanilla C&C 3..." -ForegroundColor Cyan
$skudefs = @("$gameDir\\CNC3_english_1.9.SkuDef", "$gameDir\\CNC3_english_1.10.SkuDef")

foreach ($sku in $skudefs) {{
    $bak = "$sku.bak"
    if (Test-Path $bak) {{
        Copy-Item $bak $sku -Force
        Write-Host "[OK] Restored $sku from backup." -ForegroundColor Green
    }}
}}

# Remove mod bigs from game dir
Remove-Item "$gameDir\\MarylandShowdown_1.0_Streams.big" -ErrorAction SilentlyContinue
Remove-Item "$gameDir\\MarylandShowdown_1.0_Misc.big" -ErrorAction SilentlyContinue

Write-Host "`n[SUCCESS] Game restored to 100% vanilla state." -ForegroundColor Yellow
Start-Sleep -Seconds 3
"""

    with open('tools/disable_mod.ps1', 'w', encoding='utf-8') as f:
        f.write(ps1_disable)

    # Windows batch launchers that request UAC elevation automatically
    bat_enable = """@echo off
REM =========================================================================
REM Enable Maryland Showdown Mod (Direct Engine Hook for EA App)
REM =========================================================================

echo [INFO] Requesting Administrator permissions to enable mod in game directory...
powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-ExecutionPolicy Bypass -File \"\"%~dp0tools\\enable_mod.ps1\"\"'"
echo.
echo [DONE] If you approved the UAC prompt, the mod is now active in your game!
pause
"""
    with open('enable_mod.bat', 'w', encoding='utf-8') as f:
        f.write(bat_enable)

    bat_disable = """@echo off
REM =========================================================================
REM Disable Mod / Restore Vanilla C&C 3
REM =========================================================================

echo [INFO] Requesting Administrator permissions to restore vanilla game...
powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-ExecutionPolicy Bypass -File \"\"%~dp0tools\\disable_mod.ps1\"\"'"
echo.
echo [DONE] Game restored to vanilla.
pause
"""
    with open('disable_mod.bat', 'w', encoding='utf-8') as f:
        f.write(bat_disable)

    print("Created enable_mod.bat and disable_mod.bat successfully.")

if __name__ == '__main__':
    create_install_scripts()
