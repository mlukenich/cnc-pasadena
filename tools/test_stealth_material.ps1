param(
    [string]$ArtDirectory
)

$ErrorActionPreference = 'Stop'
if (-not $ArtDirectory) {
    $workspaceDir = Split-Path -Parent $PSScriptRoot
    $ArtDirectory = Join-Path $workspaceDir 'src\Art\CT'
}

function Assert-File([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Required file not found: $Path"
    }
}

Assert-File (Join-Path $ArtDirectory 'CTStealth_Model.w3x')
Assert-File (Join-Path $ArtDirectory 'CTStealth_Texture.xml')
Assert-File (Join-Path $ArtDirectory 'CTStealthAtlas.tga')
Assert-File (Join-Path $ArtDirectory 'CTStealthNormal.tga')
Assert-File (Join-Path $ArtDirectory 'CTStealthSpec.tga')
Assert-File (Join-Path $ArtDirectory 'CTStealthHouse.tga')
Assert-File (Join-Path $ArtDirectory 'CTStealth_Portrait.xml')
Assert-File (Join-Path $ArtDirectory 'CTStealthPortrait.tga')

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

Test-TgaHeader (Join-Path $ArtDirectory 'CTStealthAtlas.tga') 1024 1024
Test-TgaHeader (Join-Path $ArtDirectory 'CTStealthNormal.tga') 1024 1024
Test-TgaHeader (Join-Path $ArtDirectory 'CTStealthSpec.tga') 1024 1024
Test-TgaHeader (Join-Path $ArtDirectory 'CTStealthHouse.tga') 1024 1024
Test-TgaHeader (Join-Path $ArtDirectory 'CTStealthPortrait.tga') 128 128

# Verify Specular Map bounds: Pearl White Paint (<= 14), Rubber/Carbon (<= 2), Anodized Aluminum/Lens (>= 60)
function Get-CellOffset([int]$CellX, [int]$CellY) {
    $yDisk = (3 - $CellY) * 256 + 128
    $xDisk = $CellX * 256 + 128
    return 18 + ($yDisk * 1024 + $xDisk) * 4
}

$specBytes = [System.IO.File]::ReadAllBytes((Join-Path $ArtDirectory 'CTStealthSpec.tga'))

# Cell (0, 0): Pearl White Paint <= 14
$paintOffset = Get-CellOffset 0 0
$paintSpecR = $specBytes[$paintOffset + 2]
if ($paintSpecR -gt 14) { throw "Paint specular R ($paintSpecR) exceeds max allowed limit of 14" }

# Cell (2, 0): Carbon Fiber <= 2
$carbonOffset = Get-CellOffset 2 0
$carbonSpecR = $specBytes[$carbonOffset + 2]
if ($carbonSpecR -gt 2) { throw "Carbon fiber specular R ($carbonSpecR) exceeds matte limit of 2" }

# Cell (3, 0): Anodized Cyan Aluminum >= 60
$aluminumOffset = Get-CellOffset 3 0
$aluminumSpecR = $specBytes[$aluminumOffset + 2]
if ($aluminumSpecR -lt 60) { throw "Anodized aluminum specular R ($aluminumSpecR) below min allowed limit of 60" }

# Cell (0, 3): LiDAR Periscope Lens >= 60
$lensOffset = Get-CellOffset 0 3
$lensSpecR = $specBytes[$lensOffset + 2]
if ($lensSpecR -lt 60) { throw "LiDAR lens specular R ($lensSpecR) below min allowed limit of 60" }

Write-Host "[PASS] test_stealth_material: All 4 material maps and UI portrait verified."
Write-Host "       Specular bounds: Paint ($paintSpecR <= 14), Carbon ($carbonSpecR <= 2), Anodized Aluminum ($aluminumSpecR >= 60), Lens ($lensSpecR >= 60)."
