# 🧩 Rakaya Taskboard – Frontend based web app

A modern **Task Management Board** built as part of the **Rakaya Frontend Developer Challenge**. This project demonstrates strong frontend architecture, clean UI implementation, state management using **Redux Toolkit**, and effective use of React with **TypeScript** and **Tailwind CSS**.

## 🚀 Live Demo
https://rakaya-taskboard.vercel.app
Tetsing user details with full privilage:
dummyy@gmail.com
Aa12345678

## 🧠 Overview
This project was built for **A Task Management Board** for Frontend Developer Challenge. It focuses primarily on **frontend development** — UI, interactivity, and state management — using modern React and ecosystem tools.

### Core Features
- Four columns: **Backlog**, **To Do**, **In Progress**, **Need Review**
- Full **CRUD** functionality for tasks
- **Drag & Drop** support to move tasks between columns
- **Task filtering** by priority and assignee
- **Search** by task title or tag
- Fully **responsive** design for desktop, tablet, and mobile

## ✨ Extra Features Implemented

| Feature | Description |
|---------|-------------|
| **Dark Mode** | Toggle between light/dark themes (persistent state) |
| **User Feedback Enhancements** | Integrated **SweetAlert2** for confirmations and **React Hot Toast** for notifications |
| **Dashboard Statistics** | Added task and project summaries on the home page using **Recharts** |
| **Skeleton Loading States** | Implemented skeleton screens for smoother loading |
| **TypeScript + Redux Toolkit** | Strong typing and clean global state management |
| **Tailwind CSS** | Modern, responsive, and customizable UI styling |

## 💡 Backend Approach – MockAPI & JSON Server
Since the challenge's goal was to assess **frontend skills**, this project does **not** use a real backend. Instead, it uses a **mock backend** through **MockAPI.io** and **JSON Server** for local development.

### 🧱 MockAPI.io
I used [MockAPI.io](https://mockapi.io) to host mock data (users, projects, tasks, comments). This platform automatically generates RESTful endpoints and supports all CRUD operations, making it ideal for simulating API interactions in frontend projects.

Example endpoint:
```
https://<your-mockapi-id>.mockapi.io/api/v1/tasks
```

While MockAPI is not recommended for production, it's excellent for **temporary projects, testing, and demo environments** like this challenge.

### 🧰 JSON Server (for local simulation)
For local testing, **JSON Server** can be used to host the mock data from the included `db.json` file.

#### Run locally:
```bash
npm run json:serve
```

This will start JSON Server on:
```
http://localhost:4000
```

Your `db.json` file can hold mock collections such as:
```json
{
  "tasks": [],
  "projects": [],
  "users": []
}
```

You can also run both the frontend and mock API together:
```bash
npm run start:all
```

This command runs:
- `vite` for the frontend
- `json-server` for the local API

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/<your-username>/rakaya-taskboard.git
cd rakaya-taskboard
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Run the App in Development Mode
```bash
npm run dev
```

### 4️⃣ Run JSON Server (optional)
```bash
npm run json:serve
```

### 5️⃣ Build for Production
```bash
npm run build
```

### 6️⃣ Preview the Production Build
```bash
npm run preview
```

## 🧩 Tech Stack

| Category         | Technology                           |
|------------------|--------------------------------------|
| Framework        | **React 19 + TypeScript**            |
| State Management | **Redux Toolkit**                    |
| UI Styling       | **Tailwind CSS**                     |
| Animations       | **Framer Motion**                    |
| Notifications    | **React Hot Toast**, **SweetAlert2** |
| Charts           | **Recharts**                         |
| API Mocking      | **MockAPI.io**, **JSON Server**      |
| Routing          | **React Router DOM (v7)**            |
| Form Handling    | **React Hook Form + Zod Validation** |

## 📁 Project Structure
```
src/
├── api/                 # API slices (tasks, projects, users, comments)
├── app/                 # Redux store configuration
├── components/
│   ├── Layout/          # Navbar, Sidebar, Layout components
│   ├── Tasks/           # Task board, cards, and modals
│   ├── Projects/        # Project-related components
│   └── Skeletons/       # Loading skeletons
├── pages/               # Page-level components (Home, Login, Register, etc.)
├── store/               # Redux slices
├── styles/              # Global CSS and Tailwind setup
├── types/               # TypeScript interfaces and types
├── utils/               # Helper functions and alerts
├── App.tsx              # Main app entry
└── main.tsx             # Root render setup
```

## 🔐 Environment Variables
You may add your environment configuration in a `.env` file.
Example:
```
VITE_API_BASE_URL=https://<your-mockapi-id>.mockapi.io/api/v1
```

## 🧾 Scripts

| Command              | Description                               |
|----------------------|-------------------------------------------|
| `npm run dev`        | Start development server (Vite)           |
| `npm run build`      | Build the app for production              |
| `npm run preview`    | Preview the production build              |
| `npm run json:serve` | Start JSON Server on port 4000            |
| `npm run start:all`  | Run frontend and JSON server concurrently |

## 🧑‍💻 Author
**Qusai Abdullah**  
Frontend Developer  
Email: qusaii.abdullah@gmail.com
Portfolio: https://quasi-abdullah-portfolio.vercel.app
LinkedIn: http://linkedin.com/in/qusaiabdullah/

## 🏁 Notes
- The project was designed with **frontend focus only** — no backend logic or authentication persistence.
- MockAPI endpoints simulate all CRUD requests and are ideal for short-term demos.
- The UI prioritizes responsiveness, accessibility, and modern styling.
- The architecture is modular and scalable for future feature additions.
