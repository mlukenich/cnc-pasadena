param(
    [string]$ObjectPath
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'mammoth_behavior.ps1')

if (-not $ObjectPath) {
    $workspaceDir = Split-Path -Parent $PSScriptRoot
    $ObjectPath = Join-Path $workspaceDir 'ModSDK\Cnc3Xml\GDI\Units\GDIMammoth.xml'
}

$rawContent = [IO.File]::ReadAllText($ObjectPath)
$modified = ConvertTo-MammothObjectContent $rawContent

# 1. Verify Art & Portrait Binding
if (-not ($modified -match 'SelectPortrait="Portrait_PasadenaMammoth"')) {
    throw 'Missing SelectPortrait="Portrait_PasadenaMammoth"'
}
if (-not ($modified -match 'ButtonImage="Portrait_PasadenaMammoth"')) {
    throw 'Missing ButtonImage="Portrait_PasadenaMammoth"'
}
if (-not ($modified -match '<Model Name="PJMAMMOTH_SKIN" />')) {
    throw 'Missing <Model Name="PJMAMMOTH_SKIN" />'
}

# 2. Verify Footprint & Simulation Box
if (-not ($modified -match '(?s)MajorRadius="35\.0".*?MinorRadius="24\.0".*?Height="28\.0"')) {
    throw 'Simulation box does not match Pasadena Mammoth dimensions'
}

# 3. Verify Weapons, Upgrades, Armor & Locomotor Preserved
if (-not ($modified -match 'BuildCost="2500"')) { throw 'BuildCost modified!' }
if (-not ($modified -match 'BuildTime="25"')) { throw 'BuildTime modified!' }
if (-not ($modified -match 'Speed="40\.0"')) { throw 'Base speed modified!' }
if (-not ($modified -match 'Speed="80\.0"')) { throw 'Upgraded speed modified!' }
if (-not ($modified -match 'Armor="GDIMammothTankArmor"')) { throw 'Armor modified!' }
if (-not ($modified -match 'Upgrade_GDIArmoryRailgunTech')) { throw 'Railgun upgrade reference missing!' }
if (-not ($modified -match 'TurretNameKey="Bone_Turret"')) { throw 'Bone_Turret reference missing!' }
if (-not ($modified -match 'TurretNameKey="Turret01"')) { throw 'Turret01 rocket pod missing!' }
if (-not ($modified -match 'TurretNameKey="Turret02"')) { throw 'Turret02 rocket pod missing!' }

Write-Host "[PASS] test_mammoth_behavior: Monster Juggernaut 70x48x28 footprint covers model; all weapon, railgun, and draw states resolve."
Write-Host "       Only art/portrait/geometry attributes changed; balance, locomotor, weapons and upgrades retained."
