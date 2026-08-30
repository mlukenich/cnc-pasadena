param(
    [string]$SourceJpg,
    [string]$TargetTga,
    [int]$TargetWidth = 1024,
    [int]$TargetHeight = 1024,
    [string]$SavePng
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function Convert-JpgToTga([string]$JpgPath, [string]$TgaPath, [int]$Width, [int]$Height) {
    $img = [System.Drawing.Bitmap]::FromFile($JpgPath)
    $resized = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($img, 0, 0, $Width, $Height)
    $g.Dispose()
    $img.Dispose()

    # Write 32-bit uncompressed top-origin TGA
    $header = New-Object byte[] 18
    $header[2] = 2 # uncompressed true-color
    [BitConverter]::GetBytes([uint16]$Width).CopyTo($header, 12)
    [BitConverter]::GetBytes([uint16]$Height).CopyTo($header, 14)
    $header[16] = 32 # 32 bpp
    $header[17] = 0x28 # top-left origin, 8-bit alpha

    $rect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
    $bmpData = $resized.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bytes = New-Object byte[] ($Width * $Height * 4)
    [System.Runtime.InteropServices.Marshal]::Copy($bmpData.Scan0, $bytes, 0, $bytes.Length)
    $resized.UnlockBits($bmpData)
    $resized.Dispose()

    $fs = [System.IO.File]::Create($TgaPath)
    $fs.Write($header, 0, 18)
    $fs.Write($bytes, 0, $bytes.Length)
    $fs.Dispose()

    Write-Host "[OK] Converted $JpgPath to $TgaPath ($($Width)x$($Height))"
}

function Convert-JpgToPng([string]$JpgPath, [string]$PngPath) {
    $img = [System.Drawing.Bitmap]::FromFile($JpgPath)
    $img.Save($PngPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    Write-Host "[OK] Converted $JpgPath to $PngPath"
}

if ($SourceJpg -and $TargetTga) {
    Convert-JpgToTga $SourceJpg $TargetTga $TargetWidth $TargetHeight
    if ($SavePng) {
        Convert-JpgToPng $SourceJpg $SavePng
    }
}
