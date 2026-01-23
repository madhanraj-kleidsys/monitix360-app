<div align="center">

# 🚀 Monitix 360

### Smart Task Assignment • Workflow Planning • Activity Monitoring

<p align="center">
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Bun-fbf0df?style=for-the-badge&logo=bun&logoColor=darkgreen" />
  <img src="https://img.shields.io/badge/Microsoft%20SQL%20Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white" />
</p>

---

</div>

## 🌐 Overview

**Monitix 360** is a smart, modern task planning and monitoring system built with **Expo Go**, **React Native**, **Node.js**, & **MSSQL**.

**✔ Assign tasks**  
**✔ Monitor user activity**  
**✔ Track progress**  
**✔ Manage teams**  
**✔ Plan workflows**

> *All in one powerful, intuitive platform.*

---

## ✨ Features

### 🗂 **Task Management**
- Create, assign, and update tasks
- Set priorities, deadlines, and categories
- Track status: **Pending** → **In-Progress** → **Completed**

### 📊 **Real-Time Activity Monitoring**
- Live user activity tracking
- Task completion timeline visualization
- Productivity indicators and insights

### 👥 **Team & User Management**
- Add and manage team members
- Role-based access control
- User activity logs and audit trails

### 📅 **Smart Planning**
- Daily, weekly, and monthly planning views
- Interactive timeline visualization
- Workflow diagrams and Gantt charts

### 🔐 **Authentication & Security**
- JWT-based secure authentication
- Session management
- Encrypted user passwords with Bcrypt
- Encrypted Company Mail passwords with Bcrypt

### 📱 **Cross-Platform Mobile App**
- Built with **Expo** and **React Native**
- Works seamlessly on **Android** and **iOS**
- Responsive design for tablets and All phones


- ✅ Cross-platform support (Android & iOS)
- ✅ Beautiful glassmorphic UI with animations
- ✅ Real-time task monitoring
- ✅ Cloud synchronization via EAS Build
- ✅ Offline-first architecture
- ✅ Professional authentication system

---

## 🛠️ Tech Stack

| Layer | Technology | Badge |
|-------|-----------|-------|
| **Frontend (Mobile)** | Expo & React Native | ![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white) ![React_Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) |
| **Backend (API)** | Node.js + Express | ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge) |
| **Package Manager** | Bun | ![Bun](https://img.shields.io/badge/Bun-fbf0df?style=for-the-badge&logo=bun&logoColor=darkgreen) |
| **Database** | MSSQL | ![MSSQL](https://img.shields.io/badge/Microsoft%20SQL%20Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white) |
| **Authentication** | JWT | ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white) |
| **Version Control** | Git & GitHub | ![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white) |

---

## 📦 Requirements

Before you start, ensure you have the following installed:

### Minimum Requirements

- **Node.js**: v18 or higher
- **Bun**: v1.3.6
- **OR**
- **pnpm**: v8 or higher (or npm/yarn)
- **Git**: For version control
- **Expo Account**: Free at [expo.dev](https://expo.dev)


## ⚙️ Installation Guide

### 🔧 **1. Clone the Repository**

``` bash
git clone https://github.com/madhanraj-kleidsys/monitix360-app.git
```
### 📱 **2. Frontend Setup (Expo App)**

#### ▶️ Install Dependencies

```bash
cd client

# Using bun (recommended)
bun install

# Using pnpm
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```


#### ▶️ Start the Expo Development Server

```bash

# For Android Emulator
bunx expo start --android
npx expo start --android

# For iOS Simulator (Mac only)
npx expo start --ios


# For Expo Go App (mobile phone)
npx expo start
```


#### 📱 **How to View the App**

- **Mobile**: Scan QR code with **Expo Go** app
- **Android Emulator**: Press `a`
- **iOS Simulator**: Press `i`
- **Web Preview**: Press `w`

---

#### 3. Backend Setup (Node.js Server)

#### ▶️ Setup Environment Variables

Create a `.env` file in the `server/` directory:

```bash
PORT=3000
HOST=LOCAL IP ADDRESS (eg: 198.162.1.1)
NODE_ENV=DEVELOPMENT

DB_USER=sa
DB_PASSWORD=password@123
DB_HOST=HOST
DB_NAME=DB NAME
DB_PORT=1433

# JWT Secret generate command
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

JWT_SECRET=
ACCESS_SECRET=
REFRESH_SECRET=
JWT_EXPIRES = 1d

# MSSQL OPTIONS
DB_ENCRYPT=false
DB_TRUSTSERVERCERTIFICATE=true

EMAIL_USER=kleidsys@gmail.com
EMAIL_PASS=glor mand yjoy iigm

```
---

### 🖥️ **4. Backend Setup (Node.js Server)**

#### ▶️ Install Dependencies

```bash

cd server

# Using bun (recommended)
bun install

```

### 🚀 **5. Start the Backend Server**
```bash

bun start ||
bun --hot server.js

```
✅ **API is now running at:** `http://198.162.1.1:3000`

---

## 📦 Build Commands

### 📱 **Build Mobile App for Production**

#### Android APK

```bash

cd client

bunx expo prebuild --platform android

#### iOS IPA

cd client

bunx expo prebuild --platform ios

```

### **Code Signing:**

```bash

create a Digital Signature (Keystore) for your app :

keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

move that into : client\android\app\my-release-key.keystore


Step 2: Create a Secret File (Security Best Practice)

Do not hardcode passwords in your code. Create a file named android/gradle.properties 
(or edit the existing one) and add these lines:

MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your_keystore_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password

Step 3: Edit android/app/build.gradle

Open android/app/build.gradle (the one inside the app folder, not the root one) and find the android { ... } block. 

Update the signingConfigs and buildTypes:


android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        release {
            // Link the signing config here
            signingConfig signingConfigs.release
            
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}

```

```bash

cd android
./gradlew assembleRelease

```

**if forgotten keytool**

```bash
keytool -list -v -keystore android/app/my-release-key.keystore
```
---

#### iOS IPA

bunx expo build:ios

**Code Signing:**
Open the generated ios folder in Xcode.
Need Apple Developer Account, go to the "Signing & Capabilities" tab, 
select your "Team," and Xcode will automatically generate the required provisioning profiles.

**Export IPA:** 
*In Xcode*, go to Product > Archive. 
Once finished, use the "Distribute App" wizard to export the .ipa file. 
---

### 🌍 **Production Backend Deployment**

cd server
bun start

---

## 👀 How to View Output

### 📱 **Mobile App**
- Open **Expo Go** on your phone
- Scan the QR code from terminal
- Live reload enabled for instant updates

### 🌐 **Backend API**
- Test endpoints using **Postman** or **Thunder Client**
- View logs in terminal
- Monitor requests and responses

### 🗄 **Database**
- Use **MSSQL**
---

# 📱 Building ( Eas cloud & offline ) :

Here is the comprehensive guides for building app in Eas cloud & offline :

## Build Guides
- **[Building APK & IPA](Buildapk.md)** - Step-by-step guide for creating app packages
  - Build with EAS Offline (recommended) for keeping IP's safely offline
  - Local build with Android SDK & Xcode
  - Testing before publishing

---

...

# 📱 Full Publishing Guide 🚩🐦‍🔥

Here is the comprehensive, up-to-date guide for publishing your app on Android and iOS:

👉 **[See the complete publishing guide (app-publish-guide.md)](app-publish-guide.md)**

Or jump to:
- [Google Play Store Publishing Steps](app-publish-guide.md#part-1-google-play-store-android)
- [Apple App Store Publishing Steps](app-publish-guide.md#part-2-apple-app-store-ios)

---