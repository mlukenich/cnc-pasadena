param(
    [string]$ArtDirectory
)

$ErrorActionPreference = 'Stop'
if (-not $ArtDirectory) {
    $workspaceDir = Split-Path -Parent $PSScriptRoot
    $ArtDirectory = Join-Path $workspaceDir 'src\Art\PJ'
}

function Assert-File([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Required file not found: $Path"
    }
}

Assert-File (Join-Path $ArtDirectory 'PJMammoth_Model.w3x')
Assert-File (Join-Path $ArtDirectory 'PJMammoth_Texture.xml')
Assert-File (Join-Path $ArtDirectory 'PJMammothAtlas.tga')
Assert-File (Join-Path $ArtDirectory 'PJMammothNormal.tga')
Assert-File (Join-Path $ArtDirectory 'PJMammothSpec.tga')
Assert-File (Join-Path $ArtDirectory 'PJMammothHouse.tga')
Assert-File (Join-Path $ArtDirectory 'PJMammoth_Portrait.xml')
Assert-File (Join-Path $ArtDirectory 'PJMammothPortrait.tga')

# Verify TGA dimensions and headers
function Test-TgaHeader([string]$Path, [int]$ExpectedW, [int]$ExpectedH) {
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    if ($bytes.Length -lt 18) { throw "TGA file too short: $Path" }
    $w = [BitConverter]::ToUInt16($bytes, 12)
    $h = [BitConverter]::ToUInt16($bytes, 14)
    $bpp = $bytes[16]
    if ($w -ne $ExpectedW -or $h -ne $ExpectedH -or $bpp -ne 32) {
        throw "Invalid TGA format in $Path : got ${w}x${h}x${bpp}, expected ${ExpectedW}x${ExpectedH}x32"
    }
}

Test-TgaHeader (Join-Path $ArtDirectory 'PJMammothAtlas.tga') 1024 1024
Test-TgaHeader (Join-Path $ArtDirectory 'PJMammothNormal.tga') 1024 1024
Test-TgaHeader (Join-Path $ArtDirectory 'PJMammothSpec.tga') 1024 1024
Test-TgaHeader (Join-Path $ArtDirectory 'PJMammothHouse.tga') 1024 1024
Test-TgaHeader (Join-Path $ArtDirectory 'PJMammothPortrait.tga') 128 128

# Verify Specular Map bounds: Candy Apple Paint (<= 14), Chrome/Blower (>= 60)
function Get-CellOffset([int]$CellX, [int]$CellY) {
    $yDisk = (3 - $CellY) * 256 + 128
    $xDisk = $CellX * 256 + 128
    return 18 + ($yDisk * 1024 + $xDisk) * 4
}

$specBytes = [System.IO.File]::ReadAllBytes((Join-Path $ArtDirectory 'PJMammothSpec.tga'))

# Cell (0, 0): Candy Apple Red Paint <= 14
$paintOffset = Get-CellOffset 0 0
$paintSpecR = $specBytes[$paintOffset + 2]
if ($paintSpecR -gt 14) { throw "Paint specular R ($paintSpecR) exceeds max allowed limit of 14" }

# Cell (1, 0): High-Polish Chrome >= 60
$chromeOffset = Get-CellOffset 1 0
$chromeSpecR = $specBytes[$chromeOffset + 2]
if ($chromeSpecR -lt 60) { throw "Chrome specular R ($chromeSpecR) below min allowed limit of 60" }

# Cell (2, 0): Heavy Tractor Tire Rubber <= 2
$tireOffset = Get-CellOffset 2 0
$tireSpecR = $specBytes[$tireOffset + 2]
if ($tireSpecR -gt 2) { throw "Tire rubber specular R ($tireSpecR) exceeds matte threshold of 2" }

Write-Host "[PASS] test_mammoth_material: All 4 material maps and UI portrait verified."
Write-Host "       Specular bounds: Paint ($paintSpecR <= 14), Chrome ($chromeSpecR >= 60), Tire Rubber ($tireSpecR <= 2)."
