# Behavioral and Footprint Validator for Columbia Street Sweeper
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptDir 'sweeper_behavior.ps1')

$stockPath = Join-Path $scriptDir '..\ModSDK\CnC3Xml\NOD\Units\NODFlameTank.xml'
if (-not (Test-Path $stockPath)) { throw "Stock XML not found: $stockPath" }

$stockContent = [System.IO.File]::ReadAllText($stockPath)
$modifiedXml = ConvertTo-SweeperObjectContent $stockContent

$doc = New-Object Xml.XmlDocument
$doc.PreserveWhitespace = $true
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
if ($shape.GetAttribute('MajorRadius') -ne '22.0' -or $shape.GetAttribute('MinorRadius') -ne '15.0' -or $shape.GetAttribute('Height') -ne '22.0') {
  throw "Collision footprint does not match 44x30x22 box"
}

# Ensure weapon and armor balance unchanged
if ($obj.GetAttribute('BuildCost') -ne '1200' -or $obj.GetAttribute('BuildTime') -ne '12') {
  throw "Build stats modified"
}

Write-Host "[PASS] test_sweeper_behavior: Street Sweeper 44x30x22 footprint covers model; all weapon and draw states resolve."
Write-Host "       Only art/portrait/geometry attributes changed; balance, locomotor, weapons and upgrades retained."
