param()
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot

function Convert-JpgToTga([string]$JpgPath, [string]$TgaPath, [int]$TargetWidth, [int]$TargetHeight) {
    $img = [System.Drawing.Bitmap]::FromFile($JpgPath)
    $resized = New-Object System.Drawing.Bitmap($TargetWidth, $TargetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($img, 0, 0, $TargetWidth, $TargetHeight)
    $g.Dispose()
    $img.Dispose()

    # Write 32-bit uncompressed top-origin TGA
    $header = New-Object byte[] 18
    $header[2] = 2 # uncompressed true-color
    [BitConverter]::GetBytes([uint16]$TargetWidth).CopyTo($header, 12)
    [BitConverter]::GetBytes([uint16]$TargetHeight).CopyTo($header, 14)
    $header[16] = 32 # 32 bpp
    $header[17] = 0x28 # top-left origin, 8-bit alpha

    $rect = New-Object System.Drawing.Rectangle(0, 0, $TargetWidth, $TargetHeight)
    $bmpData = $resized.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bytes = New-Object byte[] ($TargetWidth * $TargetHeight * 4)
    [System.Runtime.InteropServices.Marshal]::Copy($bmpData.Scan0, $bytes, 0, $bytes.Length)
    $resized.UnlockBits($bmpData)
    $resized.Dispose()

    # System.Drawing Format32bppArgb stores BGRA in memory, exactly what C&C3 top-origin TGA expects!
    $fs = [System.IO.File]::Create($TgaPath)
    $fs.Write($header, 0, 18)
    $fs.Write($bytes, 0, $bytes.Length)
    $fs.Dispose()

    Write-Host "[OK] Converted $JpgPath to $TgaPath ($($TargetWidth)x$($TargetHeight))"
}

function Convert-JpgToPng([string]$JpgPath, [string]$PngPath) {
    $img = [System.Drawing.Bitmap]::FromFile($JpgPath)
    $img.Save($PngPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    Write-Host "[OK] Converted $JpgPath to $PngPath"
}

# 1. Convert Portrait to 128x128 TGA and PNG
Convert-JpgToTga (Join-Path $root 'src\Art\CV\Portrait\ColumbiaPrius_portrait.jpg') (Join-Path $root 'src\Art\CV\CVPriusPortrait.tga') 128 128
Convert-JpgToPng (Join-Path $root 'src\Art\CV\Portrait\ColumbiaPrius_portrait.jpg') (Join-Path $root 'src\Art\CV\Portrait\ColumbiaPrius_portrait.png')

# 2. Convert Texture Atlas to 1024x1024 TGA and PNG
Convert-JpgToTga (Join-Path $root 'src\Art\CV\Textures\prius-panels-v1.jpg') (Join-Path $root 'src\Art\CV\Textures\prius-panels-v1.tga') 1024 1024
Convert-JpgToPng (Join-Path $root 'src\Art\CV\Textures\prius-panels-v1.jpg') (Join-Path $root 'src\Art\CV\Textures\prius-panels-v1.png')
