param (
  [string]$BrainDir = "C:\Users\mluke\.gemini\antigravity\brain\18a32035-b66c-469f-b355-41c89e023dfb"
)

Add-Type -AssemblyName System.Drawing

$csDir = "c:\Users\mluke\antigravity-workspace\cnc-pasadena\src\Art\CS"
$portraitDir = Join-Path $csDir "Portrait"
$textureDir = Join-Path $csDir "Textures"

if (-not (Test-Path $csDir)) { New-Item -ItemType Directory -Path $csDir -Force }
if (-not (Test-Path $portraitDir)) { New-Item -ItemType Directory -Path $portraitDir -Force }
if (-not (Test-Path $textureDir)) { New-Item -ItemType Directory -Path $textureDir -Force }

function Convert-ToTga32([System.Drawing.Bitmap]$bmp, [string]$outPath, [int]$w, [int]$h) {
  $resized = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($resized)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($bmp, 0, 0, $w, $h)
  $g.Dispose()

  $header = New-Object byte[] 18
  $header[2] = 2 # uncompressed true-color
  $header[12] = [byte]($w -band 0xFF)
  $header[13] = [byte](($w -shr 8) -band 0xFF)
  $header[14] = [byte]($h -band 0xFF)
  $header[15] = [byte](($h -shr 8) -band 0xFF)
  $header[16] = 32 # 32 bpp
  $header[17] = 0x28 # top-origin, 8-bit alpha

  $bytes = New-Object byte[] ($w * $h * 4)
  $idx = 0
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $pixel = $resized.GetPixel($x, $y)
      $bytes[$idx] = $pixel.B
      $bytes[$idx + 1] = $pixel.G
      $bytes[$idx + 2] = $pixel.R
      $bytes[$idx + 3] = 255 # full opaque alpha
      $idx += 4
    }
  }

  $fs = [System.IO.File]::Create($outPath)
  $fs.Write($header, 0, 18)
  $fs.Write($bytes, 0, $bytes.Length)
  $fs.Close()
  $resized.Dispose()
  Write-Host "[OK] Wrote 32-bit TGA: $outPath ($w x $h)"
}

# 1. Convert Portrait
$portraitJpg = Join-Path $BrainDir "columbia_sweeper_portrait_1788121474350.jpg"
if (Test-Path $portraitJpg) {
  $bmp = [System.Drawing.Bitmap]::FromFile($portraitJpg)
  $pngPath = Join-Path $portraitDir "ColumbiaSweeper_portrait.png"
  $bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host "[OK] Wrote PNG: $pngPath"

  $tgaPath = Join-Path $csDir "CSSweeperPortrait.tga"
  Convert-ToTga32 $bmp $tgaPath 128 128
  $bmp.Dispose()
} else {
  Write-Warning "Portrait JPG not found at $portraitJpg"
}

# 2. Convert Atlas
$atlasJpg = Join-Path $BrainDir "columbia_sweeper_atlas_1788121490218.jpg"
if (Test-Path $atlasJpg) {
  $bmp = [System.Drawing.Bitmap]::FromFile($atlasJpg)
  $pngPath = Join-Path $textureDir "sweeper-panels-v1.png"
  $bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host "[OK] Wrote PNG: $pngPath"

  $tgaPath = Join-Path $textureDir "sweeper-panels-v1.tga"
  Convert-ToTga32 $bmp $tgaPath 1024 1024
  $bmp.Dispose()
} else {
  Write-Warning "Atlas JPG not found at $atlasJpg"
}
