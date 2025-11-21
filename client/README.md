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
├── app/ # Expo (React Native) mobile app
│ ├── screens/ # Login, Register, Tasks, Dashboard
│ ├── components/ # Reusable UI components
│ └── services/ # API calls and authentication
├── server/ # Node.js backend (Express API)
│ ├── routes/ # API endpoints
│ ├── controllers/ # Business logic
│ ├── middleware/ # Auth, validation
│ └── prisma/ # Prisma schema & migrations
├── .env # Environment variables
├── README.md # This file
└── package.json # Dependencies


---

## ⚙️ Installation Guide

### 🔧 **1. Clone the Repository**

git clone https://github.com/madhanraj-kleidsys/monitix360-app.git
cd monitix360-app


---

### 📱 **2. Frontend Setup (Expo App)**

#### ▶️ Install Dependencies

cd app
npm install || pnpm install


#### ▶️ Start the Expo Development Server

npx expo start


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


✅ **API is now running at:** `http://localhost:5000`

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

## 📧 Contact

**Developer:** Your Name  
**Email:** your.email@example.com  
**GitHub:** [@yourusername](https://github.com/yourusername)

---

<div align="center">

### ⭐ If you like this project, give it a star!

Made with ❤️ by **Kleidsys Technologies**

</div>