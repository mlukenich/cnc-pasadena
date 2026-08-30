param([string]$ArtDirectory = (Join-Path (Split-Path -Parent $PSScriptRoot) 'src\Art\PV'))
$ErrorActionPreference = 'Stop'
function Assert-True([bool]$Condition, [string]$Message) { if (-not $Condition) { throw "FAIL: $Message" } }
[xml]$model = Get-Content -LiteralPath (Join-Path $ArtDirectory 'PVDually_Model.w3x') -Raw
[xml]$declarations = Get-Content -LiteralPath (Join-Path $ArtDirectory 'PVDually_Texture.xml') -Raw
$meshes = @($model.AssetDeclaration.W3DMesh)
Assert-True ($meshes.Count -eq 7) 'Expected body, turret, guns, and four wheel meshes.'
$slots = @{ DiffuseTexture='PVDuallyAtlas'; NormalMap='PVDuallyNormal'; SpecMap='PVDuallySpec'; RecolorTexture='PVDuallyHouse' }
foreach ($mesh in $meshes) {
    Assert-True ($mesh.FXShader.ShaderName -eq 'ObjectsGDI.fx') "Expected stock four-map vehicle shader on $($mesh.id)."
    Assert-True (@($mesh.FXShader.Constants.Texture).Count -eq 4) 'Expected four material samplers.'
    foreach ($slot in $slots.Keys) {
        $sampler = @($mesh.FXShader.Constants.Texture | Where-Object { $_.Name -eq $slot })
        Assert-True ($sampler.Count -eq 1 -and $sampler[0].Value -eq $slots[$slot]) "Incorrect $slot on $($mesh.id)."
    }
    $count = @($mesh.Vertices.V).Count
    Assert-True (@($mesh.Normals.N).Count -eq $count) 'Missing vertex normals.'
    Assert-True (@($mesh.Tangents.T).Count -eq $count -and @($mesh.Binormals.B).Count -eq $count) 'Missing normal-map tangent frame.'
    Assert-True (@($mesh.TexCoords.T).Count -eq $count) 'UV/vertex mismatch.'
}
$textureIds = @($declarations.AssetDeclaration.Texture.id)
foreach ($id in $slots.Values) { Assert-True ($textureIds -contains $id) "Undeclared texture $id." }
foreach ($texture in $declarations.AssetDeclaration.Texture) {
    $data = [IO.File]::ReadAllBytes((Join-Path $ArtDirectory $texture.File))
    Assert-True ($data[2] -eq 2 -and $data[16] -eq 32 -and $data[17] -eq 40) 'Expected top-origin 32-bit uncompressed TGA.'
    Assert-True ([BitConverter]::ToUInt16($data,12) -eq 1024 -and [BitConverter]::ToUInt16($data,14) -eq 1024) 'Expected 1024-square maps.'
    Assert-True ($data.Length -eq (18+1024*1024*4)) 'Incomplete texture.'
}
$spec = [IO.File]::ReadAllBytes((Join-Path $ArtDirectory 'PVDuallySpec.tga'))
function SampleOffset([int]$Cell) { return 18 + (([int][Math]::Floor($Cell/4)*256+128)*1024+($Cell%4)*256+128)*4 }
$rubber = SampleOffset 2
$metal = SampleOffset 3
$glass = SampleOffset 4
Assert-True ($spec[$rubber+2] -le 3 -and $spec[$metal+2] -ge 80 -and $spec[$metal+2] -le 110) 'Rubber must stay matte and exposed steel must retain restrained highlights.'
Assert-True ($spec[$rubber+1] -eq 0 -and $spec[$glass+1] -ge 20 -and $spec[$glass+1] -le 40) 'Glass must retain reduced reflection without making rubber reflective.'
foreach ($cell in @(0,1,8,9,10,11,13)) {
    $paint = SampleOffset $cell
    Assert-True ($spec[$paint+2] -gt 0 -and $spec[$paint+2] -le 16) "Paint cell $cell exceeds the runtime-calibrated highlight limit (shader gain 3x)."
    Assert-True ($spec[$paint+1] -eq 0) "Paint cell $cell must not have mirror-like environment reflection."
}
$rust = SampleOffset 5
Assert-True ($spec[$rust+2] -le 5 -and $spec[$rust+1] -eq 0) 'Rusted surfaces must stay almost entirely matte.'
$doorClean = SampleOffset 9
$doorDirt = 18 + ((512+230)*1024+384)*4
Assert-True ($spec[$doorDirt+2] -le 6 -and $spec[$doorDirt+2] -lt $spec[$doorClean+2]) 'Dirty lower door must not reflect like clean paint.'
$normal = [IO.File]::ReadAllBytes((Join-Path $ArtDirectory 'PVDuallyNormal.tga'))
$flat = SampleOffset 4
Assert-True ($normal[$flat] -eq 255 -and $normal[$flat+1] -eq 128 -and $normal[$flat+2] -eq 128) 'Glass must have a flat tangent-space normal.'
$house = [IO.File]::ReadAllBytes((Join-Path $ArtDirectory 'PVDuallyHouse.tga'))
Assert-True ($house[$rubber+3] -eq 0) 'Do not recolor tires.'
$stripe = 18 + ((768+48)*1024+384)*4
Assert-True ($house[$stripe+3] -eq 255) 'Missing dedicated team-color stripe.'
Write-Host '[PASS] Seven ObjectsGDI materials; four maps; tangent frames; low-glare paint; matte grime/rubber/rust; restrained glass/steel; isolated team-color mask.' -ForegroundColor Green
