param(
    [switch]$Install,
    [string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'mod_runtime.ps1')
. (Join-Path $PSScriptRoot 'dually_behavior.ps1')
. (Join-Path $PSScriptRoot 'prius_behavior.ps1')
. (Join-Path $PSScriptRoot 'mudtank_behavior.ps1')
. (Join-Path $PSScriptRoot 'roundabout_behavior.ps1')
. (Join-Path $PSScriptRoot 'sweeper_behavior.ps1')
. (Join-Path $PSScriptRoot 'mammoth_behavior.ps1')

$workspaceDir = Split-Path -Parent $PSScriptRoot
$sdkDir = Join-Path $workspaceDir 'ModSDK'
$sourceDir = Join-Path $workspaceDir 'src'
$sourceArtDir = Join-Path $sourceDir 'Art\PV'
$sdkArtDir = Join-Path $sdkDir 'Art\PV'
$sourceCvArtDir = Join-Path $sourceDir 'Art\CV'
$sdkCvArtDir = Join-Path $sdkDir 'Art\CV'
$sourcePmArtDir = Join-Path $sourceDir 'Art\PM'
$sdkPmArtDir = Join-Path $sdkDir 'Art\PM'
$sourceCrArtDir = Join-Path $sourceDir 'Art\CR'
$sdkCrArtDir = Join-Path $sdkDir 'Art\CR'
$sourceCsArtDir = Join-Path $sourceDir 'Art\CS'
$sdkCsArtDir = Join-Path $sdkDir 'Art\CS'
$sourcePjArtDir = Join-Path $sourceDir 'Art\PJ'
$sdkPjArtDir = Join-Path $sdkDir 'Art\PJ'
$stageDir = Join-Path $sdkDir 'Mods\MarylandShowdown\data'
$overrideDir = Join-Path $stageDir 'GeneratedOverrides'
$builtModsDir = Join-Path $sdkDir 'BuiltMods'
$builtModDir = Join-Path $builtModsDir 'mods\marylandshowdown'
$buildDir = Join-Path $workspaceDir 'build'
if ($OutputDirectory) {
    $buildDir = [IO.Path]::GetFullPath((Join-Path $workspaceDir $OutputDirectory))
    $allowedBuildRoot = [IO.Path]::GetFullPath((Join-Path $workspaceDir 'build')).TrimEnd('\') + '\'
    if (-not $buildDir.StartsWith($allowedBuildRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Alternate build outputs must stay under the workspace build directory.' }
}
$compiler = Join-Path $sdkDir 'Tools\BinaryAssetBuilder.exe'
$makeBig = Join-Path $sdkDir 'Tools\MakeBig.exe'

function Assert-File([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Required file not found: $Path"
    }
}

function Remove-GeneratedDirectory([string]$Path, [string]$AllowedParent) {
    if (-not (Test-Path -LiteralPath $Path)) { return }

    $resolvedPath = [IO.Path]::GetFullPath($Path).TrimEnd('\')
    $resolvedParent = [IO.Path]::GetFullPath($AllowedParent).TrimEnd('\') + '\'
    if (-not $resolvedPath.StartsWith($resolvedParent, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove generated directory outside $AllowedParent : $resolvedPath"
    }
    Remove-Item -LiteralPath $resolvedPath -Recurse -Force
}

function Invoke-AssetBuilder([string[]]$Arguments, [string]$LogPath, [string]$Label) {
    Write-Host "[BUILD] $Label"
    # The Codex desktop host can expose both PATH and Path in its raw Windows
    # environment block. This 2007-era .NET executable treats them as a
    # case-insensitive duplicate and crashes while loading its config. A fresh
    # ProcessStartInfo normalizes the environment dictionary for the child.
    $startInfo = New-Object Diagnostics.ProcessStartInfo
    $startInfo.FileName = $compiler
    $startInfo.WorkingDirectory = $workspaceDir
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    # build.bat uses Windows PowerShell 5.1 / .NET Framework, which has no
    # ProcessStartInfo.ArgumentList or Environment properties.
    $startInfo.Arguments = ($Arguments | ForEach-Object {
        if ($_.Contains('"') -or $_.EndsWith('\')) { throw "Unsupported compiler argument: $_" }
        '"' + $_ + '"'
    }) -join ' '
    $startInfo.EnvironmentVariables['Path'] = $env:PATH

    $process = New-Object Diagnostics.Process
    $process.StartInfo = $startInfo
    [void]$process.Start()
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()
    $process.WaitForExit()
    $exitCode = $process.ExitCode
    $output = @(($stdoutTask.Result + "`n" + $stderrTask.Result) -split "`r?`n" | Where-Object { $_ -ne '' })
    $output | Set-Content -LiteralPath $LogPath -Encoding UTF8

    $critical = @($output | Where-Object { "$_" -match '^Critical:' })
    if ($exitCode -ne 0 -or $critical.Count -gt 0) {
        Write-Host "[ERROR] BinaryAssetBuilder failed. Relevant output:" -ForegroundColor Red
        $output | Where-Object { "$_" -match '^(Critical:|Error processing|System\.)' } | Select-Object -Last 40 | ForEach-Object { Write-Host $_ }
        throw "$Label failed (exit $exitCode). Full log: $LogPath"
    }

    $missingArt = @($output | Where-Object { "$_" -match "^Error: Input file 'art:" }).Count
    if ($missingArt -gt 0) {
        Write-Host "[INFO] $missingArt expected raw-art notices were suppressed; the installed game supplies those assets."
    }

    $unexpectedErrors = @($output | Where-Object { "$_" -match '^Error:' -and "$_" -notmatch "^Error: Input file 'art:" })
    if ($unexpectedErrors.Count -gt 0) {
        $unexpectedErrors | Select-Object -Last 40 | ForEach-Object { Write-Host $_ -ForegroundColor Red }
        throw "$Label produced $($unexpectedErrors.Count) unexpected compiler error(s). Full log: $LogPath"
    }
}

Assert-File $compiler
Assert-File $makeBig
Assert-File (Join-Path $sourceDir 'mod.xml')
Assert-File (Join-Path $sourceDir 'LocalizedStrings\strings.xml')

$node = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $node) { throw 'Node.js is required to generate the Pasadena dually art assets.' }
& $node.Source (Join-Path $workspaceDir 'tools\test_dually_geometry.js')
if ($LASTEXITCODE -ne 0) { throw "Pasadena dually asset generation failed with exit code $LASTEXITCODE" }
& (Join-Path $PSScriptRoot 'test_dually_material.ps1') -ArtDirectory $sourceArtDir
Assert-File (Join-Path $sourceArtDir 'PVDually_Model.w3x')
Assert-File (Join-Path $sourceArtDir 'PVDually_Texture.xml')
Assert-File (Join-Path $sourceArtDir 'PVDuallyAtlas.tga')
Assert-File (Join-Path $sourceArtDir 'PVDually_Portrait.xml')
Assert-File (Join-Path $sourceArtDir 'PVDuallyPortrait.tga')

& $node.Source (Join-Path $workspaceDir 'tools\test_prius_geometry.js')
if ($LASTEXITCODE -ne 0) { throw "Columbia Prius asset generation failed with exit code $LASTEXITCODE" }
& (Join-Path $PSScriptRoot 'test_prius_material.ps1') -ArtDirectory $sourceCvArtDir
Assert-File (Join-Path $sourceCvArtDir 'CVPrius_Model.w3x')
Assert-File (Join-Path $sourceCvArtDir 'CVPrius_Texture.xml')
Assert-File (Join-Path $sourceCvArtDir 'CVPriusAtlas.tga')
Assert-File (Join-Path $sourceCvArtDir 'CVPrius_Portrait.xml')
Assert-File (Join-Path $sourceCvArtDir 'CVPriusPortrait.tga')

& $node.Source (Join-Path $workspaceDir 'tools\test_mudtank_geometry.js')
if ($LASTEXITCODE -ne 0) { throw "Pasadena Mud Tank asset generation failed with exit code $LASTEXITCODE" }
& (Join-Path $PSScriptRoot 'test_mudtank_material.ps1') -ArtDirectory $sourcePmArtDir
Assert-File (Join-Path $sourcePmArtDir 'PVMudTank_Model.w3x')
Assert-File (Join-Path $sourcePmArtDir 'PVMudTank_Texture.xml')
Assert-File (Join-Path $sourcePmArtDir 'PVMudTankAtlas.tga')
Assert-File (Join-Path $sourcePmArtDir 'PVMudTank_Portrait.xml')
Assert-File (Join-Path $sourcePmArtDir 'PVMudTankPortrait.tga')

& $node.Source (Join-Path $workspaceDir 'tools\test_roundabout_geometry.js')
if ($LASTEXITCODE -ne 0) { throw "Columbia Roundabout Tank asset generation failed with exit code $LASTEXITCODE" }
& (Join-Path $PSScriptRoot 'test_roundabout_material.ps1') -ArtDirectory $sourceCrArtDir
Assert-File (Join-Path $sourceCrArtDir 'CRRoundabout_Model.w3x')
Assert-File (Join-Path $sourceCrArtDir 'CRRoundabout_Texture.xml')
Assert-File (Join-Path $sourceCrArtDir 'CRRoundaboutAtlas.tga')
Assert-File (Join-Path $sourceCrArtDir 'CRRoundabout_Portrait.xml')
Assert-File (Join-Path $sourceCrArtDir 'CRRoundaboutPortrait.tga')

& $node.Source (Join-Path $workspaceDir 'tools\test_sweeper_geometry.js')
if ($LASTEXITCODE -ne 0) { throw "Columbia Street Sweeper asset generation failed with exit code $LASTEXITCODE" }
& (Join-Path $PSScriptRoot 'test_sweeper_material.ps1') -ArtDirectory $sourceCsArtDir
Assert-File (Join-Path $sourceCsArtDir 'CSSweeper_Model.w3x')
Assert-File (Join-Path $sourceCsArtDir 'CSSweeper_Texture.xml')
Assert-File (Join-Path $sourceCsArtDir 'CSSweeperAtlas.tga')
Assert-File (Join-Path $sourceCsArtDir 'CSSweeper_Portrait.xml')
Assert-File (Join-Path $sourceCsArtDir 'CSSweeperPortrait.tga')

& $node.Source (Join-Path $workspaceDir 'tools\test_mammoth_geometry.js')
if ($LASTEXITCODE -ne 0) { throw "Pasadena Mammoth Juggernaut asset generation failed with exit code $LASTEXITCODE" }
& (Join-Path $PSScriptRoot 'test_mammoth_material.ps1') -ArtDirectory $sourcePjArtDir
Assert-File (Join-Path $sourcePjArtDir 'PJMammoth_Model.w3x')
Assert-File (Join-Path $sourcePjArtDir 'PJMammoth_Texture.xml')
Assert-File (Join-Path $sourcePjArtDir 'PJMammothAtlas.tga')
Assert-File (Join-Path $sourcePjArtDir 'PJMammoth_Portrait.xml')
Assert-File (Join-Path $sourcePjArtDir 'PJMammothPortrait.tga')

Remove-GeneratedDirectory $sdkArtDir (Join-Path $sdkDir 'Art')
New-Item -ItemType Directory -Force -Path $sdkArtDir | Out-Null
Copy-Item -LiteralPath (Join-Path $sourceArtDir 'PVDually_Model.w3x') -Destination $sdkArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceArtDir 'PVDually_Texture.xml') -Destination $sdkArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceArtDir 'PVDuallyAtlas.tga') -Destination $sdkArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceArtDir 'PVDually_Portrait.xml') -Destination $sdkArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceArtDir 'PVDuallyPortrait.tga') -Destination $sdkArtDir -Force
foreach ($materialMap in @('PVDuallyNormal.tga','PVDuallySpec.tga','PVDuallyHouse.tga')) {
    Assert-File (Join-Path $sourceArtDir $materialMap)
    Copy-Item -LiteralPath (Join-Path $sourceArtDir $materialMap) -Destination $sdkArtDir -Force
}

Remove-GeneratedDirectory $sdkCvArtDir (Join-Path $sdkDir 'Art')
New-Item -ItemType Directory -Force -Path $sdkCvArtDir | Out-Null
Copy-Item -LiteralPath (Join-Path $sourceCvArtDir 'CVPrius_Model.w3x') -Destination $sdkCvArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceCvArtDir 'CVPrius_Texture.xml') -Destination $sdkCvArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceCvArtDir 'CVPriusAtlas.tga') -Destination $sdkCvArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceCvArtDir 'CVPrius_Portrait.xml') -Destination $sdkCvArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceCvArtDir 'CVPriusPortrait.tga') -Destination $sdkCvArtDir -Force
foreach ($materialMap in @('CVPriusNormal.tga','CVPriusSpec.tga','CVPriusHouse.tga')) {
    Assert-File (Join-Path $sourceCvArtDir $materialMap)
    Copy-Item -LiteralPath (Join-Path $sourceCvArtDir $materialMap) -Destination $sdkCvArtDir -Force
}

Remove-GeneratedDirectory $sdkPmArtDir (Join-Path $sdkDir 'Art')
New-Item -ItemType Directory -Force -Path $sdkPmArtDir | Out-Null
Copy-Item -LiteralPath (Join-Path $sourcePmArtDir 'PVMudTank_Model.w3x') -Destination $sdkPmArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourcePmArtDir 'PVMudTank_Texture.xml') -Destination $sdkPmArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourcePmArtDir 'PVMudTankAtlas.tga') -Destination $sdkPmArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourcePmArtDir 'PVMudTank_Portrait.xml') -Destination $sdkPmArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourcePmArtDir 'PVMudTankPortrait.tga') -Destination $sdkPmArtDir -Force
foreach ($materialMap in @('PVMudTankNormal.tga','PVMudTankSpec.tga','PVMudTankHouse.tga')) {
    Assert-File (Join-Path $sourcePmArtDir $materialMap)
    Copy-Item -LiteralPath (Join-Path $sourcePmArtDir $materialMap) -Destination $sdkPmArtDir -Force
}

Remove-GeneratedDirectory $sdkCrArtDir (Join-Path $sdkDir 'Art')
New-Item -ItemType Directory -Force -Path $sdkCrArtDir | Out-Null
Copy-Item -LiteralPath (Join-Path $sourceCrArtDir 'CRRoundabout_Model.w3x') -Destination $sdkCrArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceCrArtDir 'CRRoundabout_Texture.xml') -Destination $sdkCrArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceCrArtDir 'CRRoundaboutAtlas.tga') -Destination $sdkCrArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceCrArtDir 'CRRoundabout_Portrait.xml') -Destination $sdkCrArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceCrArtDir 'CRRoundaboutPortrait.tga') -Destination $sdkCrArtDir -Force
foreach ($materialMap in @('CRRoundaboutNormal.tga','CRRoundaboutSpec.tga','CRRoundaboutHouse.tga')) {
    Assert-File (Join-Path $sourceCrArtDir $materialMap)
    Copy-Item -LiteralPath (Join-Path $sourceCrArtDir $materialMap) -Destination $sdkCrArtDir -Force
}

Remove-GeneratedDirectory $sdkCsArtDir (Join-Path $sdkDir 'Art')
New-Item -ItemType Directory -Force -Path $sdkCsArtDir | Out-Null
Copy-Item -LiteralPath (Join-Path $sourceCsArtDir 'CSSweeper_Model.w3x') -Destination $sdkCsArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceCsArtDir 'CSSweeper_Texture.xml') -Destination $sdkCsArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceCsArtDir 'CSSweeperAtlas.tga') -Destination $sdkCsArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceCsArtDir 'CSSweeper_Portrait.xml') -Destination $sdkCsArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourceCsArtDir 'CSSweeperPortrait.tga') -Destination $sdkCsArtDir -Force
foreach ($materialMap in @('CSSweeperNormal.tga','CSSweeperSpec.tga','CSSweeperHouse.tga')) {
    Assert-File (Join-Path $sourceCsArtDir $materialMap)
    Copy-Item -LiteralPath (Join-Path $sourceCsArtDir $materialMap) -Destination $sdkCsArtDir -Force
}

Remove-GeneratedDirectory $sdkPjArtDir (Join-Path $sdkDir 'Art')
New-Item -ItemType Directory -Force -Path $sdkPjArtDir | Out-Null
Copy-Item -LiteralPath (Join-Path $sourcePjArtDir 'PJMammoth_Model.w3x') -Destination $sdkPjArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourcePjArtDir 'PJMammoth_Texture.xml') -Destination $sdkPjArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourcePjArtDir 'PJMammothAtlas.tga') -Destination $sdkPjArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourcePjArtDir 'PJMammoth_Portrait.xml') -Destination $sdkPjArtDir -Force
Copy-Item -LiteralPath (Join-Path $sourcePjArtDir 'PJMammothPortrait.tga') -Destination $sdkPjArtDir -Force
foreach ($materialMap in @('PJMammothNormal.tga','PJMammothSpec.tga','PJMammothHouse.tga')) {
    Assert-File (Join-Path $sourcePjArtDir $materialMap)
    Copy-Item -LiteralPath (Join-Path $sourcePjArtDir $materialMap) -Destination $sdkPjArtDir -Force
}

New-Item -ItemType Directory -Force -Path $stageDir, $buildDir | Out-Null
Remove-GeneratedDirectory $overrideDir $stageDir
Remove-GeneratedDirectory $builtModDir (Join-Path $builtModsDir 'mods')
New-Item -ItemType Directory -Force -Path $overrideDir | Out-Null

# These are complete, known-good 1.09 game objects from the SDK. Most only
# replace player-facing text. The exemplar also replaces its art and fits
# its simulation geometry; weapons, AI hooks and production stay stock.
$overrides = @(
    @('GDI\Structures\GDIConstructionYard.xml', 'Name:PasadenaConYard', 'Desc:PasadenaConYard'),
    @('GDI\Structures\GDIPowerPlant.xml', 'Name:PasadenaPowerPlant', 'Desc:PasadenaPowerPlant'),
    @('GDI\Structures\GDIRefinery.xml', 'Name:PasadenaRefinery', 'Desc:PasadenaRefinery'),
    @('GDI\Structures\GDIBarracks.xml', 'Name:PasadenaBarracks', 'Desc:PasadenaBarracks'),
    @('GDI\Structures\GDIWarfactory.xml', 'Name:PasadenaWarFactory', 'Desc:PasadenaWarFactory'),
    @('GDI\Structures\GDIAirTower.xml', 'Name:PasadenaAirfield', 'Desc:PasadenaAirfield'),
    @('GDI\Structures\GDISpaceCommandUplink.xml', 'Name:PasadenaTechCenter', 'Desc:PasadenaTechCenter'),
    @('GDI\Structures\GDIGolumCannon.xml', 'Name:PasadenaDefenseTurret', 'Desc:PasadenaDefenseTurret'),
    @('GDI\Structures\GDIAABattery.xml', 'Name:PasadenaAA', 'Desc:PasadenaAA'),
    @('GDI\Structures\GDIIonCannonControl.xml', 'Name:PasadenaSuperweapon', 'Desc:PasadenaSuperweapon'),
    @('GDI\Units\GDIRifleSoldier.xml', 'Name:PasadenaInfantryMilitia', 'Desc:PasadenaInfantryMilitia'),
    @('GDI\Units\GDIRifleSoldierSquad.xml', 'Name:PasadenaInfantryMilitia', 'Desc:PasadenaInfantryMilitia'),
    @('GDI\Units\GDIMissileSoldier.xml', 'Name:PasadenaInfantryWaterman', 'Desc:PasadenaInfantryWaterman'),
    @('GDI\Units\GDIMissileSoldierSquad.xml', 'Name:PasadenaInfantryWaterman', 'Desc:PasadenaInfantryWaterman'),
    @('GDI\Units\GDIZoneTrooper.xml', 'Name:PasadenaInfantryLeafblower', 'Desc:PasadenaInfantryLeafblower'),
    @('GDI\Units\GDIZoneTrooperSquad.xml', 'Name:PasadenaInfantryLeafblower', 'Desc:PasadenaInfantryLeafblower'),
    @('GDI\Units\GDICommando.xml', 'Name:PasadenaInfantryCommando', 'Desc:PasadenaInfantryCommando'),
    @('GDI\Units\GDIPitbull.xml', 'Name:PasadenaVehicleDually', 'Desc:PasadenaVehicleDually'),
    @('GDI\Units\GDIPredator.xml', 'Name:PasadenaVehicleMudTank', 'Desc:PasadenaVehicleMudTank'),
    @('GDI\Units\GDIJuggernaught.xml', 'Name:PasadenaVehiclePontoon', 'Desc:PasadenaVehiclePontoon'),
    @('GDI\Units\GDIMammoth.xml', 'Name:PasadenaVehicleMonster', 'Desc:PasadenaVehicleMonster'),
    @('GDI\Units\GDIOrca.xml', 'Name:PasadenaAircraftSeaplane', 'Desc:PasadenaAircraftSeaplane'),
    @('NOD\Structures\NODConstructionYard.xml', 'Name:ColumbiaConYard', 'Desc:ColumbiaConYard'),
    @('NOD\Structures\NODPowerPlant.xml', 'Name:ColumbiaPowerPlant', 'Desc:ColumbiaPowerPlant'),
    @('NOD\Structures\NODRefinery.xml', 'Name:ColumbiaRefinery', 'Desc:ColumbiaRefinery'),
    @('NOD\Structures\NODHandOfNOD.xml', 'Name:ColumbiaBarracks', 'Desc:ColumbiaBarracks'),
    @('NOD\Structures\NODTechAssemblyPlant.xml', 'Name:ColumbiaWarFactory', 'Desc:ColumbiaWarFactory'),
    @('NOD\Structures\NODHangar.xml', 'Name:ColumbiaAirfield', 'Desc:ColumbiaAirfield'),
    @('NOD\Structures\NODOperationsCenter.xml', 'Name:ColumbiaTechCenter', 'Desc:ColumbiaTechCenter'),
    @('NOD\Structures\NODShredderTurretHub.xml', 'Name:ColumbiaDefenseTurret', 'Desc:ColumbiaDefenseTurret'),
    @('NOD\Structures\NODRocketBunker.xml', 'Name:ColumbiaAA', 'Desc:ColumbiaAA'),
    @('NOD\Structures\NODTempleOfNOD.xml', 'Name:ColumbiaSuperweapon', 'Desc:ColumbiaSuperweapon'),
    @('NOD\Units\NODMilitant.xml', 'Name:ColumbiaInfantryCyclist', 'Desc:ColumbiaInfantryCyclist'),
    @('NOD\Units\NODMilitantSquad.xml', 'Name:ColumbiaInfantryCyclist', 'Desc:ColumbiaInfantryCyclist'),
    @('NOD\Units\NODMilitantRocket.xml', 'Name:ColumbiaInfantryOfficer', 'Desc:ColumbiaInfantryOfficer'),
    @('NOD\Units\NODMilitantRocketSquad.xml', 'Name:ColumbiaInfantryOfficer', 'Desc:ColumbiaInfantryOfficer'),
    @('NOD\Units\NODBlackHand.xml', 'Name:ColumbiaInfantryPilates', 'Desc:ColumbiaInfantryPilates'),
    @('NOD\Units\NODBlackHandSquad.xml', 'Name:ColumbiaInfantryPilates', 'Desc:ColumbiaInfantryPilates'),
    @('NOD\Units\NODCommando.xml', 'Name:ColumbiaInfantryCommando', 'Desc:ColumbiaInfantryCommando'),
    @('NOD\Units\NODScorpionBuggy.xml', 'Name:ColumbiaVehiclePrius', 'Desc:ColumbiaVehiclePrius'),
    @('NOD\Units\NODRaiderTank.xml', 'Name:ColumbiaVehicleRoundabout', 'Desc:ColumbiaVehicleRoundabout'),
    @('NOD\Units\NODFlameTank.xml', 'Name:ColumbiaVehicleStreetSweeper', 'Desc:ColumbiaVehicleStreetSweeper'),
    @('NOD\Units\NODAvatar.xml', 'Name:ColumbiaVehicleDroneCarrier', 'Desc:ColumbiaVehicleDroneCarrier'),
    @('NOD\Units\NODVenom.xml', 'Name:ColumbiaAircraftDrone', 'Desc:ColumbiaAircraftDrone')
)

$displayRegex = New-Object Text.RegularExpressions.Regex('(?s)<DisplayName\b[^>]*>.*?</DisplayName>')
$descriptionRegex = New-Object Text.RegularExpressions.Regex('Description="[^"]*"')
$unnamedModuleRegex = New-Object Text.RegularExpressions.Regex('<(StructureUnpackUpdate|SupplyCenterCreate|PowerUpdate|WeaponSetUpdate)(?![^>]*\bid=)([^>]*)>')

foreach ($item in $overrides) {
    $relativePath = $item[0]
    $nameKey = $item[1]
    $descriptionKey = $item[2]
    $sourcePath = Join-Path (Join-Path $sdkDir 'Cnc3Xml') $relativePath
    Assert-File $sourcePath

    $targetPath = Join-Path $overrideDir $relativePath
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $targetPath) | Out-Null
    $content = [IO.File]::ReadAllText($sourcePath)
    $content = $descriptionRegex.Replace($content, "Description=`"$descriptionKey`"", 1)
    $displayElement = "<DisplayName xai:joinAction=`"Replace`" xmlns:xai=`"uri:ea.com:eala:asset:instance`">$nameKey</DisplayName>"
    $content = $displayRegex.Replace($content, $displayElement, 1)
    $moduleIndex = 0
    $content = $unnamedModuleRegex.Replace($content, {
        param($match)
        $script:moduleIndex++
        return "<$($match.Groups[1].Value) id=`"ModuleTag_MarylandAutoFix_$script:moduleIndex`"$($match.Groups[2].Value)>"
    })
    if ($relativePath -eq 'GDI\Units\GDIPitbull.xml') {
        $content = ConvertTo-DuallyObjectContent $content
    }
    if ($relativePath -eq 'GDI\Units\GDIPredator.xml') {
        $content = ConvertTo-MudTankObjectContent $content
    }
    if ($relativePath -eq 'NOD\Units\NODScorpionBuggy.xml') {
        $content = ConvertTo-PriusObjectContent $content
    }
    if ($relativePath -eq 'NOD\Units\NODRaiderTank.xml') {
        $content = ConvertTo-RoundaboutObjectContent $content
    }
    if ($relativePath -eq 'NOD\Units\NODFlameTank.xml') {
        $content = ConvertTo-SweeperObjectContent $content
    }
    if ($relativePath -eq 'GDI\Units\GDIMammoth.xml') {
        $content = ConvertTo-MammothObjectContent $content
    }
    [IO.File]::WriteAllText($targetPath, $content, (New-Object Text.UTF8Encoding($false)))
}

& (Join-Path $PSScriptRoot 'test_dually_behavior.ps1') -ObjectPath (Join-Path $overrideDir 'GDI\Units\GDIPitbull.xml')
& (Join-Path $PSScriptRoot 'test_mudtank_behavior.ps1') -ObjectPath (Join-Path $overrideDir 'GDI\Units\GDIPredator.xml')
& (Join-Path $PSScriptRoot 'test_prius_behavior.ps1') -ObjectPath (Join-Path $overrideDir 'NOD\Units\NODScorpionBuggy.xml')
& (Join-Path $PSScriptRoot 'test_roundabout_behavior.ps1') -ObjectPath (Join-Path $overrideDir 'NOD\Units\NODRaiderTank.xml')
& (Join-Path $PSScriptRoot 'test_sweeper_behavior.ps1') -ObjectPath (Join-Path $overrideDir 'NOD\Units\NODFlameTank.xml')
& (Join-Path $PSScriptRoot 'test_mammoth_behavior.ps1') -ObjectPath (Join-Path $overrideDir 'GDI\Units\GDIMammoth.xml')

Copy-Item -LiteralPath (Join-Path $sourceDir 'mod.xml') -Destination (Join-Path $stageDir 'mod.xml') -Force

# Convert the editable XML string table into the STR format consumed by C&C 3 mods.
[xml]$stringsXml = Get-Content -LiteralPath (Join-Path $sourceDir 'LocalizedStrings\strings.xml') -Raw
$strLines = New-Object Collections.Generic.List[string]
foreach ($entry in $stringsXml.StringTable.String) {
    $value = [string]$entry.InnerText
    $value = $value.Replace('"', '\"')
    $strLines.Add([string]$entry.id)
    $strLines.Add('"' + $value + '"')
    $strLines.Add('END')
    $strLines.Add('')
}
$modStr = Join-Path $stageDir 'mod.str'
[IO.File]::WriteAllLines($modStr, $strLines, (New-Object Text.UTF8Encoding($false)))

$commonArgs = @(
    (Join-Path $stageDir 'mod.xml'),
    "/od:$builtModsDir",
    "/iod:$builtModsDir",
    '/ls:true',
    '/gui:false',
    '/UsePrecompiled:true',
    '/vf:true'
)
Invoke-AssetBuilder $commonArgs (Join-Path $buildDir 'compile.log') 'Compiling main asset stream'

$manifest = Join-Path $builtModDir 'data\mod.manifest'
Assert-File $manifest
$lowArgs = $commonArgs + @('/bcn:LowLOD', "/bps:$manifest")
Invoke-AssetBuilder $lowArgs (Join-Path $buildDir 'compile-low-lod.log') 'Compiling low-LOD asset stream'

& $node.Source (Join-Path $workspaceDir 'tools\test_dually_compiled.js')
if ($LASTEXITCODE -ne 0) { throw 'Compiled Dually art verification failed; refusing to package the mod.' }

& $node.Source (Join-Path $workspaceDir 'tools\test_prius_compiled.js')
if ($LASTEXITCODE -ne 0) { throw 'Compiled Prius art verification failed; refusing to package the mod.' }

& $node.Source (Join-Path $workspaceDir 'tools\test_mudtank_compiled.js')
if ($LASTEXITCODE -ne 0) { throw 'Compiled Mud Tank art verification failed; refusing to package the mod.' }

& $node.Source (Join-Path $workspaceDir 'tools\test_roundabout_compiled.js')
if ($LASTEXITCODE -ne 0) { throw 'Compiled Roundabout art verification failed; refusing to package the mod.' }

& $node.Source (Join-Path $workspaceDir 'tools\test_sweeper_compiled.js')
if ($LASTEXITCODE -ne 0) { throw 'Compiled Street Sweeper art verification failed; refusing to package the mod.' }

& $node.Source (Join-Path $workspaceDir 'tools\test_mammoth_compiled.js')
if ($LASTEXITCODE -ne 0) { throw 'Compiled Mammoth Juggernaut art verification failed; refusing to package the mod.' }

$builtDataDir = Join-Path $builtModDir 'data'
New-Item -ItemType Directory -Force -Path $builtDataDir | Out-Null
Copy-Item -LiteralPath $modStr -Destination (Join-Path $builtDataDir 'mod.str') -Force

$shaderTarget = Join-Path $builtModDir 'Shaders'
New-Item -ItemType Directory -Force -Path $shaderTarget | Out-Null
Copy-Item -Path (Join-Path $sdkDir 'Shaders\*.fx') -Destination $shaderTarget -Force
Remove-Item -LiteralPath (Join-Path $builtDataDir 'mod_L.version') -Force -ErrorAction SilentlyContinue

$bigPath = Join-Path $buildDir $runtimeArchiveName
& $makeBig -f $builtModDir '-x:*.asset' "-o:$bigPath"
if ($LASTEXITCODE -ne 0) { throw "MakeBig failed with exit code $LASTEXITCODE" }
Assert-File $bigPath

$skuPath = Join-Path $buildDir $runtimeConfigName
[IO.File]::WriteAllLines($skuPath, @('mod-game 1.9', ('add-big ' + $runtimeArchiveName)), (New-Object Text.ASCIIEncoding))

Write-Host "[OK] Built $bigPath ($((Get-Item -LiteralPath $bigPath).Length) bytes)" -ForegroundColor Green

if ($Install) {
    $documentsDir = [Environment]::GetFolderPath('MyDocuments')
    if ([string]::IsNullOrWhiteSpace($documentsDir)) { throw 'Windows Documents folder could not be located.' }
    $installDir = Join-Path $documentsDir ('Command & Conquer 3 Tiberium Wars\Mods\' + $runtimeModName)
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
    Copy-Item -LiteralPath $bigPath -Destination (Join-Path $installDir $runtimeArchiveName) -Force
    Copy-Item -LiteralPath $skuPath -Destination (Join-Path $installDir $runtimeConfigName) -Force
    Write-Host "[OK] Installed to $installDir" -ForegroundColor Green
}
