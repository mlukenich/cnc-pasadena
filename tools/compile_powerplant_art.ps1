param()
$ErrorActionPreference='Stop'
$workspace=Split-Path -Parent $PSScriptRoot
$sdk=Join-Path $workspace 'ModSDK'
$busy=@(Get-Process -Name 'BinaryAssetBuilder','MakeBig' -ErrorAction SilentlyContinue)
if($busy.Count){throw 'Shared SDK compiler is busy. Do not run concurrent builds.'}
$stage=Join-Path $sdk 'Mods/PowerPlantArt/data'
$artStage=Join-Path $sdk 'Art/PP'
$output=Join-Path $workspace 'build/pasadena-power-art'
New-Item -ItemType Directory -Force $stage,$artStage,$output | Out-Null
foreach($file in @('PPPower_Model.w3x','PPPower_Texture.xml','PPPowerAtlas.tga','PPPowerNormal.tga','PPPowerSpec.tga','PPPowerHouse.tga')){Copy-Item -LiteralPath (Join-Path $workspace ('src/Art/PP/'+$file)) -Destination $artStage -Force}
[IO.File]::WriteAllText((Join-Path $stage 'mod.xml'),'<AssetDeclaration xmlns="uri:ea.com:eala:asset"><Includes><Include type="all" source="ART:PP/PPPower_Model.w3x"/></Includes></AssetDeclaration>')
$compiler=Join-Path $sdk 'Tools/BinaryAssetBuilder.exe'
function Compile-Art([string[]]$Extra,[string]$Name){
 $argsList=@((Join-Path $stage 'mod.xml'),('/od:'+$output),('/iod:'+$output),'/ls:true','/gui:false','/UsePrecompiled:true','/vf:true')+$Extra
 $info=New-Object Diagnostics.ProcessStartInfo
 $info.FileName=$compiler;$info.WorkingDirectory=$workspace;$info.UseShellExecute=$false;$info.CreateNoWindow=$true
 $info.RedirectStandardOutput=$true;$info.RedirectStandardError=$true;$info.EnvironmentVariables['Path']=$env:PATH
 $info.Arguments=($argsList|ForEach-Object{'"'+$_+'"'}) -join ' '
 $process=New-Object Diagnostics.Process;$process.StartInfo=$info;[void]$process.Start()
 $stdout=$process.StandardOutput.ReadToEndAsync();$stderr=$process.StandardError.ReadToEndAsync();$process.WaitForExit()
 $log=$stdout.Result+"`n"+$stderr.Result;$log | Set-Content -LiteralPath (Join-Path $output ($Name+'.log'))
 if($process.ExitCode -ne 0 -or $log -match '(?m)^(Critical:|Error:)'){throw "Art compilation failed; inspect $output/$Name.log"}
 Write-Host "[PASS] $Name art stream compiled without suppressed errors."
}
Compile-Art @() 'compile-main'
$manifest=Join-Path $output 'mods/powerplantart/data/mod.manifest'
if(-not(Test-Path -LiteralPath $manifest)){throw 'Main art manifest missing'}
Compile-Art @('/bcn:LowLOD',('/bps:'+$manifest)) 'compile-low-lod'
Write-Host '[OK] Standalone building art only. No gameplay override, release archive or game installation changed.'
