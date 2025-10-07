param(
  [string]$OutputDir = 'assets/photos'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir | Out-Null }

function Save-IfMissing {
  param([string]$Url, [string]$Path)
  if (Test-Path $Path) { return $true }
  try {
    Invoke-WebRequest -Uri $Url -OutFile $Path -UseBasicParsing -Headers @{ 'User-Agent'='Mozilla/5.0' } -TimeoutSec 30
    return (Test-Path $Path) -and ((Get-Item $Path).Length -gt 1024)
  } catch { return $false }
}

# Collect ASINs from local data (if present) and add known ones
$asins = New-Object System.Collections.Generic.HashSet[string]
if (Test-Path 'assets/data/books.json') {
  try {
    (Get-Content 'assets/data/books.json' -Raw | ConvertFrom-Json) | ForEach-Object { if ($_.asin) { [void]$asins.Add([string]$_.asin) } }
  } catch {}
}
'2487852208','2487852461','2387260139','238587136X','2385871270','2385870576','2385870924','2385870657','2385870274','2493997301' | ForEach-Object { [void]$asins.Add($_) }

Write-Host ("Found {0} ASIN(s)" -f $asins.Count)

# Optional explicit Google IDs for some titles
$gmap = @{ '2487852208'='LlczEQAAQBAJ'; '2487852461'='7Z1DEQAAQBAJ' }

foreach ($asin in $asins) {
  $target = Join-Path $OutputDir ("{0}.jpg" -f $asin)
  if (Test-Path $target -and (Get-Item $target).Length -gt 1024) { Write-Host ("✔ {0} (cached)" -f $asin); continue }

  $ok = $false

  # 1) Google Books by known id
  if ($gmap.ContainsKey($asin)) {
    $gid = $gmap[$asin]
    $ok = Save-IfMissing ("https://books.google.com/books/content?id={0}&printsec=frontcover&img=1&zoom=3" -f $gid) $target
    if ($ok) { Write-Host ("✔ {0} (google id)" -f $asin); continue }
  }

  # 2) Google Books by ISBN
  try {
    $res = Invoke-WebRequest -Uri ("https://www.googleapis.com/books/v1/volumes?q=isbn:{0}" -f $asin) -UseBasicParsing -TimeoutSec 20
    $gid = ($res.Content | ConvertFrom-Json).items[0].id
    if ($gid) {
      $ok = Save-IfMissing ("https://books.google.com/books/content?id={0}&printsec=frontcover&img=1&zoom=3" -f $gid) $target
      if ($ok) { Write-Host ("✔ {0} (google isbn)" -f $asin); continue }
    }
  } catch {}

  # 3) OpenLibrary by ISBN (certaines références n’y sont pas)
  if ($asin -match '^(\d{10,13}|\d{9}[\dxX])$') {
    $ok = Save-IfMissing ("https://covers.openlibrary.org/b/isbn/{0}-L.jpg" -f $asin) $target
    if ($ok) { Write-Host ("✔ {0} (openlibrary)" -f $asin); continue }
  }

  Write-Warning ("✖ Failed to fetch cover for {0}" -f $asin)
}

Write-Host ("Done. Covers saved to {0}" -f $OutputDir)
