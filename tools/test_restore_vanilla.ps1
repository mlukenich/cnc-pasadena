$ErrorActionPreference = 'Stop'
$workspaceDir = Split-Path -Parent $PSScriptRoot
$testRoot = Join-Path $workspaceDir ('build\restore-tests-' + [guid]::NewGuid().ToString('N'))
$restoreScript = Join-Path $PSScriptRoot 'restore_vanilla.ps1'
$windowsPowerShell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$utf8 = New-Object Text.UTF8Encoding($false)

function Assert-True($Condition, [string]$Message) {
    if (-not $Condition) { throw "FAIL: $Message" }
}

function New-Fixture([string]$Name, [string]$Fault = '') {
    $directory = Join-Path $testRoot $Name
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
    New-Item -ItemType File -Path (Join-Path $directory 'CNC3.exe') | Out-Null
    foreach ($relative in @('CNC3_english_1.0.SkuDef', 'CNC3_english_1.9.SkuDef', 'Core\1.0\config.txt', 'Core\1.9\config.txt')) {
        $target = Join-Path $directory $relative
        New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
        $original = "add-big OriginalGame.big`r`nadd-search-path big:`r`n"
        $injected = "add-big MarylandShowdown_1.0_Streams.big`r`nadd-big MarylandShowdown_1.0_Misc.big`r`n" + $original
        if ($Fault -eq 'unrelated' -and $relative -eq 'CNC3_english_1.9.SkuDef') { $injected += "add-big OtherMod.big`r`n" }
        [IO.File]::WriteAllText($target, $injected, $utf8)
        if (-not ($Fault -eq 'missing-backup' -and $relative -eq 'CNC3_english_1.9.SkuDef')) {
            [IO.File]::WriteAllText($target + '.bak', $original, $utf8)
        }
    }
    foreach ($relative in @('MarylandShowdown_1.0_Streams.big', 'MarylandShowdown_1.0_Misc.big', 'Core\1.9\MarylandShowdown_1.0_Streams.big', 'OtherMod.big')) {
        [IO.File]::WriteAllText((Join-Path $directory $relative), 'fixture package', $utf8)
    }
    return $directory
}

$fixture = New-Fixture 'Successful Game With Spaces'
& $windowsPowerShell -NoProfile -ExecutionPolicy Bypass -File $restoreScript -NonInteractive -GameDirectory $fixture
Assert-True ($LASTEXITCODE -eq 0) 'multiple configuration backups should restore under Windows PowerShell 5.1'
foreach ($backup in Get-ChildItem -LiteralPath $fixture -Recurse -File -Filter '*.bak') {
    $target = $backup.FullName.Substring(0, $backup.FullName.Length - 4)
    Assert-True ((Get-FileHash -LiteralPath $target).Hash -eq (Get-FileHash -LiteralPath $backup.FullName).Hash) "restored hash mismatch: $target"
}
Assert-True (@(Get-ChildItem -LiteralPath $fixture -Recurse -File -Filter 'MarylandShowdown*.big').Count -eq 0) 'known injected packages should leave the game tree'
Assert-True (Test-Path -LiteralPath (Join-Path $fixture 'OtherMod.big')) 'unrelated package must be preserved'
$log = Get-Content -LiteralPath (Join-Path $workspaceDir 'build\restore-vanilla.log') -Raw
Assert-True ($log -match 'Restored 4 configuration\(s\); archived 3 old package\(s\)') 'restore must verify and report all files'
$recoveryMatch = [regex]::Match($log, '(?m)^\[OK\] Recovery copies: (.+)\r?$')
$recoveryDir = $recoveryMatch.Groups[1].Value.Trim()
Assert-True ((Get-ChildItem -LiteralPath $recoveryDir -Recurse -File).Count -eq 7) 'all replaced configs and moved packages should be recoverable'
& $windowsPowerShell -NoProfile -ExecutionPolicy Bypass -File $restoreScript -NonInteractive -GameDirectory $fixture
Assert-True ($LASTEXITCODE -eq 0) 'repeat cleanup must succeed harmlessly'

foreach ($fault in @('missing-backup', 'unrelated')) {
    $refusalFixture = New-Fixture $fault $fault
    $before = @{}
    Get-ChildItem -LiteralPath $refusalFixture -Recurse -File | ForEach-Object { $before[$_.FullName] = (Get-FileHash -LiteralPath $_.FullName).Hash }
    & $windowsPowerShell -NoProfile -ExecutionPolicy Bypass -File $restoreScript -NonInteractive -GameDirectory $refusalFixture
    Assert-True ($LASTEXITCODE -eq 1) "$fault must fail safely"
    foreach ($file in $before.Keys) { Assert-True ((Test-Path -LiteralPath $file) -and ((Get-FileHash -LiteralPath $file).Hash -eq $before[$file])) "$fault must not mutate $file" }
}
Write-Host '[PASS] Windows PowerShell 5.1: multiple backups, recovery copies, unrelated files, repeat cleanup, missing backups, and unrelated config edits.' -ForegroundColor Green
Write-Host "Test fixtures retained at $testRoot"
