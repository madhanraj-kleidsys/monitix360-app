<div align="center">

# 🚀 Monitix 360

### Smart Task Assignment • Workflow Planning • Activity Monitoring

<p align="center">
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
</p>

---

</div>

## 🌐 Overview

**Monitix 360** is a smart, modern task planning and monitoring system built with **Expo**, **Node.js**, and **PostgreSQL**.

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

### 📱 **Cross-Platform Mobile App**
- Built with **Expo** and **React Native**
- Works seamlessly on **Android** and **iOS**
- Responsive design for tablets and phones


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
| **Frontend (Mobile)** | Expo / React Native | ![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white) |
| **Backend (API)** | Node.js + Express | ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white) |
| **Database** | PostgreSQL | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white) |
| **ORM** | Prisma | ![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white) |
| **Authentication** | JWT + Bcrypt | 🔐 |
| **Version Control** | Git & GitHub | 🐙 |

---

## 📁 Project Structure

monitix-360/
├── app/ # 📱 Expo (React Native) mobile app
│ ├── screens/ # 🔑 Login, Register, Tasks, Dashboard screens
│ ├── components/ # 🧩 Reusable UI components
│ └── services/ # 🔌 API calls and authentication logic
├── server/ # 🖥️ Node.js backend (Express API)
│ ├── routes/ # 🚦 API endpoints
│ ├── controllers/ # ⚙️ Business logic
│ ├── middleware/ # 🛡️ Auth and validation
│ └── prisma/ # 🗄️ Prisma schema & migrations
├── .env # 🔐 Environment variables
├── README.md # 📄 Project documentation (this file)
└── package.json # 📦 Project dependencies

---

## 📦 Requirements

Before you start, ensure you have the following installed:

### Minimum Requirements

- **Node.js**: v18 or higher
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

cd client

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```


#### ▶️ Start the Expo Development Server


```bash

# For Android Emulator
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

### 🖥️ **3. Backend Setup (Node.js Server)**

#### ▶️ Install Dependencies

cd server
npm install

#### ▶️ Setup Environment Variables

Create a `.env` file in the `server/` directory:

DATABASE_URL=postgresql://user:password@localhost:5432/monitix360
JWT_SECRET=your_super_secret_jwt_key
PORT=3000

---

### 🗄️ **4. Database Setup (Prisma)**

#### ▶️ Generate Prisma Client

npx prisma generate



#### ▶️ Run Database Migrations

npx prisma migrate dev --name init


#### ▶️ (Optional) Open Prisma Studio

npx prisma studio

> Opens a visual database editor at `http://localhost:5555`

---

### 🚀 **5. Start the Backend Server**

npm start


✅ **API is now running at:** `http://localhost:3000`

---

## 📦 Build Commands

### 📱 **Build Mobile App for Production**

#### Android APK

cd app
npx expo build:android


#### iOS IPA

npx expo build:ios

---

### 🌍 **Production Backend Deployment**

cd server
npm run build
npm run start:prod


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
- Use **Prisma Studio**: `npx prisma studio`
- Or connect via PostgreSQL client:
    psql -U postgres -d monitix360

---

# 📱 Building ( Eas cloud & offline ) :

We provide comprehensive guides for building app in Eas cloud & offline :

## Build Guides
- **[Building APK & IPA](Buildapk.md)** - Step-by-step guide for creating app packages
  - Build with EAS Cloud (recommended)
  - Local build with Android SDK & Xcode
  - Testing before publishing

---

...

# 📱 Full Publishing Guide 🚩🐦‍🔥

We provide a comprehensive, up-to-date guide for publishing your app on Android and iOS:

👉 **[See the complete publishing guide (app-publish-guide.md)](app-publi sh-guide.md)**

Or jump to:
- [Google Play Store Publishing Steps](app-publish-guide.md#part-1-google-play-store-android)
- [Apple App Store Publishing Steps](app-publish-guide.md#part-2-apple-app-store-ios)

---

## 🎨 Branding

**Name:** Monitix 360  
**Tagline:** *One Platform. Total Control.*  
**Colors:**  
- Primary: `#1E5A8E` (Blue)  
- Secondary: `#2E7AB8` (Light Blue)  
- Accent: `#3E9AD8` (Sky Blue)

---

## 🤝 Contributing

Contributions are welcome! 🎉

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---