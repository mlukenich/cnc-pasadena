# EA's SDK Documentation/Common_Issues.htm: runtime mod names over 15
# characters crash C&C 3 at startup. Keep the displayed title separate.
$runtimeModName = 'MDShowdown'
$runtimeModVersion = '1.0'

function Assert-ModRuntimeName([string]$Name) {
    if ($Name.Length -lt 1 -or $Name.Length -gt 15 -or $Name -notmatch '^[A-Za-z0-9]+$') {
        throw "Unsafe C&C 3 runtime mod name '$Name': use 1-15 letters/digits. Longer names crash the game before the menu."
    }
}
Assert-ModRuntimeName $runtimeModName
$runtimeArchiveName = $runtimeModName + '.big'
$runtimeConfigName = $runtimeModName + '_' + $runtimeModVersion + '.skudef'
