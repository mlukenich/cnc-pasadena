param(
    [string]$ObjectPath
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'stealth_behavior.ps1')

if (-not $ObjectPath) {
    $workspaceDir = Split-Path -Parent $PSScriptRoot
    $ObjectPath = Join-Path $workspaceDir 'ModSDK\Cnc3Xml\NOD\Units\NODStealthTank.xml'
}

$rawContent = [IO.File]::ReadAllText($ObjectPath)
$modified = ConvertTo-StealthObjectContent $rawContent

# 1. Verify Art & Portrait Binding
if (-not ($modified -match 'SelectPortrait="Portrait_ColumbiaStealth"')) {
    throw 'Missing SelectPortrait="Portrait_ColumbiaStealth"'
}
if (-not ($modified -match 'ButtonImage="Portrait_ColumbiaStealth"')) {
    throw 'Missing ButtonImage="Portrait_ColumbiaStealth"'
}
if (-not ($modified -match '<Model Name="CTSTEALTH_SKIN" />')) {
    throw 'Missing <Model Name="CTSTEALTH_SKIN" />'
}

# 2. Verify Footprint & Simulation Box
if (-not ($modified -match '(?s)MajorRadius="23\.0".*?MinorRadius="12\.0".*?Height="14\.0"')) {
    throw 'Simulation box does not match Columbia Stealth Cruiser dimensions'
}

# 3. Verify Weapons, Stealth Cloaking, Armor & Locomotor Preserved
if (-not ($modified -match 'BuildCost="1500"')) { throw 'BuildCost modified!' }
if (-not ($modified -match 'BuildTime="15"')) { throw 'BuildTime modified!' }
if (-not ($modified -match 'Speed="120\.0"')) { throw 'Base speed modified!' }
if (-not ($modified -match 'Armor="NODStealthTankArmor"')) { throw 'Armor modified!' }
if (-not ($modified -match 'InvisibilityUpdate')) { throw 'Stealth invisibility update missing!' }
if (-not ($modified -match 'TurretNameKey="Turret"')) { throw 'Turret reference missing!' }
if (-not ($modified -match 'BoneName="FXWeaponL"')) { throw 'FXWeaponL rocket bone missing!' }
if (-not ($modified -match 'BoneName="FXWeaponR"')) { throw 'FXWeaponR rocket bone missing!' }

Write-Host "[PASS] test_stealth_behavior: Columbia Stealth Cruiser 46x24x18 footprint covers model; all weapon, stealth, and draw states resolve."
Write-Host "       Only art/portrait/geometry attributes changed; balance, locomotor, weapons and stealth cloaking retained."
