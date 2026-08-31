param([string]$ObjectPath)
# Behavioral and Footprint Validator for Columbia Street Sweeper
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptDir 'sweeper_behavior.ps1')

$stockPath = Join-Path $scriptDir '..\ModSDK\CnC3Xml\NOD\Units\NODFlameTank.xml'
if (-not (Test-Path $stockPath)) { throw "Stock XML not found: $stockPath" }

$stockContent = [System.IO.File]::ReadAllText($stockPath)
$modifiedXml = ConvertTo-SweeperObjectContent $stockContent
if ($ObjectPath) { $modifiedXml = [IO.File]::ReadAllText($ObjectPath) }

$doc = New-Object Xml.XmlDocument
$doc.PreserveWhitespace = $false
$doc.LoadXml($modifiedXml)
$ns = New-Object Xml.XmlNamespaceManager($doc.NameTable)
$ns.AddNamespace('a', 'uri:ea.com:eala:asset')

$obj = $doc.SelectSingleNode('/a:AssetDeclaration/a:GameObject[@id="NODFlameTank"]', $ns)
if ($null -eq $obj) { throw "Missing NODFlameTank GameObject in modified XML" }

if ($obj.GetAttribute('SelectPortrait') -ne 'Portrait_ColumbiaSweeper') {
  throw "SelectPortrait not set to Portrait_ColumbiaSweeper"
}
if ($obj.GetAttribute('ButtonImage') -ne 'Portrait_ColumbiaSweeper') {
  throw "ButtonImage not set to Portrait_ColumbiaSweeper"
}

$shape = $doc.SelectSingleNode('//a:Geometry/a:Shape', $ns)
if ($shape.GetAttribute('MajorRadius') -ne '25.0' -or $shape.GetAttribute('MinorRadius') -ne '19.0' -or $shape.GetAttribute('Height') -ne '26.0') {
  throw "Collision footprint does not match measured 50x38x26 box"
}

# Ensure weapon and armor balance unchanged
if ($obj.GetAttribute('BuildCost') -ne '1200' -or $obj.GetAttribute('BuildTime') -ne '12') {
  throw "Build stats modified"
}

$report = Get-Content -LiteralPath (Join-Path $scriptDir '../src/Art/CS/CSSweeper_Model.report.json') -Raw | ConvertFrom-Json
$limits = @(25,19,26)
for ($k=0;$k -lt 3;$k++) {
    if ([Math]::Abs($report.bounds.min[$k]) -gt $limits[$k] -or $report.bounds.max[$k] -gt $limits[$k]) { throw "Model outside simulation bounds on axis $k" }
}
$stock = New-Object Xml.XmlDocument
$stock.PreserveWhitespace = $false
$stock.LoadXml($stockContent)
$original = $stock.AssetDeclaration.GameObject
# The SDK staging pass assigns an id to stock's unnamed WeaponSetUpdate.
# Normalize only that known compiler repair; all combat content must still match.
if ($ObjectPath) {
    $weaponUpdate = $obj.Behaviors.WeaponSetUpdate
    if (-not $original.Behaviors.WeaponSetUpdate.HasAttribute('id') -and $weaponUpdate.HasAttribute('id')) {
        if ($weaponUpdate.GetAttribute('id') -cne 'ModuleTag_MarylandAutoFix_1') { throw 'Unexpected WeaponSetUpdate id change' }
        $weaponUpdate.RemoveAttribute('id')
    }
}
foreach ($name in @('BuildCost','BuildTime','KindOf','CommandSet','CommandPoints','WeaponCategory')) {
    if ($obj.GetAttribute($name) -cne $original.GetAttribute($name)) { throw "Changed $name" }
}
foreach ($name in @('Behaviors','LocomotorSet','Body','ArmorSet')) {
    $actual = (@($obj.$name) | ForEach-Object { $_.OuterXml }) -join ''
    $expected = (@($original.$name) | ForEach-Object { $_.OuterXml }) -join ''
    if ($actual -cne $expected) { throw "Changed stock $name" }
}
$draw=$obj.Draws.TruckDraw
if ($null -eq $draw -or $null -ne $obj.Draws.TankDraw) { throw 'TruckDraw required for live wheels.' }
if (@($draw.ModelConditionState.Model | Where-Object { $_.Name -ne 'CSSWEEPER_SKIN' }).Count) { throw 'A draw state still references stock art.' }
foreach ($pair in @(@('LeftFrontTireBone','Bone_TireLF'),@('RightFrontTireBone','Bone_TireRF'),@('LeftRearTireBone','Bone_TireLR'),@('RightRearTireBone','Bone_TireRR'))) {
    if ($draw.GetAttribute($pair[0]) -ne $pair[1]) { throw 'Missing wheel binding' }
}
if (@($draw.ModelConditionState.Turret | Where-Object { $_.TurretPitch -eq 'GunPitch' }).Count -lt 1) { throw 'No actual pitch binding' }
foreach ($state in $draw.AnimationState) {
    if ($state.ConditionsYes -notmatch 'DYING|RUBBLE|FREEFALL' -and $state.Animation.AnimationName -ne 'CSSWEEPER_SCRUB') { throw 'Missing brush rotation clip' }
}
Write-Host "[PASS] Sweeper 50x38x26 box; TruckDraw wheels; yaw/pitch; brush animation states."
Write-Host "       Only art/portrait/geometry attributes changed; balance, locomotor, weapons and upgrades retained."
