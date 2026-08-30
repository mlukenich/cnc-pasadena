param(
    [switch]$CheckOnly,
    [switch]$ArtPreview,
    [switch]$PriusPreview
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'mod_runtime.ps1')

$gameDir = 'C:\Program Files\EA Games\Command and Conquer 3 TW and KW\Command Conquer 3 Tiberium Wars'
$gameExe = Join-Path $gameDir 'CNC3.exe'
$documentsDir = [Environment]::GetFolderPath('MyDocuments')
$modConfig = Join-Path $documentsDir ('Command & Conquer 3 Tiberium Wars\Mods\' + $runtimeModName + '\' + $runtimeConfigName)
# Run the build paired with this checkout when available. Windows/OneDrive
# redirection can otherwise select an older copy in another Documents folder.
$workspaceDir = Split-Path -Parent $PSScriptRoot
$builtModConfig = Join-Path $workspaceDir ('build\' + $runtimeConfigName)
$builtModArchive = Join-Path $workspaceDir ('build\' + $runtimeArchiveName)
if ((Test-Path -LiteralPath $builtModConfig -PathType Leaf) -and (Test-Path -LiteralPath $builtModArchive -PathType Leaf)) {
    $modConfig = $builtModConfig
}
if ($ArtPreview -and $PriusPreview) { throw 'Select only one preview package.' }
if ($ArtPreview -or $PriusPreview) {
    $previewFolder = if ($PriusPreview) { 'build\prius-v2' } else { 'build\art-v3' }
    $previewDir = Join-Path $workspaceDir $previewFolder
    $modConfig = Join-Path $previewDir $runtimeConfigName
    $previewArchive = Join-Path $previewDir $runtimeArchiveName
    if (-not (Test-Path -LiteralPath $previewArchive -PathType Leaf)) { throw "The preview build is missing. Rebuild with -OutputDirectory $previewFolder first." }
    Write-Host "[INFO] Preview: $previewFolder. The regular package remains unchanged."
}
$oldStream = Join-Path $gameDir 'MarylandShowdown_1.0_Streams.big'
$gameSku = Join-Path $gameDir 'CNC3_english_1.9.SkuDef'

if (-not (Test-Path -LiteralPath $gameExe -PathType Leaf)) {
    Write-Host "[ERROR] CNC3.exe was not found: $gameExe" -ForegroundColor Red
    Write-Host 'Edit $gameDir in tools\launch_mod.ps1 if the game is installed elsewhere.'
    exit 1
}

if (-not (Test-Path -LiteralPath $modConfig -PathType Leaf)) {
    Write-Host "[ERROR] The installed mod config was not found: $modConfig" -ForegroundColor Red
    Write-Host 'Run build.bat first.'
    exit 1
}

Write-Host "[INFO] Selected mod: $modConfig"
$oldSkuReference = (Test-Path -LiteralPath $gameSku -PathType Leaf) -and
    (Select-String -LiteralPath $gameSku -Pattern 'MarylandShowdown' -Quiet)
if ((Test-Path -LiteralPath $oldStream -PathType Leaf) -or $oldSkuReference) {
    Write-Host '[ERROR] An older Maryland Showdown build is still injected into the base game.' -ForegroundColor Red
    Write-Host 'Run disable_mod.bat, approve the administrator prompt, then launch again.'
    exit 1
}

Write-Host "[OK] Game: $gameExe" -ForegroundColor Green
Write-Host "[OK] Mod:  $modConfig" -ForegroundColor Green
if ($CheckOnly) { exit 0 }

$runningGame = @(Get-Process -Name 'CNC3','cnc3game.dat' -ErrorAction SilentlyContinue)
if ($runningGame.Count -gt 0) {
    Write-Host '[ERROR] C&C 3 is already running. Exit it completely, then launch again.' -ForegroundColor Red
    exit 1
}

Write-Host '[INFO] Starting C&C 3 with Maryland Showdown...'
$argumentLine = '-modConfig "' + $modConfig + '"'
Start-Process -FilePath $gameExe -WorkingDirectory $gameDir -ArgumentList $argumentLine
exit 0
