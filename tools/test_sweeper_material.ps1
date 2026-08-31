param([string]$ArtDirectory = (Join-Path (Split-Path -Parent $PSScriptRoot) 'src/Art/CS'))
# Validation of Materials, Shaders and Texture Maps for Columbia Street Sweeper
$ErrorActionPreference = 'Stop'

$artDir = $ArtDirectory
$maps = @('CSSweeperAtlas.tga', 'CSSweeperNormal.tga', 'CSSweeperSpec.tga', 'CSSweeperHouse.tga')

foreach ($map in $maps) {
  $p = Join-Path $artDir $map
  if (-not (Test-Path $p)) { throw "Missing map: $p" }
  $bytes = [System.IO.File]::ReadAllBytes($p)
  if ($bytes.Length -ne 18 + 1024 * 1024 * 4) { throw "Invalid map size for ${map} - $($bytes.Length)" }
  if ($bytes[2] -ne 2 -or $bytes[16] -ne 32 -or $bytes[17] -ne 40 -or [BitConverter]::ToUInt16($bytes,12) -ne 1024 -or [BitConverter]::ToUInt16($bytes,14) -ne 1024) { throw "Wrong format/origin/dimensions for $map" }
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
    $spec = $specBytes[$idx + 2] # R/highlight in TGA BGRA storage, not B/glow.

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

[xml]$model = Get-Content -LiteralPath (Join-Path $artDir 'CSSweeper_Model.w3x') -Raw
$bindings = @{DiffuseTexture='CSSweeperAtlas'; NormalMap='CSSweeperNormal'; SpecMap='CSSweeperSpec'; RecolorTexture='CSSweeperHouse'}
if (@($model.AssetDeclaration.W3DMesh).Count -ne 14) { throw 'Expected 14 rigid/state meshes including separate yaw mount.' }
foreach ($mesh in $model.AssetDeclaration.W3DMesh) {
    if ($mesh.FXShader.ShaderName -ne 'ObjectsGDI.fx') { throw "Wrong shader on $($mesh.id)" }
    if (@($mesh.FXShader.Constants.Texture).Count -ne 4) { throw "Expected exactly four samplers on $($mesh.id)" }
    foreach ($slot in $bindings.Keys) {
        $binding = @($mesh.FXShader.Constants.Texture | Where-Object { $_.Name -eq $slot })
        if ($binding.Count -ne 1 -or $binding[0].Value -ne $bindings[$slot]) { throw "Wrong $slot on $($mesh.id)" }
    }
    $count = @($mesh.Vertices.V).Count
    foreach ($array in @(@($mesh.Normals.N), @($mesh.Tangents.T), @($mesh.Binormals.B), @($mesh.TexCoords.T))) {
        if ($array.Count -ne $count) { throw "Incomplete vertex attributes on $($mesh.id)" }
    }
}
function CellOffset([int]$Cell,[int]$X=128,[int]$Y=128) { return 18 + (([int][Math]::Floor($Cell/4)*256+$Y)*1024+($Cell%4)*256+$X)*4 }
$rubber = CellOffset 2
if ($specBytes[$rubber+2] -gt 4 -or $specBytes[$rubber+1] -ne 0 -or $specBytes[$rubber] -ne 0) { throw 'Rubber must be matte with no reflection/glow.' }
$steel = CellOffset 3
if ($specBytes[$steel+1] -ne 10 -or $specBytes[$steel] -ne 0 -or $specBytes[$steel+3] -ne 255) { throw 'Spec RGB must pack highlight/reflection/glow, not grayscale plus reflection alpha.' }
$trim = CellOffset 1
if ($houseBytes[$trim+3] -ne 255 -or $houseBytes[$trim] -eq 255) { throw 'Team mask must be alpha, with diffuse luminance in RGB.' }
for ($y=0;$y -lt 190;$y+=8) { for ($x=0;$x -lt 256;$x+=8) {
    $offset=CellOffset 9 $x $y
    if ($houseBytes[$offset+3] -ne 0) { throw 'Team mask obscures sanitizer lettering.' }
} }

Write-Host "[PASS] test_sweeper_material: All 4 material maps and UI portrait verified."
Write-Host "       Specular bounds: $paintSamples paint samples (<=14), $steelSamples metal samples (>=60)."
