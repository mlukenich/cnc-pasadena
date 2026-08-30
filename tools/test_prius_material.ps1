param([string]$ArtDirectory = (Join-Path (Split-Path -Parent $PSScriptRoot) 'src\Art\CV'))
$ErrorActionPreference = 'Stop'
function Assert-True([bool]$Condition, [string]$Message) { if (-not $Condition) { throw "FAIL: $Message" } }

[xml]$model = Get-Content -LiteralPath (Join-Path $ArtDirectory 'CVPrius_Model.w3x') -Raw
[xml]$declarations = Get-Content -LiteralPath (Join-Path $ArtDirectory 'CVPrius_Texture.xml') -Raw

$meshes = @($model.AssetDeclaration.W3DMesh)
Assert-True ($meshes.Count -eq 7) "Expected 7 rigid meshes (body, turret, guns, and 4 wheels), found $($meshes.Count)."

$slots = @{
    DiffuseTexture = 'CVPriusAtlas';
    NormalMap      = 'CVPriusNormal';
    SpecMap        = 'CVPriusSpec';
    RecolorTexture = 'CVPriusHouse';
}

foreach ($mesh in $meshes) {
    Assert-True ($mesh.FXShader.ShaderName -eq 'ObjectsGDI.fx') "Expected ObjectsGDI.fx shader on $($mesh.id)."
    Assert-True (@($mesh.FXShader.Constants.Texture).Count -eq 4) "Expected 4 material samplers on $($mesh.id)."
    foreach ($slot in $slots.Keys) {
        $sampler = @($mesh.FXShader.Constants.Texture | Where-Object { $_.Name -eq $slot })
        Assert-True ($sampler.Count -eq 1 -and $sampler[0].Value -eq $slots[$slot]) "Incorrect $slot on $($mesh.id)."
    }
    $count = @($mesh.Vertices.V).Count
    Assert-True (@($mesh.Normals.N).Count -eq $count) "Missing vertex normals on $($mesh.id)."
    Assert-True (@($mesh.Tangents.T).Count -eq $count -and @($mesh.Binormals.B).Count -eq $count) "Missing tangent frames on $($mesh.id)."
    Assert-True (@($mesh.TexCoords.T).Count -eq $count) "UV count mismatch on $($mesh.id)."
}

$textureIds = @($declarations.AssetDeclaration.Texture.id)
foreach ($id in $slots.Values) {
    Assert-True ($textureIds -contains $id) "Undeclared texture $id in CVPrius_Texture.xml."
}

foreach ($texture in $declarations.AssetDeclaration.Texture) {
    $filePath = Join-Path $ArtDirectory (Split-Path -Leaf $texture.File)
    Assert-True (Test-Path -LiteralPath $filePath) "Texture file missing: $filePath"
    $data = [IO.File]::ReadAllBytes($filePath)
    Assert-True ($data[2] -eq 2 -and $data[16] -eq 32 -and $data[17] -eq 40) "Expected top-origin 32-bit uncompressed TGA: $($texture.File)"
    Assert-True ([BitConverter]::ToUInt16($data, 12) -eq 1024 -and [BitConverter]::ToUInt16($data, 14) -eq 1024) "Expected 1024x1024 resolution: $($texture.File)"
    Assert-True ($data.Length -eq (18 + 1024 * 1024 * 4)) "Incomplete TGA data for $($texture.File)."
}

$spec = [IO.File]::ReadAllBytes((Join-Path $ArtDirectory 'CVPriusSpec.tga'))
function SampleOffset([int]$Cell) {
    return 18 + (([int][Math]::Floor($Cell / 4) * 256 + 128) * 1024 + ($Cell % 4) * 256 + 128) * 4
}

$rubber = SampleOffset 2
$chrome = SampleOffset 3
$solarGlass = SampleOffset 4
$carbon = SampleOffset 5

Assert-True ($spec[$rubber + 2] -le 3) "Rubber specular ($($spec[$rubber+2])) exceeds matte threshold."
Assert-True ($spec[$chrome + 2] -ge 60) "Chrome specular ($($spec[$chrome+2])) is too low."
Assert-True ($spec[$solarGlass + 1] -ge 20) "Solar glass reflection ($($spec[$solarGlass+1])) is too low."
Assert-True ($spec[$carbon + 2] -le 6) "Carbon fiber specular ($($spec[$carbon+2])) exceeds matte ceiling."

# Check paint specular ceilings
foreach ($cell in @(0, 1, 8, 9, 11)) {
    $paint = SampleOffset $cell
    Assert-True ($spec[$paint + 2] -gt 0 -and $spec[$paint + 2] -le 16) "Paint cell $cell specular ($($spec[$paint+2])) exceeds runtime ceiling (16)."
}
$solarRoof = SampleOffset 10
Assert-True ($spec[$solarRoof + 2] -ge 50) "Solar roof specular ($($spec[$solarRoof+2])) is too low."
$frontFascia = SampleOffset 12
Assert-True ($spec[$frontFascia + 2] -ge 30) "Front fascia lens specular ($($spec[$frontFascia+2])) is too low."

$house = [IO.File]::ReadAllBytes((Join-Path $ArtDirectory 'CVPriusHouse.tga'))
Assert-True ($house[$rubber + 3] -eq 0) "Rubber must not have team recolor."
$cyanTeam = SampleOffset 1
Assert-True ($house[$cyanTeam + 3] -ge 200) "Cyan trim must receive primary team recolor."

Write-Host '[PASS] Seven ObjectsGDI materials; four maps; tangent frames; safe paint specular; matte rubber/carbon; isolated team recolor.' -ForegroundColor Green
