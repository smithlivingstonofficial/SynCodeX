# 🚀 SynCodeX (Syncodex)

[![Website](https://img.shields.io/badge/demo-syncodex.web.app-4db6ac?style=for-the-badge)](https://syncodex.web.app/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](./LICENSE)
[![Build & Deploy](https://img.shields.io/badge/CI-Firebase%20Hosting-0ea5a4?style=for-the-badge&logo=firebase)](https://syncodex.web.app/)

---

> **SynCodeX** (Syncodex) — a collaborative online code editor and team workspace that enables real-time editing, communication (chat/voice/video), project management, and code execution — built for teams, classrooms and open-source collaboration.

---

## 🔥 Live Demo
- **URL:** https://syncodex.web.app/  
  (Open the demo to see the editor, projects, chat, and collaboration in action.)

---

## ✨ Key Features

- ✅ **Realtime Collaboration**: Live multi-user editing (cursor presence, selections)  
- ✅ **Authentication**: Email/Google/Facebook auth via Firebase  
- ✅ **Projects & Files**: Create public & private projects, add files and folders  
- ✅ **Editor**: Monaco Editor (or CodeMirror) with syntax highlighting and formatting  
- ✅ **Chat & Calls**: Text chat + media sharing; WebRTC-powered voice/video calls  
- ✅ **Code Run / Compile**: Run/preview code for web projects (sandboxes)  
- ✅ **History & Undo**: Basic revision history per-file  
- ✅ **Themes**: Light / Dark themes and configurable editor settings  
- ✅ **Community**: Q&A / Issues / Discussions area

---

## 🧭 Architecture Overview

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, Monaco Editor  
- **Backend & Realtime:** Firebase (Auth, Firestore, Realtime), Cloud Functions (if used)  
- **Storage:** Firebase Storage (for uploads/screenshots)  
- **Realtime Calls:** WebRTC (peer-to-peer) + Firebase signaling  
- **CI / Hosting:** Firebase Hosting & GitHub Actions (deploy on push to `main`)

> See `/docs/DFD` for system diagrams and data flow visuals (if present).

---

## 🛠 Tech Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,ts,vite,tailwind,firebase,monaco,git" alt="tech stack"/>
</p>

---

## 📁 Folder Structure (typical)

SynCodeX/
├─ public/
├─ src/
│ ├─ components/
│ ├─ pages/
│ ├─ hooks/
│ ├─ services/ # firebase wrappers, API helpers
│ ├─ editors/ # monaco integrations
│ └─ styles/
├─ docs/ # diagrams, DFDs
├─ .github/
│ └─ workflows/ # CI / deploy
├─ firebase.json
├─ firestore.rules
├─ storage.rules
├─ package.json
└─ README.md

---

## ⚙️ Setup & Development (Local)

> These commands assume Node 18+ and npm/yarn installed.

1. **Clone**
```bash
git clone https://github.com/smithlivingstonofficial/SynCodeX.git
cd SynCodeX
```

2. **Install Packages (node modules)**
npm install

3. **Create Firebase project**
Go to Firebase Console → create a project → enable Firestore, Auth (Email + Google), Storage.
Add web app and copy the Firebase config.

4. **Create .env**
Create .env
Copy .env.example to .env and update values.

5. **Run locally**
npm run dev
open http://localhost:5173 (or port shown)

6. **Build**
npm run build
