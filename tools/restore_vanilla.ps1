param(
    [switch]$NonInteractive,
    [switch]$Elevate,
    [string]$GameDirectory = 'C:\Program Files\EA Games\Command and Conquer 3 TW and KW\Command Conquer 3 Tiberium Wars'
)

$ErrorActionPreference = 'Stop'
$workspaceDir = Split-Path -Parent $PSScriptRoot
$buildDir = Join-Path $workspaceDir 'build'
$logPath = Join-Path $buildDir 'restore-vanilla.log'
New-Item -ItemType Directory -Path $buildDir -Force | Out-Null

if ($Elevate) {
    try {
        $arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $PSCommandPath + '" -NonInteractive -GameDirectory "' + $GameDirectory + '"'
        $process = Start-Process -FilePath (Join-Path $PSHOME 'powershell.exe') -ArgumentList $arguments -Verb RunAs -WindowStyle Hidden -Wait -PassThru
        if (Test-Path -LiteralPath $logPath) { Get-Content -LiteralPath $logPath | Write-Host }
        if ($process.ExitCode -ne 0) { Write-Host '[ERROR] Cleanup failed. Do not launch the game yet.' -ForegroundColor Red }
        exit $process.ExitCode
    } catch {
        Write-Host "[ERROR] Administrator cleanup could not start: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

$exitCode = 0
$transcribing = $false
try {
    Start-Transcript -LiteralPath $logPath -Force | Out-Null
    $transcribing = $true
    if (-not (Test-Path -LiteralPath $GameDirectory -PathType Container)) { throw "C&C 3 installation not found: $GameDirectory" }
    $gameDir = (Resolve-Path -LiteralPath $GameDirectory).ProviderPath.TrimEnd('\')
    $gamePrefix = $gameDir + '\'
    $coreDir = Join-Path $gameDir 'Core'
    if (-not (Test-Path -LiteralPath (Join-Path $gameDir 'CNC3.exe') -PathType Leaf)) { throw "Refusing cleanup: CNC3.exe is missing from $gameDir" }
    if (Get-Process -Name CNC3,cnc3game -ErrorAction SilentlyContinue) { throw 'Close C&C 3 before running cleanup.' }

    # No commas: emit individual FileInfo objects, not two nested arrays.
    $configTargets = @(
        Get-ChildItem -LiteralPath $gameDir -File -Filter 'CNC3_*.SkuDef'
        if (Test-Path -LiteralPath $coreDir) { Get-ChildItem -LiteralPath $coreDir -Recurse -File -Filter 'config.txt' }
    )
    $injectedLine = '(?im)^[\t ]*add-big[\t ]+MarylandShowdown_1\.0_(Streams|Misc)\.big[\t ]*(?:\r?\n|$)'
    $restorePlan = @()
    foreach ($config in $configTargets) {
        $current = [IO.File]::ReadAllText($config.FullName)
        if ($current -notmatch '(?i)MarylandShowdown') { continue }
        $backup = $config.FullName + '.bak'
        if (-not (Test-Path -LiteralPath $backup -PathType Leaf)) { throw "Missing original backup for injected configuration: $($config.FullName)" }
        $original = [IO.File]::ReadAllText($backup)
        if ($original -match '(?i)MarylandShowdown') { throw "Backup also contains mod injection: $backup" }
        $withoutInjection = [regex]::Replace($current, $injectedLine, '').Replace("`r`n", "`n").TrimEnd()
        if ($withoutInjection -cne $original.Replace("`r`n", "`n").TrimEnd()) { throw "Configuration has changes beyond the known mod injection; refusing to overwrite: $($config.FullName)" }
        $restorePlan += [pscustomobject]@{ Target = $config.FullName; Backup = $backup }
    }

    $knownInjectedFiles = @(Get-ChildItem -LiteralPath $gameDir -Recurse -File |
        Where-Object { $_.Name -in @('MarylandShowdown_1.0_Streams.big', 'MarylandShowdown_1.0_Misc.big') })
    if ($restorePlan.Count -eq 0 -and $knownInjectedFiles.Count -eq 0) {
        Write-Host '[SUCCESS] No legacy Maryland Showdown injection remains.' -ForegroundColor Green
    } else {
        $recoveryDir = Join-Path $buildDir ('legacy-recovery-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
        New-Item -ItemType Directory -Path $recoveryDir | Out-Null
        # Preserve every configuration before touching any installed file.
        foreach ($item in $restorePlan) {
            $targetPath = [IO.Path]::GetFullPath($item.Target)
            if (-not $targetPath.StartsWith($gamePrefix, [StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe target: $targetPath" }
            $recoveryPath = Join-Path $recoveryDir $targetPath.Substring($gamePrefix.Length)
            New-Item -ItemType Directory -Path (Split-Path -Parent $recoveryPath) -Force | Out-Null
            Copy-Item -LiteralPath $targetPath -Destination $recoveryPath
            if ((Get-FileHash -LiteralPath $targetPath).Hash -ne (Get-FileHash -LiteralPath $recoveryPath).Hash) { throw "Recovery copy verification failed: $targetPath" }
        }
        foreach ($item in $restorePlan) {
            Copy-Item -LiteralPath $item.Backup -Destination $item.Target -Force
            if ((Get-FileHash -LiteralPath $item.Backup).Hash -ne (Get-FileHash -LiteralPath $item.Target).Hash) { throw "Restore verification failed: $($item.Target)" }
            Write-Host "[OK] Restored $($item.Target)" -ForegroundColor Green
        }
        foreach ($file in $knownInjectedFiles) {
            $sourcePath = [IO.Path]::GetFullPath($file.FullName)
            if (-not $sourcePath.StartsWith($gamePrefix, [StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe package target: $sourcePath" }
            $recoveryPath = [IO.Path]::GetFullPath((Join-Path $recoveryDir $sourcePath.Substring($gamePrefix.Length)))
            if (-not $recoveryPath.StartsWith($recoveryDir + '\', [StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe recovery path: $recoveryPath" }
            New-Item -ItemType Directory -Path (Split-Path -Parent $recoveryPath) -Force | Out-Null
            Move-Item -LiteralPath $sourcePath -Destination $recoveryPath
            Write-Host "[OK] Archived old package $sourcePath" -ForegroundColor Green
        }
        foreach ($config in $configTargets) {
            if (Select-String -LiteralPath $config.FullName -Pattern 'MarylandShowdown' -Quiet) { throw "Legacy reference remains: $($config.FullName)" }
        }
        Write-Host "[OK] Recovery copies: $recoveryDir"
        Write-Host "[SUCCESS] Restored $($restorePlan.Count) configuration(s); archived $($knownInjectedFiles.Count) old package(s)." -ForegroundColor Green
    }
    Write-Host 'The new Documents-folder mod is untouched. Run launch_game.bat next.'
} catch {
    $exitCode = 1
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Cleanup did not complete. Keep the game closed and share this log.'
} finally {
    if ($transcribing) { Stop-Transcript | Out-Null }
}
if (-not $NonInteractive) { [void](Read-Host 'Press Enter to close') }
exit $exitCode
