# Validation of Materials, Shaders and Texture Maps for Columbia Street Sweeper
$ErrorActionPreference = 'Stop'

$artDir = "c:\Users\mluke\antigravity-workspace\cnc-pasadena\src\Art\CS"
$maps = @('CSSweeperAtlas.tga', 'CSSweeperNormal.tga', 'CSSweeperSpec.tga', 'CSSweeperHouse.tga')

foreach ($map in $maps) {
  $p = Join-Path $artDir $map
  if (-not (Test-Path $p)) { throw "Missing map: $p" }
  $bytes = [System.IO.File]::ReadAllBytes($p)
  if ($bytes.Length -ne 18 + 1024 * 1024 * 4) { throw "Invalid map size for ${map} - $($bytes.Length)" }
}

$portrait = Join-Path $artDir 'CSSweeperPortrait.tga'
if (-not (Test-Path $portrait)) { throw "Missing portrait: $portrait" }
$pBytes = [System.IO.File]::ReadAllBytes($portrait)
if ($pBytes.Length -ne 18 + 128 * 128 * 4) { throw "Invalid portrait size - $($pBytes.Length)" }

# Inspect specular map limits
$specBytes = [System.IO.File]::ReadAllBytes((Join-Path $artDir 'CSSweeperSpec.tga'))
$houseBytes = [System.IO.File]::ReadAllBytes((Join-Path $artDir 'CSSweeperHouse.tga'))

$paintSamples = 0
$steelSamples = 0

for ($y = 0; $y -lt 1024; $y += 64) {
  $row = [Math]::Floor($y / 256)
  for ($x = 0; $x -lt 1024; $x += 64) {
    $col = [Math]::Floor($x / 256)
    $cell = $row * 4 + $col
    $idx = 18 + ($y * 1024 + $x) * 4
    $spec = $specBytes[$idx] # Blue/Red channel in grayscale spec

    if ($cell -eq 0 -or $cell -eq 9 -or $cell -eq 10) {
      if ($spec -gt 14) { throw "Paint cell $cell specular $spec exceeds safe ceiling (14)" }
      $paintSamples++
    }
    if ($cell -eq 3 -or $cell -eq 11 -or $cell -eq 15) {
      if ($spec -lt 60) { throw "Stainless steel/metal cell $cell specular $spec below minimum (60)" }
      $steelSamples++
    }
  }
}

Write-Host "[PASS] test_sweeper_material: All 4 material maps and UI portrait verified."
Write-Host "       Specular bounds: $paintSamples paint samples (<=14), $steelSamples metal samples (>=60)."
