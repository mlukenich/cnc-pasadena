Add-Type -AssemblyName System.Drawing
$workspaceDir = Split-Path -Parent $PSScriptRoot
$destDir = Join-Path $workspaceDir 'src\Art\PJ'
$portDir = Join-Path $destDir 'Portrait'
$texDir = Join-Path $destDir 'Textures'
New-Item -ItemType Directory -Force -Path $portDir, $texDir | Out-Null

$srcPortrait = 'C:\Users\mluke\.gemini\antigravity\brain\18a32035-b66c-469f-b355-41c89e023dfb\pasadena_mammoth_portrait_1788215606998.jpg'
$srcAtlas = 'C:\Users\mluke\.gemini\antigravity\brain\18a32035-b66c-469f-b355-41c89e023dfb\pasadena_mammoth_atlas_1788215619893.jpg'

Copy-Item $srcPortrait (Join-Path $portDir 'PasadenaMammoth_portrait.png') -Force
Copy-Item $srcAtlas (Join-Path $texDir 'mammoth-panels-v1.png') -Force

function Convert-ToTga32([string]$srcImg, [string]$dstTga, [int]$w, [int]$h) {
    $src = [System.Drawing.Image]::FromFile($srcImg)
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, $w, $h)
    $g.Dispose()
    $src.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bw = New-Object System.IO.BinaryWriter($ms)
    $bw.Write([byte]0) # id length
    $bw.Write([byte]0) # color map type
    $bw.Write([byte]2) # uncompressed true-color
    $bw.Write([uint16]0) # colormap origin
    $bw.Write([uint16]0) # colormap length
    $bw.Write([byte]0) # colormap depth
    $bw.Write([uint16]0) # x-origin
    $bw.Write([uint16]0) # y-origin
    $bw.Write([uint16]$w) # width
    $bw.Write([uint16]$h) # height
    $bw.Write([byte]32) # bits per pixel
    $bw.Write([byte]8) # descriptor (8-bit alpha, bottom-to-top)

    for ($y = $h - 1; $y -ge 0; $y--) {
        for ($x = 0; $x -lt $w; $x++) {
            $c = $bmp.GetPixel($x, $y)
            $bw.Write([byte]$c.B)
            $bw.Write([byte]$c.G)
            $bw.Write([byte]$c.R)
            $bw.Write([byte]$c.A)
        }
    }
    $bmp.Dispose()
    [System.IO.File]::WriteAllBytes($dstTga, $ms.ToArray())
    $bw.Dispose()
    $ms.Dispose()
}

Convert-ToTga32 (Join-Path $portDir 'PasadenaMammoth_portrait.png') (Join-Path $destDir 'PJMammothPortrait.tga') 128 128
Convert-ToTga32 (Join-Path $texDir 'mammoth-panels-v1.png') (Join-Path $texDir 'mammoth-panels-v1.tga') 1024 1024
Write-Host '[OK] Generated PJMammothPortrait.tga (128x128) and mammoth-panels-v1.tga (1024x1024)'
