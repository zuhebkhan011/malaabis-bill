# build-apk.ps1
# Malaabis Studio - Safe Android APK Builder
# Fixes OneDrive ReparsePoint placeholder issue before every Gradle build

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Malaabis Studio APK Builder" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$ROOT = $PSScriptRoot
$FRONTEND = "$ROOT\frontend"
$ANDROID = "$FRONTEND\android"
$DIST = "$FRONTEND\dist"
$ASSETS_PUBLIC = "$ANDROID\app\src\main\assets\public"

# Step 1: Build React app
Write-Host "`n[1/4] Building React app..." -ForegroundColor Yellow
Set-Location $FRONTEND
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "React build FAILED" -ForegroundColor Red; exit 1 }
Write-Host "React build OK" -ForegroundColor Green

# Step 2: Kill any Gradle daemons to avoid file locks
Write-Host "`n[2/4] Stopping Gradle daemons..." -ForegroundColor Yellow
Set-Location $ANDROID
.\gradlew.bat --stop 2>&1 | Out-Null
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "Daemons stopped." -ForegroundColor Green

# Step 3: Replace OneDrive placeholders with real file copies
Write-Host "`n[3/4] Refreshing Android assets (bypassing OneDrive placeholders)..." -ForegroundColor Yellow
if (Test-Path $ASSETS_PUBLIC) {
    Remove-Item $ASSETS_PUBLIC -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}
New-Item -ItemType Directory -Path $ASSETS_PUBLIC -Force | Out-Null
Copy-Item -Path "$DIST\*" -Destination $ASSETS_PUBLIC -Recurse -Force

# Verify no ReparsePoints remain
$files = Get-ChildItem $ASSETS_PUBLIC -Recurse -File
$reparse = @($files | Where-Object { $_.Attributes -band [System.IO.FileAttributes]::ReparsePoint })
Write-Host "Files copied: $($files.Count) | OneDrive placeholders: $($reparse.Count)" -ForegroundColor $(if ($reparse.Count -eq 0) { "Green" } else { "Red" })
if ($reparse.Count -gt 0) {
    Write-Host "WARNING: ReparsePoints still present - build may fail" -ForegroundColor Red
}

# Also clean capacitor-cordova-android-plugins build dir (another OneDrive victim)
$pluginBuild = "$ANDROID\capacitor-cordova-android-plugins\build"
if (Test-Path $pluginBuild) {
    Remove-Item $pluginBuild -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Cleaned plugin build cache." -ForegroundColor Green
}

# Clean app\build stale incremental cache if present
$appBuild = "$ANDROID\app\build"
if (Test-Path $appBuild) {
    Remove-Item "$appBuild\intermediates" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Cleaned app intermediate cache." -ForegroundColor Green
}

# Step 4: Build APK
Write-Host "`n[4/4] Building Android APK..." -ForegroundColor Yellow
Set-Location $ANDROID
.\gradlew.bat assembleDebug --no-daemon 2>&1

if ($LASTEXITCODE -eq 0) {
    $apkPath = "$ANDROID\app\build\outputs\apk\debug\app-debug.apk"
    $apkSize = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
    Write-Host "`n======================================" -ForegroundColor Green
    Write-Host "  BUILD SUCCESSFUL! ($apkSize MB)" -ForegroundColor Green
    Write-Host "  APK: $apkPath" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
} else {
    Write-Host "`nBUILD FAILED!" -ForegroundColor Red
    exit 1
}
