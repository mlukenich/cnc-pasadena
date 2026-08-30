param([string]$EffectPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'build/render-diagnostics/ObjectsGDI.runtime.fxo'))
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class ShaderInspection {
  [DllImport("d3dcompiler_47.dll", CallingConvention=CallingConvention.StdCall)]
  static extern int D3DDisassemble(byte[] data, UIntPtr size, uint flags, string comments, out IntPtr blob);
  [UnmanagedFunctionPointer(CallingConvention.StdCall)] delegate IntPtr BlobPointer(IntPtr self);
  [UnmanagedFunctionPointer(CallingConvention.StdCall)] delegate UIntPtr BlobSize(IntPtr self);
  public static string Disassemble(byte[] data) {
    IntPtr blob; int result=D3DDisassemble(data,(UIntPtr)data.Length,0,null,out blob);
    if(result<0)return null;
    try {
      IntPtr table=Marshal.ReadIntPtr(blob);
      var ptr=(BlobPointer)Marshal.GetDelegateForFunctionPointer(Marshal.ReadIntPtr(table,3*IntPtr.Size),typeof(BlobPointer));
      var size=(BlobSize)Marshal.GetDelegateForFunctionPointer(Marshal.ReadIntPtr(table,4*IntPtr.Size),typeof(BlobSize));
      return Marshal.PtrToStringAnsi(ptr(blob),(int)size(blob).ToUInt64()).TrimEnd('\0');
    } finally { Marshal.Release(blob); }
  }
}
'@
$bytes=[IO.File]::ReadAllBytes($EffectPath)
$sections=New-Object 'Collections.Generic.List[string]'
for($offset=0;$offset -lt $bytes.Length-4;$offset+=4) {
    $version=[BitConverter]::ToUInt32($bytes,$offset)
    if($version -notin @(0xffff0200L,0xffff0300L,0xfffe0200L,0xfffe0300L)) { continue }
    $cursor=$offset+4
    while($cursor -le $bytes.Length-4) {
        $token=[BitConverter]::ToUInt32($bytes,$cursor)
        $opcode=$token -band 0xffff
        if($opcode -eq 0xffff) { $cursor+=4; break }
        if($opcode -eq 0xfffe) { $length=($token -shr 16) -band 0x7fff } else { $length=($token -shr 24) -band 15 }
        $cursor+=4*(1+$length)
    }
    if($cursor -gt $bytes.Length) { continue }
    $slice=New-Object byte[] ($cursor-$offset)
    [Array]::Copy($bytes,$offset,$slice,0,$slice.Length)
    $assembly=[ShaderInspection]::Disassemble($slice)
    if($assembly -and -not $assembly.Contains('???')) { $sections.Add("// Shader at byte $offset`r`n$assembly") }
}
$output=Join-Path (Split-Path -Parent $EffectPath) 'ObjectsGDI.runtime.asm.txt'
[IO.File]::WriteAllText($output,($sections -join "`r`n`r`n"))
Write-Host "[OK] Disassembled $($sections.Count) embedded shaders to $output"
