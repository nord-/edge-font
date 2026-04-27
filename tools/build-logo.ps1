# Build the Edge Add-ons store logo (300x300 PNG).
#
# Design: white "Aa" centered on a blue squircle.
#   - "A" in Georgia Bold (serif)   — represents the source font
#   - "a" in Segoe UI Bold (sans)   — represents the override
# Background color matches popup.css accent-color (#0067c0).

[CmdletBinding()]
param(
  [int]$Size = 300,
  [string]$OutPath = "assets/edge-font-logo-300.png"
)

Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

# Background squircle.
$radius = [int]($Size * 0.20)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc(0, 0, $radius, $radius, 180, 90)
$path.AddArc($Size - $radius, 0, $radius, $radius, 270, 90)
$path.AddArc($Size - $radius, $Size - $radius, $radius, $radius, 0, 90)
$path.AddArc(0, $Size - $radius, $radius, $radius, 90, 90)
$path.CloseFigure()

$bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 103, 192))
$g.FillPath($bg, $path)

# Foreground: "Aa" centered, two fonts.
$emSize = [single]($Size * 0.55)
$aFont = [System.Drawing.Font]::new("Georgia",  [single]$emSize, [System.Drawing.FontStyle]::Bold)
$bFont = [System.Drawing.Font]::new("Segoe UI", [single]$emSize, [System.Drawing.FontStyle]::Bold)

$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment     = [System.Drawing.StringAlignment]::Near
$fmt.LineAlignment = [System.Drawing.StringAlignment]::Near
$fmt.FormatFlags   = [System.Drawing.StringFormatFlags]::NoClip

$aSize = $g.MeasureString("A", $aFont, [int]::MaxValue, $fmt)
$bSize = $g.MeasureString("a", $bFont, [int]::MaxValue, $fmt)

# Trim default GDI+ horizontal padding so glyphs sit closer.
$pad = $emSize * 0.10
$totalW = ($aSize.Width - $pad) + ($bSize.Width - $pad)
$startX = ($Size - $totalW) / 2 - $pad / 2
$y      = ($Size - $aSize.Height) / 2

$white = [System.Drawing.Brushes]::White
$g.DrawString("A", $aFont, $white, $startX, $y, $fmt)
$g.DrawString("a", $bFont, $white, $startX + $aSize.Width - $pad, $y, $fmt)

# Save.
$dir = Split-Path -Parent $OutPath
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
$bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose(); $bmp.Dispose(); $bg.Dispose(); $aFont.Dispose(); $bFont.Dispose(); $path.Dispose()

Write-Host "Wrote $OutPath ($Size x $Size)"
