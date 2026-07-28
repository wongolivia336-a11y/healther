param(
    [string]$AndroidDevRoot = "E:\AndroidDev",
    [string]$OutputName = "Healther-v0.1.0-debug.apk"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$androidRoot = Join-Path $projectRoot "android"
$jdkHome = Get-ChildItem (Join-Path $AndroidDevRoot "jdk") -Directory |
    Select-Object -First 1 -ExpandProperty FullName
$sdkRoot = Join-Path $AndroidDevRoot "sdk"
$outputRoot = Join-Path $AndroidDevRoot "output"

if (-not $jdkHome) {
    throw "JDK not found under $AndroidDevRoot\jdk"
}
if (-not (Test-Path (Join-Path $sdkRoot "platforms\android-36"))) {
    throw "Android SDK Platform 36 not found under $sdkRoot"
}

$env:JAVA_HOME = $jdkHome
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:GRADLE_USER_HOME = Join-Path $AndroidDevRoot "gradle-cache"
$env:npm_config_cache = Join-Path $AndroidDevRoot "npm-cache"
$env:TEMP = Join-Path $AndroidDevRoot "temp"
$env:TMP = $env:TEMP

New-Item -ItemType Directory -Force -Path $outputRoot, $env:GRADLE_USER_HOME, $env:npm_config_cache, $env:TEMP | Out-Null

Push-Location $projectRoot
try {
    & (Join-Path $PSScriptRoot "sync-assets.ps1")

    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw "Web build failed." }

    npx.cmd cap sync android
    if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed." }

    Push-Location $androidRoot
    try {
        .\gradlew.bat assembleDebug --no-daemon --console=plain
        if ($LASTEXITCODE -ne 0) { throw "Android build failed." }
    }
    finally {
        Pop-Location
    }

    $sourceApk = Join-Path $androidRoot "app\build\outputs\apk\debug\app-debug.apk"
    $outputApk = Join-Path $outputRoot $OutputName
    Copy-Item -LiteralPath $sourceApk -Destination $outputApk -Force
    $hash = Get-FileHash -Algorithm SHA256 $outputApk

    Write-Host "APK: $outputApk"
    Write-Host "SHA256: $($hash.Hash)"
}
finally {
    Pop-Location
}
