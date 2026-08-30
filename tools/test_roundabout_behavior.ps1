param([string]$ObjectPath)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'roundabout_behavior.ps1')
$root = Split-Path -Parent $PSScriptRoot

$stockPath = (Join-Path $root 'ModSDK\Cnc3Xml\NOD\Units\NODRaiderTank.xml')
if (-not (Test-Path $stockPath)) {
    $stockPath = (Join-Path $root 'ModSDK\Mods\MarylandShowdown\data\GeneratedOverrides\NOD\Units\NODRaiderTank.xml')
}
$stockText = [IO.File]::ReadAllText($stockPath)
[xml]$stock = $stockText
[xml]$converted = ConvertTo-RoundaboutObjectContent $stockText
[xml]$actual = if ($ObjectPath) { [IO.File]::ReadAllText($ObjectPath) } else { $converted.OuterXml }

function Assert-Roundabout([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw "Roundabout behavior: $Message" }
}

$unit = $actual.AssetDeclaration.GameObject
$original = $stock.AssetDeclaration.GameObject

Assert-Roundabout ($unit.id -eq 'NODRaiderTank') 'Wrong object staged.'
Assert-Roundabout ($unit.Geometry.IsSmall -eq 'false') 'Roundabout Tank is a medium combat vehicle.'
Assert-Roundabout ($unit.Geometry.Shape.Type -eq 'BOX') 'Footprint must be a box.'
Assert-Roundabout ($unit.Geometry.Shape.MajorRadius -eq '24.0') 'Incorrect half-length.'
Assert-Roundabout ($unit.Geometry.Shape.MinorRadius -eq '12.0') 'Incorrect half-width.'
Assert-Roundabout ($unit.Geometry.Shape.Height -eq '22.5') 'Incorrect height.'
Assert-Roundabout ($unit.Geometry.Shape.ContactPointGeneration -eq 'VEHICLE') 'Lost vehicle contacts.'

$report = Get-Content -LiteralPath (Join-Path $root 'src\Art\CR\CRRoundabout_Model.report.json') -Raw | ConvertFrom-Json
$limits = @(24.0, 12.0, 22.5)
for ($axis = 0; $axis -lt 3; $axis++) {
    $extent = [Math]::Max([Math]::Abs($report.bounds.min[$axis]), [Math]::Abs($report.bounds.max[$axis]))
    Assert-Roundabout ($limits[$axis] -ge $extent) "Simulation box ($($limits[$axis])) does not cover model extent ($extent) on axis $axis."
    Assert-Roundabout (($limits[$axis] - $extent) -lt 3.0) "Footprint has excessive padding on axis $axis."
}

# Verify that balance, stats, armor, locomotor, and weapons remain unchanged
foreach ($name in @('BuildCost', 'BuildTime', 'KindOf', 'CommandSet', 'CommandPoints', 'WeaponCategory')) {
    Assert-Roundabout ($unit.GetAttribute($name) -ceq $original.GetAttribute($name)) "Changed $name."
}
foreach ($name in @('LocomotorSet', 'Body')) {
    Assert-Roundabout ($unit.$name.OuterXml -ceq $original.$name.OuterXml) "Changed $name."
}
$actualArmor = (@($unit.ArmorSet | ForEach-Object { $_.OuterXml }) -join '')
$stockArmor = (@($original.ArmorSet | ForEach-Object { $_.OuterXml }) -join '')
Assert-Roundabout ($actualArmor -ceq $stockArmor) "Changed ArmorSet."

# Verify hierarchy and bone bindings in W3X
[xml]$art = Get-Content -LiteralPath (Join-Path $root 'src\Art\CR\CRRoundabout_Model.w3x') -Raw
$pivots = @($art.AssetDeclaration.W3DHierarchy.Pivot)
$names = @($pivots | ForEach-Object { $_.Name })
$draw = $unit.Draws.TankDraw

Assert-Roundabout (@($draw.ModelConditionState.Model | Where-Object { $_.Name -ne 'CRROUNDABOUT_SKIN' }).Count -eq 0) 'Stock model leaked into a model condition state.'

Assert-Roundabout ($names -contains 'Bone_Turret') 'W3X missing Bone_Turret bone.'
Assert-Roundabout ($names -contains 'GunPitch') 'W3X missing GunPitch bone.'
Assert-Roundabout ($names -contains 'GUN') 'W3X missing GUN bone.'
Assert-Roundabout ($names -contains 'TurretFX') 'W3X missing TurretFX bone.'
Assert-Roundabout ($names -contains 'MuzzleFlash_01') 'W3X missing MuzzleFlash_01 bone.'
Assert-Roundabout ($names -contains 'Turret2') 'W3X missing Turret2 bone.'
Assert-Roundabout ($names -contains 'Turret2_Gun') 'W3X missing Turret2_Gun bone.'
Assert-Roundabout ($names -contains 'TurretMS') 'W3X missing TurretMS bone.'
Assert-Roundabout ($names -contains 'Bone_Tail') 'W3X missing Bone_Tail bone.'

Assert-Roundabout ($unit.SelectPortrait -eq 'Portrait_ColumbiaRoundabout') 'Select portrait not bound.'
Assert-Roundabout ($unit.ButtonImage -eq 'Portrait_ColumbiaRoundabout') 'Button image not bound.'

Write-Host '[PASS] Roundabout Tank 48x24x23 footprint covers model; all states and turret/laser/stinger references resolve.'
Write-Host '[PASS] Only art/portrait/geometry attributes changed; balance, locomotor, weapons and upgrades retained.'
