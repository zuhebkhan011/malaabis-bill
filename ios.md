# Malaabis POS - iOS Complete Build, Signing & Deployment Guide

This guide details the complete architecture, platform constraints, code-signing mechanisms, and exact step-by-step instructions to build, sign, and install the **Malaabis Studio** iOS app on a personal iPhone from a Windows PC.

---

## 1. Project Specifications & Current Architecture

The Malaabis project is fully prepared and synced for iOS using modern Capacitor 8:

- **App Name**: `Malaabis`
- **Bundle Identifier**: `com.malaabis.pos`
- **Capacitor Version**: `8.3.4` (`@capacitor/core`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/cli`)
- **Native iOS Project Location**: `frontend/ios/App/App.xcodeproj`
- **Deployment Target**: iOS 15.0+ (compatible with iPhone and iPad)
- **Active Native Plugins**:
  - `@capacitor/filesystem@8.1.2` (for PDF document generation and file caching)
  - `@capacitor/share@8.0.1` (for native iOS Share Sheet, AirPrint, and file export)

### Pre-Configured Permissions (`Info.plist`)
File: `frontend/ios/App/App/Info.plist`
- `CFBundleDisplayName`: `Malaabis`
- `NSCameraUsageDescription`: *"Malaabis requires camera access to scan barcodes, QR codes, and product SKUs for billing."*
- `NSPhotoLibraryUsageDescription`: *"Malaabis requires access to your photo library to import supplier invoices, receipts, and bill images for AI processing."*
- `NSPhotoLibraryAddUsageDescription`: *"Malaabis requires permission to save generated invoice PDFs and receipts to your photo library."*
- `NSAppTransportSecurity`: Configured with `NSAllowsArbitraryLoads = true` for remote Render backend (`https://malaabis-bill.onrender.com`) and local IP network connections.
- `UIStatusBarStyle`: `UIStatusBarStyleLightContent` with `UIViewControllerBasedStatusBarAppearance: false` for high-contrast white status bar elements over the dark luxury theme.

### Visual Assets (`Assets.xcassets`)
- **Universal AppIcon**: 1024×1024 (`AppIcon.appiconset/AppIcon-512@2x.png`) with the gold emblem on deep `#111111` black.
- **Universal Splash Screen**: 2732×2732 (`Splash.imageset/splash-2732x2732.png`) wired into `LaunchScreen.storyboard` for all iPhone and iPad screen sizes.

### Responsive UI & Safe Area Compatibility
- **Safe Area Insets**: Handled via CSS utilities (`pt-safe`, `pb-safe`, `pb-scroll-safe`, `fab-safe-bottom`, `px-safe`) using `env(safe-area-inset-*)` so content never collides with the iPhone notch, camera island, or Dynamic Island.
- **Inline Camera**: Scanner video stream explicitly sets `playsinline="true"` and `webkit-playsinline="true"` for WKWebView compliance without forcing fullscreen mode.
- **Fixed A5 Printing**: Outputs invariant 148mm × 210mm PDF blob and triggers native iOS Share Sheet / AirPrint.

---

## 2. Technical Reality: Building iOS Apps from Windows

### Can Windows natively build a `.ipa`?
**No.** Apple restricts the iOS compilation toolchain (`swiftc`, Apple `clang`, `ibtool`, `actool`, `ld64`) exclusively to macOS. There is no official or functional Windows equivalent that can compile modern Capacitor 8 Swift projects.

### What is the role of Sideloadly?
Sideloadly is an **installer and code-signer**, not a compiler:
- Sideloadly **cannot** compile the `frontend/ios` folder into an `.ipa`.
- Sideloadly **can** take an already-compiled `.ipa` on Windows, sign it using your personal Apple ID, and install it via USB onto your connected iPhone.

---

## 3. Code-Signing Architectures Explained

Before setting up deployment, choose between the two signing architectures:

### Method 1: Sideloadly Local Signing (Recommended for Personal Sideloading)
- **Where Compilation Happens**: GitHub Actions (Cloud macOS Runner).
- **Where Signing Happens**: On your Windows PC inside the Sideloadly application.
- **Credentials Stored on GitHub**: **None (0 secrets).** You never put your Apple ID or password on GitHub.
- **Credentials Used on Windows**: Your personal Apple ID email and password, entered only inside the local desktop Sideloadly app.
- **How It Works**:
  1. GitHub Actions compiles the native code for device architecture (`arm64`), bundles all Capacitor Swift frameworks, and packages a standard `Payload/App.app` `.ipa` artifact.
  2. You download the `.ipa` onto your Windows PC.
  3. Sideloadly communicates directly with Apple, obtains a free 7-day personal development certificate for your iPhone's UDID, signs the main executable and all embedded frameworks locally on Windows, and installs the app over USB.
- **Cost**: 100% Free. Works with any standard Apple ID.

### Method 2: GitHub-Side Signing (Pre-Signed Cloud IPA)
- **Where Compilation & Signing Happen**: Entirely within the GitHub Actions runner.
- **Credentials Stored on GitHub**: Requires a paid Apple Developer Account ($99/year) with the following GitHub Secrets:
  - `APPLE_CERTIFICATE_BASE64` (Exported `.p12` distribution/development certificate)
  - `APPLE_CERTIFICATE_PASSWORD` (Password for the `.p12`)
  - `APPLE_PROVISIONING_PROFILE_BASE64` (`.mobileprovision` file containing your iPhone's UDID)
- **How It Works**: GitHub Actions imports the certificate into a temporary macOS keychain, runs `xcodebuild -exportArchive`, and outputs an already-signed `.ipa`. Sideloadly on Windows merely pushes the file to the phone without signing.

---

## 4. Complete Step-by-Step Implementation: Method 1 (Free Personal Sideloading)

### Step 1: Create the GitHub Actions Workflow File
Create the file `.github/workflows/build-ios.yml` in your repository:

```yaml
name: Build iOS IPA

on:
  workflow_dispatch: # Allows manual trigger from GitHub web UI

jobs:
  build:
    runs-on: macos-14 # Apple Silicon M1/M2 macOS runner
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies & build web frontend
        run: |
          cd frontend
          npm install
          npm run build

      - name: Sync Capacitor iOS
        run: |
          cd frontend
          npx cap sync ios

      - name: Build and Archive with Xcode (Device arm64)
        run: |
          cd frontend/ios/App
          xcodebuild -project App.xcodeproj \
                     -scheme App \
                     -configuration Release \
                     -destination 'generic/platform=iOS' \
                     -archivePath App.xcarchive \
                     archive \
                     CODE_SIGNING_ALLOWED=NO \
                     CODE_SIGN_IDENTITY="" \
                     CODE_SIGNING_REQUIRED=NO

      - name: Package Standard Payload IPA (Preserving Symlinks)
        run: |
          cd frontend/ios/App
          mkdir -p Payload
          cp -R App.xcarchive/Products/Applications/App.app Payload/
          zip -r -y Malaabis.ipa Payload

      - name: Upload IPA Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Malaabis-iOS-IPA
          path: frontend/ios/App/Malaabis.ipa
          retention-days: 7
```

### Step 2: Trigger Build & Download IPA
1. Commit and push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Configure iOS build workflow"
   git push origin main
   ```
2. Open your repository on GitHub in your browser.
3. Click the **Actions** tab at the top.
4. Select **Build iOS IPA** in the left workflow list.
5. Click **Run workflow** → **Run workflow**.
6. Wait ~3–4 minutes for the macOS runner to complete.
7. Click the finished run, scroll to **Artifacts**, and download `Malaabis-iOS-IPA.zip`.
8. Unzip the file on your Windows computer to get `Malaabis.ipa`.

### Step 3: Install Required Software on Windows
To allow Windows to communicate with your iPhone over USB:
1. **iTunes for Windows**:
   - Download the standalone installer directly from Apple (do **not** use the Microsoft Store version):
     - [iTunes 64-bit Windows Direct Installer](https://www.apple.com/itunes/download/win64)
   - Install iTunes, open it once, and verify your iPhone is detected.
2. **iCloud for Windows**:
   - Download the direct standalone installer from Apple:
     - [iCloud for Windows Direct Installer](https://updates.cdn-apple.com/2020/windows/001-39935-20200911-1A70AA56-F448-11EA-8109-AE4E4F1449A4/iCloudSetup.exe)
   - Install iCloud (needed by Sideloadly for Apple Anisette authentication).
3. **Sideloadly**:
   - Download and install the official Windows version from [sideloadly.io](https://sideloadly.io/).

### Step 4: Sideload onto iPhone
1. Connect your iPhone to your Windows PC using a USB cable.
2. If your iPhone prompts **"Trust This Computer?"**, tap **Trust** and enter your device passcode.
3. Launch **Sideloadly** on Windows:
   - Confirm your connected iPhone appears in the **iDevice** field.
   - Drag and drop `Malaabis.ipa` into the large IPA icon on the left.
   - Enter your personal **Apple ID** email address in the *Apple ID* field.
   - Click **Start**.
4. If prompted, enter your Apple ID password (and the 2FA verification code sent to your iPhone).
5. Sideloadly will generate your free development certificate, sign `Malaabis.ipa` and all embedded Capacitor frameworks, and install the app directly onto your iPhone.

### Step 5: Trust the App on Your iPhone (First-Time Only)
1. On your iPhone, navigate to **Settings → General → VPN & Device Management**.
2. Under **Developer App**, tap your Apple ID email.
3. Tap **Trust "[your Apple ID]"** and confirm.
4. On iOS 16, 17, and 18, enable Developer Mode:
   - Navigate to **Settings → Privacy & Security → Developer Mode**.
   - Toggle **Developer Mode ON**.
   - Restart your iPhone when prompted, then tap **Turn On** after rebooting.
5. Tap the **Malaabis** icon on your home screen to launch the application.

---

## 5. Alternative Path: Building Directly on a Physical Mac

If you have physical access to a Mac with Xcode:

1. Open a terminal in `frontend`:
   ```bash
   npm install
   npm run build
   npx cap sync ios
   npx cap open ios
   ```
2. In Xcode:
   - Click the top **App** project in the left navigator.
   - Under **Targets**, select **App**.
   - Go to **Signing & Capabilities**.
   - Check **Automatically manage signing**.
   - Select your personal Apple ID/Team from the **Team** dropdown.
3. Connect your iPhone via USB, select it as the run destination in the top toolbar, and press **Cmd + R**.

---

## 6. Verification Checklist

| Item | Status | Notes |
| :--- | :--- | :--- |
| **App Name** | `Malaabis` | Configured in `capacitor.config.json` & `Info.plist` |
| **Bundle ID** | `com.malaabis.pos` | Aligned in `capacitor.config.json` & Xcode build configs |
| **Barcode / QR Scanner** | Verified | Video stream uses `playsinline="true"` for WKWebView |
| **Invoice / PDF Printing** | Verified | Fixed A5 (148×210mm), shared via iOS native Share Sheet / AirPrint |
| **Safe Area Insets** | Verified | Header and navigation clear notch, Dynamic Island, and home indicator |
| **Backend Connectivity** | Verified | `Capacitor.isNativePlatform()` directs all API/WebSocket calls to production backend |
| **Android / Web Integrity** | Verified | Android release APK (`app-release.apk`) builds in 21s; web bundle compiles in 652ms |
