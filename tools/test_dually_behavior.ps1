param([string]$ObjectPath)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'dually_behavior.ps1')
$root = Split-Path -Parent $PSScriptRoot
$stockText = [IO.File]::ReadAllText((Join-Path $root 'ModSDK\Cnc3Xml\GDI\Units\GDIPitbull.xml'))
[xml]$stock = $stockText
[xml]$converted = ConvertTo-DuallyObjectContent $stockText
[xml]$actual = if ($ObjectPath) { [IO.File]::ReadAllText($ObjectPath) } else { $converted.OuterXml }
function Assert-Dually([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw "Dually behavior: $Message" }
}
$unit = $actual.AssetDeclaration.GameObject
$original = $stock.AssetDeclaration.GameObject
Assert-Dually ($unit.id -eq 'GDIPitbull') 'Wrong object staged.'
Assert-Dually ($unit.Geometry.IsSmall -eq 'false') 'Truck still flagged as small.'
Assert-Dually ($unit.Geometry.Shape.Type -eq 'BOX') 'Footprint must be a box.'
Assert-Dually ($unit.Geometry.Shape.MajorRadius -eq '27.0') 'Incorrect half-length.'
Assert-Dually ($unit.Geometry.Shape.MinorRadius -eq '12.0') 'Incorrect half-width.'
Assert-Dually ($unit.Geometry.Shape.Height -eq '25.0') 'Incorrect height.'
Assert-Dually ($unit.Geometry.Shape.ContactPointGeneration -eq 'VEHICLE') 'Lost vehicle contacts.'
$report = Get-Content -LiteralPath (Join-Path $root 'src\Art\PV\PVDually_Model.report.json') -Raw | ConvertFrom-Json
$limits = @(27.0, 12.0, 25.0)
for ($axis = 0; $axis -lt 3; $axis++) {
    $extent = [Math]::Max([Math]::Abs($report.bounds.min[$axis]), [Math]::Abs($report.bounds.max[$axis]))
    Assert-Dually ($limits[$axis] -ge $extent) 'Simulation box does not cover the exported model.'
    Assert-Dually (($limits[$axis] - $extent) -lt 2) 'Footprint has excessive empty padding.'
}

# Prove the converter changes only the intended attributes, including on
# future SDK updates. It must not quietly change balance or other modules.
[xml]$restored = $converted.OuterXml
$restoredUnit = $restored.AssetDeclaration.GameObject
foreach ($name in @('SelectPortrait', 'ButtonImage')) {
    $restoredUnit.SetAttribute($name, $original.GetAttribute($name))
}
$beforeModels = @($original.Draws.TruckDraw.ModelConditionState.Model)
$afterModels = @($restoredUnit.Draws.TruckDraw.ModelConditionState.Model)
for ($i = 0; $i -lt $beforeModels.Count; $i++) {
    $afterModels[$i].SetAttribute('Name', $beforeModels[$i].GetAttribute('Name'))
}
$restoredUnit.Geometry.SetAttribute('IsSmall', $original.Geometry.IsSmall)
foreach ($name in @('MajorRadius', 'MinorRadius', 'Height')) {
    $restoredUnit.Geometry.Shape.SetAttribute($name, $original.Geometry.Shape.GetAttribute($name))
}
Assert-Dually ($restored.OuterXml -ceq $stock.OuterXml) 'Unintended changes outside the allowed attributes.'

foreach ($name in @('BuildCost','BuildTime','KindOf','CommandSet','CommandPoints','WeaponCategory')) {
    Assert-Dually ($unit.GetAttribute($name) -ceq $original.GetAttribute($name)) "Changed $name."
}
foreach ($name in @('LocomotorSet','Body','ArmorSet','CrusherInfo')) {
    Assert-Dually ($unit.$name.OuterXml -ceq $original.$name.OuterXml) "Changed $name."
}
Assert-Dually ($unit.Behaviors.WeaponSetUpdate.OuterXml -ceq $original.Behaviors.WeaponSetUpdate.OuterXml) 'Weapons/turret AI changed.'

# Check the references in the actual staged object against the exported
# hierarchy, rather than merely checking that familiar names exist in code.
[xml]$art = Get-Content -LiteralPath (Join-Path $root 'src\Art\PV\PVDually_Model.w3x') -Raw
$pivots = @($art.AssetDeclaration.W3DHierarchy.Pivot)
$names = @($pivots | ForEach-Object { $_.Name })
$draw = $unit.Draws.TruckDraw
Assert-Dually ($draw.TireRotationMultiplier -eq $original.Draws.TruckDraw.TireRotationMultiplier) 'Wheel-rate tuning changed without runtime evidence.'
Assert-Dually (@($draw.ModelConditionState.Model | Where-Object { $_.Name -ne 'PVDUALLY_SKIN' }).Count -eq 0) 'Stock model leaked into an exemplar state.'
Assert-Dually (@($draw.SelectNodes('.//*[local-name()="Animation"]')).Count -eq 0) 'Stock animation may overwrite custom rest pivots.'
$wheelAttributes = @('LeftFrontTireBone','RightFrontTireBone','LeftRearTireBone','RightRearTireBone')
for ($i = 0; $i -lt 4; $i++) {
    Assert-Dually ($draw.GetAttribute($wheelAttributes[$i]) -ceq $names[$i + 1]) "Bad wheel binding: $($wheelAttributes[$i])."
}
$state = $draw.ModelConditionState[0]
Assert-Dually ($state.Turret.TurretNameKey -ceq $names[5]) 'Yaw bone missing.'
Assert-Dually ($state.Turret.TurretPitch -ceq $names[6]) 'Pitch bone missing.'
Assert-Dually ($pivots[6].Parent -eq '5' -and $pivots[7].Parent -eq '6' -and $pivots[8].Parent -eq '6') 'Gun/muzzle hierarchy broken.'
foreach ($node in $actual.SelectNodes('//*[@BoneName]')) {
    Assert-Dually ($names -contains $node.BoneName) "Unresolved FX/track bone: $($node.BoneName)."
}
foreach ($name in ($draw.ExtraPublicBone -split ' ')) {
    Assert-Dually ($names -contains $name) "Unresolved public bone: $name."
}
foreach ($name in @($draw.TrackMarksLeftBone, $draw.TrackMarksRightBone, $unit.Draws.SpotlightDraw.AttachToBoneInAnotherModule)) {
    Assert-Dually ($names -contains $name) "Unresolved track/spotlight bone: $name."
}
$subobjects = @($art.AssetDeclaration.W3DContainer.SubObject)
foreach ($binding in @(@('BODY',0),@('TURRET',5),@('GUNS',6),@('TIRE01',1),@('TIRE02',2),@('TIRE03',3),@('TIRE04',4))) {
    $matches = @($subobjects | Where-Object { $_.SubObjectID -ceq $binding[0] })
    Assert-Dually ($matches.Count -eq 1 -and [int]$matches[0].BoneIndex -eq $binding[1]) "Incorrect rigid binding: $($binding[0])."
}

# A stale/changed stock schema must fail closed, not silently skip the fix.
foreach ($bad in @($stockText.Replace('id="GDIPitbull"','id="NotTheExemplar"'), $stockText.Replace('Type="BOX"','Type="SPHERE"'))) {
    $failed = $false
    try { $null = ConvertTo-DuallyObjectContent $bad } catch { $failed = $true }
    Assert-Dually $failed 'Malformed source was accepted.'
}
Write-Host '[PASS] Dually 54x24x25 footprint covers the model; all states and wheel/turret/FX references resolve.'
Write-Host '[PASS] Only art/portrait/geometry attributes changed; balance, locomotor, weapon and turret settings retained.'
