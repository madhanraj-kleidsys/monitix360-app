# 🚀 Monitix-360: Mobile App for Task Management

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [EAS Cloud Build](#️-eas-cloud-build-recommended)
- [Local Android APK Build](#-local-android-apk-build)
- [Installation & Testing](#-installation--testing)
- [Troubleshooting](#-troubleshooting)
- [Pro Tips](#-pro-tips)
- [Documentation](#-documentation)

---

## 📝 Project Overview

**Monitix-360** is a task management and monitoring application built with cutting-edge React Native and Expo technologies.

### For Local Android Build

- **Android Studio**: Latest version
- **JDK 17**: Java Development Kit
- **Android SDK**: API 33+ (installed via Android Studio)
- **ANDROID_HOME**: Environment variable configured

### For iOS Build

- **macOS**: Required for local builds (optional)
- **Apple Developer Account**: $99/year for App Store release

---

## ⚡ Quick Start
## ☁️ EAS Cloud Build (Recommended , Easy to Build & For Downading APK)

### 🌟 Why Use EAS Build?

- ✅ Works on Windows, Mac, and Linux
- ✅ Automatic signing and certificates
- ✅ Free for Android APKs (30 builds/month free tier)
- ✅ One-click installation with Expo Orbit
- ✅ No complex local setup needed

### Step 1: Install EAS CLI

```bash
# Using pnpm
pnpm add -g eas-cli

# Or using npm
npm install -g eas-cli
```

### Step 2: Login to Expo Account

```bash
eas login
```

If you don't have an account, create one at [expo.dev/signup](https://expo.dev/signup)

### Step 3: Configure EAS

```bash
eas build:configure
```

This creates `eas.json` with default build profiles.

### Step 4: Update eas.json for APK

Edit `eas.json` to ensure Android builds APK format:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Step 5: Build Android APK

#### For Testing/Preview:

```bash
eas build --platform android --profile preview
```

- Faster build (~10 - 15 mins)
- Good for internal testing
- Download via Expo Website dashboard / using the Link shown in terminal / by scanning the QRcode shown in terminal

#### For Production/Play Store:

```bash
eas build --platform android --profile production
```

- Optimized size
- Proper signing
- Ready for Play Store submission

### Step 6: Build iOS IPA (Mac Required)

⚠️ **Requires Apple Developer Account ($99/year)**

```bash
# For simulator testing
eas build --platform ios --profile preview --simulator

# For App Store release
eas build --platform ios --profile production
```

### Step 7: Download Your Build

#### Method 1: Using Expo Orbit (Recommended)

1. Wait for build to complete
2. Click "Open with Expo Orbit" from the link
3. Expo Orbit automatically downloads & installs

#### Method 2: Manual Download

1. Visit [expo.dev](https://expo.dev)
2. Navigate to Your Project → Builds
3. Click Install button / download link for your build
4. Transfer APK/IPA to device

---

## 🏭 Local Android APK Build

### 🎯 Why Local Build?

- ✅ Unlimited builds (no monthly limits)
- ✅ Faster for rapid iteration
- ✅ Works offline
- ✅ Full control over build process

### Prerequisites Setup

#### Step 1: Install Android Studio

Download from: [developer.android.com/studio](https://developer.android.com/studio)

Open Android Studio once to allow initial setup to complete.

#### Step 2: Install JDK 17

**On Windows (using Chocolatey):**

```powershell
# If Chocolatey not installed, run this first:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install JDK 17
choco install microsoft-openjdk17
```

**On Mac:**

```bash
brew install openjdk@17
```

**On Linux:**

```bash
sudo apt install openjdk-17-jdk
```

#### Step 3: Set ANDROID_HOME Environment Variable

**On Windows (GUI Method):**

1. Press `Windows Key` → Type "Environment Variables"
2. Click "Edit the system environment variables"
3. Click "Environment Variables" button
4. Click "New" under User variables
5. Set:
   - **Variable name**: `ANDROID_HOME`
   - **Variable value**: `C:\Users\YourUsername\AppData\Local\Android\Sdk`

6. Find `Path` variable → Click "Edit"
7. Add these three new entries:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\emulator
   ```

**On Windows (PowerShell):**

```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\YourUsername\AppData\Local\Android\Sdk", "User")
```

**On Mac/Linux:**

```bash
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
source ~/.zshrc
```

#### Step 4: Verify Setup

Open a **new terminal/PowerShell** and run:

```bash
java -version
echo $ANDROID_HOME  # On Mac/Linux: echo $ANDROID_HOME
adb version
```

All three should display version information without errors. ✅

### Build Process

#### Step 1: Generate Native Android Files

```bash
cd C:\taskapp\client  # navigate to the Project Dir

# Generate android directory with native code
npx expo prebuild --platform android
```

Expected output:
```
✔ Created native directories
✔ Updated native project configuration
✔ Prebuild successful
```

#### Step 2: Build APK

**Method 1: Using Expo CLI (Recommended)**

```bash
# Build release APK
npx expo run:android --variant release

# Option B: Using EAS locally
eas build -p android --local

eas build -p android --output=app.apk
```

**Method 2: Using Gradle Directly**

```bash
cd android

# Windows
.\gradlew assembleRelease

# Mac/Linux
./gradlew assembleRelease
```

**Build time**: 
- This build Might Take a while based on ur system Configurations (~20 - 30 mins) || 5-15 minutes (first build slower)

#### Step 3: Find Your APK

After successful build, locate your APK at:

```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 📱 Installation & Testing

### Install via USB (Easiest)

1. **Connect Android phone to computer** via USB cable
2. **Enable USB Debugging** on phone:
   - Settings → Developer Options → USB Debugging
3. **Copy `app-release.apk`** to phone
4. **Tap file** to install
5. Allow "Install from unknown sources" if prompted
6. **Launch app** from home screen

### Install via ADB (Command Line)

```bash
# Verify phone is connected
adb devices

# Install APK
adb install android/app/build/outputs/apk/release/app-release.apk

# App installs automatically
```

### Test on Android Emulator

```bash
# Start emulator first
emulator -avd YourEmulatorName

# Then run
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔧 Troubleshooting

### ❌ "ANDROID_HOME not set"

**Solution:** Restart terminal/PowerShell after setting environment variable

```bash
# Close and reopen terminal, then verify
echo $ANDROID_HOME
adb version
```

### ❌ "adb not found"

**Solution:** Add Android SDK Platform Tools to PATH

```bash
# Verify Android SDK location in Android Studio
# Settings → System Settings → Android SDK → Copy Location
# Add to PATH: %ANDROID_HOME%\platform-tools
```

### ❌ Build fails with "No matching variant"

**Cause:** pnpm node_modules structure incompatibility with native modules

**Solution:** Use npm instead

```bash
# Delete current modules
Remove-Item -Recurse -Force node_modules    # Windows
rm -rf node_modules                          # Mac/Linux

# Install with npm
npm install

# Rebuild
npx expo prebuild --platform android
npx expo run:android --variant release
```

### ⚠️ : ❌🚩 "Path too long" CMake error ⚡❗❌

**Cause:** Windows has 255-character path limit for native files

**Solution:** Move project to shorter path

```bash
# From: C:\folder\taskapp\client
# To:   C:\taskapp  or  C:\taskapp\client
```

# 🛠 Enabling Long Paths (Windows 10/11)

```bash 
Some builds with deep dependencies (React Native + pnpm) may exceed Windows' default MAX_PATH (260 characters) causing build errors.
Enabling long paths support is recommended for robust developer experience!
```

## To enable long file paths:

### Method 1: Group Policy Editor (Windows Pro)

Press ```bash Windows Key ``` , type ```bash Edit group policy ```, and open.

2. Go to:
```bash 
Computer Configuration → Administrative Templates → System → Filesystem
```

3. Double-click Enable Win32 long paths.

4. Set to Enabled.

5. Click Apply and OK.

### Method 2: Registry Editor (All Windows Editions)

1. Press ```bash Windows Key ``` , type ```bash regedit ```, and open Registry Editor.

2. Navigate to:

```bash
text
HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem
```

3. Find or create a DWORD entry called LongPathsEnabled:

Double-click if it exists, or right-click → New → DWORD (32-bit) Value.

Set its value to ```bash 1 ```.

4. Click OK and exit Registry Editor.


### Or run this PowerShell command as administrator:
 
```bash

powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

```

## Final Step
### 🔄 Restart your PC for changes to take effect.

```bash
With long paths enabled, most build tools and large projects can safely use folder structures over 260 characters.
Note: Some tools (like CMake) may still have their own limits.
```


### ❌ Gradle build fails after 100 retries

**Solution:** Clean gradle cache

```bash
cd android
.\gradlew clean      # Windows
./gradlew clean      # Mac/Linux
cd ..

npx expo run:android --variant release
```

### ❌ Metro Bundler cache issues

**Solution:** Clear Metro cache

```bash
npx expo start --clear    # Or
npx expo start --reset-cache
```

---

## 💡 Pro Tips

### 🎯 Faster Builds

1. **Use Preview Profile** for testing:
   ```bash
   eas build --platform android --profile preview
   ```
   Faster than production builds.

2. **Enable Gradle cache** in `eas.json`:
   ```json
   {
     "build": {
       "preview": {
         "cache": {
           "key": "preview",
           "paths": ["node_modules"]
         }
       }
     }
   }
   ```

### 🔗 Limit Package Manager Issues

- **For releases**: Use `npm install` (most compatible with native modules)
- **For development**: Use `pnpm` (faster, smaller disk usage)

### 📁 .gitignore Best Practices

Always add to `.gitignore`:

```
# Expo
.expo/
.expo-shared/
dist/

# Node
node_modules/
*.log
pnpm-lock.yaml
package-lock.json

# Android
android/.gradle/
android/build/
android/local.properties

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

### 🌐 Network Issues

If EAS Build fails due to network:

```bash
# Retry build
eas build --platform android --profile preview

# Or use local build (offline)
npx expo run:android --variant release
```

### 📸 Share APK with Team

```bash
# Share APK file directly
# Location: android/app/build/outputs/apk/release/app-release.apk

# Or share EAS build link
# From: expo.dev dashboard after build completes
```

---

## 📚 Documentation

### Official Resources

- **[Expo Documentation](https://docs.expo.dev)** - Complete Expo guide
- **[EAS Build Docs](https://docs.expo.dev/build/introduction/)** - Cloud build setup
- **[React Native Docs](https://reactnative.dev)** - React Native reference
- **[Android Studio Guide](https://developer.android.com/studio)** - Android development
- **[Gradle Documentation](https://gradle.org/documentation/)** - Build system

### Key Guides

- [Expo Local Development](https://docs.expo.dev/develop/development-builds/introduction/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)
- [TypeScript in React Native](https://reactnative.dev/docs/typescript)

---

## 🚀 Deployment Workflow

### To Google Play Store

1. Build with production profile:
   ```bash
   eas build --platform android --profile production
   ```

2. Download APK/AAB from EAS

3. Submit to Google Play Console at [play.google.com/console](https://play.google.com/console)

### To Apple App Store

1. Build for iOS:
   ```bash
   eas build --platform ios --profile production
   ```

2. Download IPA from EAS

3. Submit to App Store Connect at [appstoreconnect.apple.com](https://appstoreconnect.apple.com)

---

## 👥 Team & Support

### Maintainers

- **Kleidsys Technologies**
- Email: [madhanraj@kleidsys.com](mailto:madhanraj@kleidsys.com)
- GitHub: [madhanraj-kleidsys](https://github.com/madhanraj-kleidsys)

### Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 🎉 Quick Reference Cheat Sheet

| Task | Command |
|------|---------|
| **Start dev server** | `pnpm expo start` |
| **Build Android (EAS)** | `eas build --platform android --profile preview` |
| **Build Android (Local)** | `npx expo run:android --variant release` |
| **Build iOS (EAS)** | `eas build --platform ios --profile preview` |
| **Install APK locally** | `adb install app-release.apk` |
| **Clean everything** | `npx expo clean` |
| **Update dependencies** | `pnpm update` |
| **Check environment** | `eas diagnostics` |

---

## ✨ What's Next?

- 🎨 Customize app colors and theme
- 📱 Test on real Android/iOS devices
- 🚀 Deploy to Play Store & App Store
- 🔄 Setup CI/CD pipeline
- 📊 Add analytics and crash reporting

---

**Happy building! 🚀📱** 

For questions or issues, please open an issue on [GitHub](https://github.com/kleidsys/monitix-360/issues) or contact the team.

---

*Last updated: November 26, 2025*  
*Monitix-360 v1.0.0*