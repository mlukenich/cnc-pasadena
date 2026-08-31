param([string]$ObjectPath)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'mudtank_behavior.ps1')
$root = Split-Path -Parent $PSScriptRoot

$stockPath = (Join-Path $root 'ModSDK\Cnc3Xml\GDI\Units\GDIPredator.xml')
if (-not (Test-Path $stockPath)) {
    $stockPath = (Join-Path $root 'ModSDK\Mods\MarylandShowdown\data\GeneratedOverrides\GDI\Units\GDIPredator.xml')
}
$stockText = [IO.File]::ReadAllText($stockPath)
[xml]$stock = $stockText
[xml]$converted = ConvertTo-MudTankObjectContent $stockText
[xml]$actual = if ($ObjectPath) { [IO.File]::ReadAllText($ObjectPath) } else { $converted.OuterXml }

function Assert-MudTank([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw "MudTank behavior: $Message" }
}

$unit = $actual.AssetDeclaration.GameObject
$original = $stock.AssetDeclaration.GameObject

Assert-MudTank ($unit.id -eq 'GDIPredator') 'Wrong object staged.'
Assert-MudTank ($unit.Geometry.IsSmall -eq 'false') 'Mud Tank is a medium armor combat vehicle.'
Assert-MudTank ($unit.Geometry.Shape.Type -eq 'BOX') 'Footprint must be a box.'
Assert-MudTank ($unit.Geometry.Shape.MajorRadius -eq '31.0') 'Incorrect half-length.'
Assert-MudTank ($unit.Geometry.Shape.MinorRadius -eq '18.0') 'Incorrect half-width.'
Assert-MudTank ($unit.Geometry.Shape.Height -eq '31.0') 'Incorrect height.'
Assert-MudTank ($unit.Geometry.Shape.ContactPointGeneration -eq 'VEHICLE') 'Lost vehicle contacts.'

$report = Get-Content -LiteralPath (Join-Path $root 'src\Art\PM\PVMudTank_Model.report.json') -Raw | ConvertFrom-Json
$limits = @(31.0, 18.0, 31.0)
for ($axis = 0; $axis -lt 3; $axis++) {
    $extent = [Math]::Max([Math]::Abs($report.bounds.min[$axis]), [Math]::Abs($report.bounds.max[$axis]))
    Assert-MudTank ($limits[$axis] -ge $extent) "Simulation box ($($limits[$axis])) does not cover model extent ($extent) on axis $axis."
    Assert-MudTank (($limits[$axis] - $extent) -lt 3.0) "Footprint has excessive padding on axis $axis."
}

# Verify that balance, stats, armor, locomotor, and weapons remain unchanged
foreach ($name in @('BuildCost', 'BuildTime', 'KindOf', 'CommandSet', 'CommandPoints', 'WeaponCategory')) {
    Assert-MudTank ($unit.GetAttribute($name) -ceq $original.GetAttribute($name)) "Changed $name."
}
foreach ($name in @('LocomotorSet', 'Body', 'ArmorSet', 'Behaviors', 'CrusherInfo')) {
    Assert-MudTank ($unit.$name.OuterXml -ceq $original.$name.OuterXml) "Changed $name."
}

# Verify hierarchy and bone bindings in W3X
[xml]$art = Get-Content -LiteralPath (Join-Path $root 'src\Art\PM\PVMudTank_Model.w3x') -Raw
$pivots = @($art.AssetDeclaration.W3DHierarchy.Pivot)
$names = @($pivots | ForEach-Object { $_.Name })
$draw = $unit.Draws.TruckDraw
Assert-MudTank ($null -ne $draw -and $null -eq $unit.Draws.TankDraw) 'TruckDraw, not TankDraw, must drive these wheel bones.'
Assert-MudTank ($draw.TireRotationMultiplier -eq '0.11363636') 'Unexpected nominal wheel roll coefficient.'
Assert-MudTank ($draw.TrackMarks -eq 'EXTireTrack2') 'Tank tracks retained on wheeled vehicle.'
Assert-MudTank ($null -eq $draw.AnimationState -and $null -eq $draw.LeftTread -and $null -eq $draw.RightTread) 'Old tread-state animation can interfere with wheel draw.'
foreach ($binding in @(@('LeftFrontTireBone','Bone_TireLF','TIRE_LF',1),@('RightFrontTireBone','Bone_TireRF','TIRE_RF',2),@('LeftRearTireBone','Bone_TireLR','TIRE_LR',3),@('RightRearTireBone','Bone_TireRR','TIRE_RR',4))) {
    Assert-MudTank ($draw.GetAttribute($binding[0]) -ceq $binding[1]) "Missing live wheel binding $($binding[0])."
    Assert-MudTank ($pivots[$binding[3]].Name -ceq $binding[1] -and $pivots[$binding[3]].Parent -eq '0') 'Wheel parent/pivot mismatch.'
    $part=@($art.AssetDeclaration.W3DContainer.SubObject | Where-Object {$_.SubObjectID -ceq $binding[2]})
    Assert-MudTank ($part.Count -eq 1 -and $part[0].BoneIndex -eq $binding[3]) 'Wheel geometry is not bound to the driven bone.'
}
$turret=$draw.ModelConditionState[0].Turret
Assert-MudTank ($turret.TurretNameKey -eq 'Turret' -and $turret.TurretPitch -eq 'Barrel') 'Yaw/pitch binding lost during draw conversion.'

Assert-MudTank (@($draw.ModelConditionState.Model | Where-Object { $_.Name -ne 'PVMUDTANK_SKIN' }).Count -eq 0) 'Stock model leaked into a model condition state.'

Assert-MudTank ($names -contains 'Turret') 'W3X missing Turret bone.'
Assert-MudTank ($names -contains 'Barrel') 'W3X missing Barrel bone.'
Assert-MudTank ($names -contains 'FXMUZZLEFLASH') 'W3X missing FXMUZZLEFLASH bone.'
Assert-MudTank ($names -contains 'FXTracksL') 'W3X missing FXTracksL bone.'
Assert-MudTank ($names -contains 'FXTracksR') 'W3X missing FXTracksR bone.'

Assert-MudTank ($unit.SelectPortrait -eq 'Portrait_PasadenaMudTank') 'Select portrait not bound.'
Assert-MudTank ($unit.ButtonImage -eq 'Portrait_PasadenaMudTank') 'Button image not bound.'

Write-Host '[PASS] Mud Tank 62x36x31 footprint; TruckDraw binds all four rigid wheels and retains turret/barrel/FX bindings (runtime motion still needs observation).'
Write-Host '[PASS] Art/portrait/draw/geometry conversion checked; balance, locomotor, weapons and upgrades retained.'
