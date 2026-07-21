# 🏆 SportConnect — Professional Sports Social & Tournament Management Platform

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

**SportConnect** is a state-of-the-art, full-stack social networking and athletic management web application designed for athletes, sports captains, squad managers, and tournament organizers. Built with **Next.js** on the frontend and **Node.js/Express & MongoDB** on the backend, SportConnect empowers sports communities to connect, organize matches, manage team rosters, follow tournament brackets, and generate professional athletic scouting resumes.

---

## ✨ Core Platform Features

### 📌 Fixed Sticky Top Navbar & Responsive Navigation
- **Pinned Top Navbar**: Stays fixed at the top of the screen on all scroll depths (`position: fixed`), giving quick access to brand navigation, search, and notification popovers.
- **Mobile Bottom Bar**: LinkedIn-style mobile navigation bar pinned at the screen bottom for smooth smartphone interaction.

### 🔔 Interactive Notification System
- **Real-Time Actionable Notifications**: Dropdown popover delivering real-time alerts with integrated **`Accept`** and **`Decline`** action buttons for:
  - **Team Invitations**: Accept & join squads directly from notifications.
  - **Team Join Requests**: Captain approval workflow for incoming athlete applicants.
  - **Connection Requests**: One-click connection acceptance and dismissal.
- **Auto-Read Sync**: Automatically updates unread badges and marks notifications read upon interaction.

### 👥 Teams & Squad Management Engine
- **Squad Creation & Customization**: Create athletic squads with sport tags, capacity limits, and descriptions.
- **Smart Teammate Search & Invite**: Autocomplete search panel for team owners to search athletes by name/username and send direct squad invitations.
- **Persistent Join Request States**: Remembers "⏳ Request Pending" and "Squad Member" states across page refreshes.
- **Live Squad Chat Room**: Dedicated real-time team chat room for squad members.

### 🏆 Sports Events & Tournament Hub
- **Tournament Creation**: Host multi-sport events with customizable advancement rules (Top 2, Top 4 advance per category).
- **Secret Key Event Access**: Join tournaments securely via unique 8-character Event Keys using a sleek custom dark-mode modal dialog.
- **Live Match & Bracket Tracking**: Comprehensive sport-aware score updates (Football, Cricket, Basketball, Tennis, Volleyball) with group stage and knockout bracket progression.
- **Event Photo Galleries**: Upload, like, and share high-resolution tournament photos.

### 👤 Athlete Scouting Profiles & Pro Resume Generator
- **Scouting Profiles**: Detailed athlete overview showcasing club timelines, sport tags, post history, squad memberships, and network connections.
- **Self-Profile Protection**: Smart profile context that automatically replaces "Connect" buttons with **`Edit My Profile`** when viewing your own card.
- **Pro Athlete Resume (PDF) Exporter**: One-click server-side PDF generation via PDFKit, exporting styled PDF resumes for sports scouting.

### 📱 Social Feed & Community Engagement
- **Interactive Feed**: Share media (training highlights, match victories, text updates), with like and comment support.
- **Trending Athletes & Stats Overview**: Live sidebars showcasing popular athletes and personalized profile metrics.

---

## 🛠️ Technology Stack

| Architecture Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | Next.js 15 (Pages Router), React 18, Redux Toolkit |
| **Styling & Design System** | Vanilla CSS Modules, Dark Navy Sports Design Token Palette |
| **Backend Framework** | Node.js, Express.js |
| **Database & ORM** | MongoDB, Mongoose ODM |
| **Authentication & Security** | Stateful Session Tokens (Crypto 256-bit), Nodemailer (OTP Recovery), Google & GitHub OAuth 2.0 |
| **Document & Media Engine** | PDFKit (PDF Generation), Multer (Image Uploads & Storage) |
| **DevOps & Containerization** | Docker, Docker Compose |

---

## 📁 Repository Directory Structure

```text
SportConnect/
├── backend/
│   ├── config/          # Mailer, OAuth, and Database configurations
│   ├── controllers/     # Controller logic for users, auth, events, teams, and posts
│   ├── models/          # Mongoose Schemas (User, OTP, Post, Event, Team, Notification)
│   ├── routes/          # Express API route declarations
│   ├── uploads/         # Local persistent upload storage for images & PDFs
│   ├── server.js        # Backend Express server entry point
│   ├── Dockerfile       # Container build script for Express backend
│   └── package.json
├── frontend/
│   ├── public/          # Static logos, avatars, and assets
│   ├── src/
│   │   ├── Components/  # Modular UI components (Navbar, Modals, Feed, Cards)
│   │   ├── config/      # Redux store & Axios API client instances
│   │   ├── layout/      # Shared UserLayout & DashboardLayout wrappers
│   │   ├── pages/       # Next.js routes (dashboard, discover, events, teams, profile)
│   │   └── styles/      # Global design tokens and CSS modules
│   ├── Dockerfile       # Container build script for Next.js frontend
│   └── package.json
├── docker-compose.yml   # Multi-container orchestration config
└── README.md
```

---

## 🚀 Local Setup & Running Instructions

### Option 1: One-Command Docker Setup (Recommended)

Run the entire application stack (Frontend, Backend Server, and Persistent Upload Storage) with Docker Compose:

```bash
docker compose up --build
```

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API Server**: [http://localhost:9000](http://localhost:9000)

---

### Option 2: Manual Development Setup

#### 1. Backend Server Setup
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```env
PORT=9000
MONGO_URI=mongodb://localhost:27017/aim-gold
JWT_SECRET=your_jwt_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

Start the backend server:
```bash
npm run dev
```

#### 2. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```

Create a `.env.local` file inside `frontend/`:
```env
NEXT_PUBLIC_BASE_URL=http://localhost:9000
```

Start the Next.js development server:
```bash
npm run dev
```

The web application will open at **[http://localhost:3000](http://localhost:3000)**.

---


---

## 📄 License & Attribution

Developed with ❤️ by **Atharv Ghumtane** & Team for **SportConnect**. All rights reserved.
