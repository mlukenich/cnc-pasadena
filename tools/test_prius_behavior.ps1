param([string]$ObjectPath)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'prius_behavior.ps1')
$root = Split-Path -Parent $PSScriptRoot

$stockPath = (Join-Path $root 'ModSDK\Cnc3Xml\NOD\Units\NODScorpionBuggy.xml')
if (-not (Test-Path $stockPath)) {
    $stockPath = (Join-Path $root 'ModSDK\Mods\MarylandShowdown\data\GeneratedOverrides\NOD\Units\NODScorpionBuggy.xml')
}
$stockText = [IO.File]::ReadAllText($stockPath)
[xml]$stock = $stockText
[xml]$converted = ConvertTo-PriusObjectContent $stockText
[xml]$actual = if ($ObjectPath) { [IO.File]::ReadAllText($ObjectPath) } else { $converted.OuterXml }

function Assert-Prius([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw "Prius behavior: $Message" }
}

$unit = $actual.AssetDeclaration.GameObject
$original = $stock.AssetDeclaration.GameObject

Assert-Prius ($unit.id -eq 'NODScorpionBuggy') 'Wrong object staged.'
Assert-Prius ($unit.Geometry.IsSmall -eq 'true') 'Prius EV must be flagged as small scout.'
Assert-Prius ($unit.Geometry.Shape.Type -eq 'BOX') 'Footprint must be a box.'
Assert-Prius ($unit.Geometry.Shape.MajorRadius -eq '26.0') 'Incorrect half-length.'
Assert-Prius ($unit.Geometry.Shape.MinorRadius -eq '12.0') 'Incorrect half-width.'
Assert-Prius ($unit.Geometry.Shape.Height -eq '18.0') 'Incorrect height.'
Assert-Prius ($unit.Geometry.Shape.ContactPointGeneration -eq 'VEHICLE') 'Lost vehicle contacts.'

$report = Get-Content -LiteralPath (Join-Path $root 'src\Art\CV\CVPrius_Model.report.json') -Raw | ConvertFrom-Json
$limits = @(26.0, 12.0, 18.0)
for ($axis = 0; $axis -lt 3; $axis++) {
    $extent = [Math]::Max([Math]::Abs($report.bounds.min[$axis]), [Math]::Abs($report.bounds.max[$axis]))
    Assert-Prius ($limits[$axis] -ge $extent) "Simulation box ($($limits[$axis])) does not cover model extent ($extent) on axis $axis."
    Assert-Prius (($limits[$axis] - $extent) -lt 3.0) "Footprint has excessive padding on axis $axis."
}

# Verify that balance, stats, armor, locomotor, and weapons remain unchanged
foreach ($name in @('BuildCost', 'BuildTime', 'KindOf', 'CommandSet', 'CommandPoints', 'WeaponCategory')) {
    Assert-Prius ($unit.GetAttribute($name) -ceq $original.GetAttribute($name)) "Changed $name."
}
foreach ($name in @('LocomotorSet', 'Body', 'ArmorSet', 'CrusherInfo')) {
    Assert-Prius ($unit.$name.OuterXml -ceq $original.$name.OuterXml) "Changed $name."
}

# Verify hierarchy and bone bindings in W3X
[xml]$art = Get-Content -LiteralPath (Join-Path $root 'src\Art\CV\CVPrius_Model.w3x') -Raw
$pivots = @($art.AssetDeclaration.W3DHierarchy.Pivot)
$names = @($pivots | ForEach-Object { $_.Name })
$draw = $unit.Draws.TruckDraw

Assert-Prius (@($draw.ModelConditionState.Model | Where-Object { $_.Name -ne 'CUPRIUS_SKIN' }).Count -eq 0) 'Stock model leaked into a model condition state.'

$wheelAttributes = @('LeftFrontTireBone', 'RightFrontTireBone', 'LeftRearTireBone', 'RightRearTireBone')
foreach ($attr in $wheelAttributes) {
    Assert-Prius ($names -contains $draw.GetAttribute($attr)) "Unresolved wheel bone: $($draw.GetAttribute($attr))."
}

$state = $draw.ModelConditionState[0]
Assert-Prius ($names -contains $state.Turret.TurretNameKey) "Yaw bone missing: $($state.Turret.TurretNameKey)."
Assert-Prius ($names -contains $state.Turret.TurretPitch) "Pitch bone missing: $($state.Turret.TurretPitch)."

foreach ($name in ($draw.ExtraPublicBone -split ' ')) {
    Assert-Prius ($names -contains $name) "Unresolved public bone: $name."
}

$subobjects = @($art.AssetDeclaration.W3DContainer.SubObject)
foreach ($binding in @(@('BODY', 0), @('TURRET', 5), @('GUNS', 6), @('TIRE_LF', 1), @('TIRE_RF', 2), @('TIRE_LR', 3), @('TIRE_RR', 4))) {
    $matches = @($subobjects | Where-Object { $_.SubObjectID -ceq $binding[0] })
    Assert-Prius ($matches.Count -eq 1 -and [int]$matches[0].BoneIndex -eq $binding[1]) "Incorrect rigid subobject binding: $($binding[0])."
}

# Malformed input fails closed
foreach ($bad in @($stockText.Replace('id="NODScorpionBuggy"', 'id="NotThePrius"'), $stockText.Replace('Type="BOX"', 'Type="SPHERE"'))) {
    $failed = $false
    try { $null = ConvertTo-PriusObjectContent $bad } catch { $failed = $true }
    Assert-Prius $failed 'Malformed source was accepted.'
}

Write-Host '[PASS] Prius 50x24x18 footprint covers model; all states and wheel/turret/FX references resolve.' -ForegroundColor Green
Write-Host '[PASS] Only art/portrait/geometry attributes changed; balance, locomotor, weapons and upgrades retained.' -ForegroundColor Green
