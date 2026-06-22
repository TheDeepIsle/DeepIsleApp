# ── Deep Isle App Release Script ──────────────────────────────────────────────
$GH_TOKEN = "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"
$env:GH_TOKEN = $GH_TOKEN
$env:GYP_MSVS_VERSION = "2017"

# Read current version from package.json
$pkg = Get-Content "C:\DeepIsleApp\package.json" | ConvertFrom-Json
$current = $pkg.version
$parts = $current -split '\.'
$parts[2] = [int]$parts[2] + 1
$newVersion = $parts -join '.'

# Update package.json with new version
$pkg.version = $newVersion
$pkg | ConvertTo-Json -Depth 10 | Set-Content "C:\DeepIsleApp\package.json"

Write-Host "Bumped version: $current -> $newVersion" -ForegroundColor Cyan

# Git commit and tag
Set-Location "C:\DeepIsleApp"
git add .
git commit -m "v$newVersion"
git tag "v$newVersion"
git push origin master --tags

# Build and publish
npx electron-builder --publish always

Write-Host "Release v$newVersion complete!" -ForegroundColor Green