$ErrorActionPreference = "Stop"

$mobileRoot = Split-Path -Parent $PSScriptRoot
$repositoryRoot = Split-Path -Parent $mobileRoot
$sourceRoot = Join-Path $repositoryRoot "assets"
$publicRoot = Join-Path $mobileRoot "public\assets"

foreach ($directory in @("icons", "illustrations")) {
    $source = Join-Path $sourceRoot $directory
    $destination = Join-Path $publicRoot $directory
    New-Item -ItemType Directory -Force -Path $destination | Out-Null
    Copy-Item -Path (Join-Path $source "*") -Destination $destination -Recurse -Force
}

Write-Host "Assets synced from $sourceRoot to $publicRoot"
