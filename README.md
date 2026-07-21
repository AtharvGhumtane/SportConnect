# 🏆 SportConnect

**SportConnect** is a full-stack social networking and sports management platform designed to connect athletes, teams, sports enthusiasts, and event organizers. Built with **Next.js** on the frontend and **Node.js/Express & MongoDB** on the backend, SportConnect empowers sports communities to connect, organize matches, showcase profiles, and discover local sporting events.

---

## ✨ Key Features

### 👤 Athlete Profiles & Networking
- **Customizable Profiles**: Highlight your favorite sports, skill levels, bio, location, and social links.
- **Connection Management**: Send, accept, or decline connection requests to build your sports network.
- **PDF Resume / Profile Exporter**: Generate and download formatted PDF summaries of athlete profiles using PDFKit.

### 🔐 Authentication & Security
- **JWT & Session Auth**: Secure JSON Web Token authentication with persistent login state.
- **Email OTP Password Reset**: 6-digit OTP verification delivered via Nodemailer for password recovery.
- **Google OAuth Integration**: Fast and safe one-click login with Google OAuth.

### 🏟️ Discover & Events Hub
- **Event Discovery**: Find local sports tournaments, pickup games, and athletic meets.
- **Event Filtering**: Search and filter events by sport type, date, location, and skill level.
- **Match Setup**: Create and organize custom events with automated participant tracking.

### 👥 Teams & Squad Management
- **Team Creation & Rosters**: Build sports teams, recruit players, and manage member roles.
- **Connection Discovery**: Easily invite existing connections to join your squad.

### 📱 Interactive Social Feed
- **Post Sharing**: Share posts with text and image attachments (training logs, game highlights, victories).
- **Interactions**: Like, comment, and engage with community posts in real time.

---

## 🛠️ Tech Stack

| Component | Technologies |
| :--- | :--- |
| **Frontend** | Next.js (Pages Router), React, Redux Toolkit, CSS Modules, Axios |
| **Backend** | Node.js, Express.js, MongoDB (Mongoose), Nodemailer, PDFKit |
| **Authentication** | JWT, Google OAuth 2.0, OTP Verification |
| **DevOps & Media** | Docker, Docker Compose, Multer (Local/Persistent Media Uploads) |

---

## 📁 Directory Structure

```text
SportConnect/
├── backend/
│   ├── config/          # Mailer, OAuth, and Database configurations
│   ├── controllers/     # Business logic for users, auth, events, and posts
│   ├── models/          # MongoDB Schemas (User, OTP, Post, Event, Team)
│   ├── routes/          # Express API route endpoints
│   ├── uploads/         # Local persistent upload storage for images & PDFs
│   ├── server.js        # Express app entrypoint
│   └── Dockerfile
├── frontend/
│   ├── public/          # Static assets & public branding images
│   ├── src/
│   │   ├── Components/  # Modular React components (Navbar, Modals, Feed, Cards)
│   │   ├── config/      # Redux store & Axios API client
│   │   ├── layout/      # Shared layout components
│   │   ├── pages/       # Next.js page routes (Dashboard, Discover, Events, Profile, Auth)
│   │   └── styles/      # Global & CSS Module stylesheets
│   └── Dockerfile
├── docker-compose.yml   # Multi-container orchestration config
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or MongoDB Atlas)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) *(Optional, for containerized run)*

---

### Method 1: Running with Docker (Recommended)

Run the entire application (Frontend + Backend + Persistent Media Storage) using Docker Compose:

```bash
docker compose up --build
```

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API Server**: [http://localhost:9000](http://localhost:9000)

> **Note on Media Uploads**: Uploaded media (profile pictures, post images) are persisted on the host system via `./backend/uploads`.

---

### Method 2: Manual Local Setup

#### 1. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=9000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
GOOGLE_CLIENT_ID=your_google_client_id
```

Start the backend server:

```bash
npm run dev
```

#### 2. Setup Frontend

Open a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve SportConnect, feel free to open a Pull Request or report an issue.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
