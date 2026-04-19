# 🌍 EcoQuest – Gamified Environmental Education Platform

> **Learn. Act. Impact.** — A full-stack MERN platform where users master environmental sustainability through quizzes, challenges, XP, badges, and live leaderboards.

---

## ✨ Features

| Category | Feature |
|----------|---------|
| 🔐 Auth | JWT registration/login, role-based access (user/admin) |
| 🎮 Gamification | XP system, 10 levels, badge unlocks, daily streaks |
| 📝 Quizzes | Timed MCQ quizzes across 5 eco topics, instant results + explanations |
| 🎯 Challenges | Daily/weekly/special challenges with XP rewards |
| 🏆 Leaderboard | Real-time global ranking via Socket.io |
| 🔔 Notifications | Live in-app toasts for level-ups and badge unlocks |
| 🌙 Dark Mode | Full dark/light theme with persistence |
| ⚙️ Admin Panel | User management, quiz oversight, platform stats |
| 📱 Responsive | Mobile-first design with slide-out mobile nav |

---

## 🗂️ Project Structure

```
eco-quest/
├── backend/                    # Node.js + Express API
│   ├── controllers/            # Business logic
│   │   ├── authController.js   # Register, login, getMe
│   │   ├── quizController.js   # Quiz CRUD + grading engine
│   │   ├── userController.js   # Leaderboard, profile, stats
│   │   └── challengeController.js
│   ├── middleware/
│   │   └── auth.js             # JWT protect + adminOnly
│   ├── models/
│   │   ├── User.js             # User schema (XP, levels, badges, streaks)
│   │   ├── Quiz.js             # Quiz + question schema
│   │   └── GameModels.js       # Badge, Challenge, Score schemas
│   ├── routes/                 # Express routers
│   ├── socket/
│   │   └── socketManager.js    # Socket.io event handlers
│   ├── utils/
│   │   ├── badgeEngine.js      # Auto badge award logic
│   │   └── seeder.js           # Database seed script
│   ├── .env.example
│   ├── Dockerfile
│   └── server.js               # Entry point
│
├── frontend/                   # React 18 SPA
│   ├── src/
│   │   ├── context/            # React contexts
│   │   │   ├── AuthContext.js  # Global auth state
│   │   │   ├── ThemeContext.js # Dark mode
│   │   │   └── SocketContext.js# Real-time events
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── QuizzesPage.js
│   │   │   ├── QuizPlayPage.js # Timed quiz player + results
│   │   │   ├── LeaderboardPage.js
│   │   │   ├── ChallengesPage.js
│   │   │   ├── ProfilePage.js  # Badge showcase + stats
│   │   │   ├── AdminPage.js
│   │   │   └── NotFoundPage.js
│   │   ├── components/ui/
│   │   │   ├── Layout.js       # Sidebar + mobile nav
│   │   │   ├── NotificationToast.js
│   │   │   └── LoadingScreen.js
│   │   ├── services/api.js     # Axios + typed API helpers
│   │   └── utils/constants.js  # Topics, levels, XP math
│   ├── public/index.html
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB (local) or MongoDB Atlas account
- npm or yarn

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd eco-quest
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecoquest    # or your Atlas URI
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

Install and seed:
```bash
npm install
npm run seed        # Populates badges, quizzes, challenges + admin user
npm run dev         # Starts with nodemon on port 5000
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm start           # Starts on port 3000
```

Open **http://localhost:3000** — the app is live!

**Default admin credentials:**
- Email: `admin@ecoquest.com`
- Password: `Admin123!`

---

## 🐳 Docker (Full Stack)

```bash
# From project root
cp backend/.env.example backend/.env   # Edit your MONGO_URI if using Atlas

docker-compose up --build
```

- Frontend → http://localhost:3000
- Backend API → http://localhost:5000
- MongoDB → localhost:27017

---

## ☁️ Deployment

### Frontend → Vercel / Netlify

```bash
cd frontend
npm run build       # Creates /build directory
```

**Vercel:** `vercel --prod`  
**Netlify:** drag `/build` to the Netlify dashboard, or use `netlify deploy --prod --dir=build`

Set environment variable:
```
REACT_APP_API_URL=https://your-backend.railway.app/api
REACT_APP_SOCKET_URL=https://your-backend.railway.app
```

### Backend → Render / Railway

1. Push to GitHub
2. Connect repo to Render/Railway
3. Set environment variables from `.env.example`
4. Set `MONGO_URI` to your **MongoDB Atlas** connection string

### MongoDB Atlas
1. Create free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create database user
3. Get connection string → set as `MONGO_URI`
4. Run seeder: `npm run seed`

---

## 📡 API Documentation

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |

**Register Request:**
```json
{
  "username": "EcoHero",
  "email": "hero@example.com",
  "password": "secret123",
  "avatar": "🌱"
}
```

**Login Response:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": {
    "id": "...",
    "username": "EcoHero",
    "xp": 0,
    "level": 1,
    "badges": [],
    "streak": 1
  }
}
```

### Quizzes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/quizzes` | ✅ | List quizzes (filter by topic/difficulty) |
| GET | `/api/quizzes/:id` | ✅ | Get quiz (answers hidden) |
| POST | `/api/quizzes/:id/submit` | ✅ | Submit answers, get XP |
| POST | `/api/quizzes` | 🔑 Admin | Create quiz |
| PUT | `/api/quizzes/:id` | 🔑 Admin | Update quiz |
| DELETE | `/api/quizzes/:id` | 🔑 Admin | Deactivate quiz |

**Query params for GET /quizzes:**
- `topic` — `climateChange | recycling | biodiversity | oceanHealth | renewableEnergy`
- `difficulty` — `beginner | intermediate | advanced`
- `page`, `limit` — pagination

**Submit Request:**
```json
{
  "answers": [1, 0, 2, 1, 3],
  "timeTaken": 145
}
```

**Submit Response:**
```json
{
  "success": true,
  "results": {
    "score": 40,
    "maxScore": 50,
    "percentage": 80,
    "xpEarned": 40,
    "leveledUp": false,
    "newBadges": [],
    "gradedAnswers": [...]
  }
}
```

### Leaderboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leaderboard` | ✅ | Get ranked users |

**Query params:**
- `period` — `all | weekly | monthly`
- `limit` — number of results (default 50)

### Challenges

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/challenges` | ✅ | Get active challenges |
| POST | `/api/challenges/:id/complete` | ✅ | Mark challenge complete |
| POST | `/api/challenges` | 🔑 Admin | Create challenge |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me/stats` | ✅ | Full stats for current user |
| PUT | `/api/users/profile` | ✅ | Update username/avatar |
| GET | `/api/users/:id/profile` | ✅ | View any user's profile |

### Badges

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/badges` | ✅ | List all badges |
| POST | `/api/badges` | 🔑 Admin | Create badge |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | 🔑 Admin | Platform overview |
| GET | `/api/admin/users` | 🔑 Admin | All users (searchable) |
| PUT | `/api/admin/users/:id` | 🔑 Admin | Ban/unban, change role |

---

## 🔌 Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `user:join` | `userId` | Join personal notification room |
| `leaderboard:join` | — | Subscribe to live leaderboard |
| `leaderboard:leave` | — | Unsubscribe |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `leaderboard:update` | `{ userId, xp }` | Someone scored; refresh leaderboard |
| `level:up` | `{ newLevel }` | Current user leveled up |
| `badge:earned` | `{ badges[] }` | Current user earned badge(s) |
| `users:online` | `count` | Live online user count |

---

## 🎮 Gamification Details

### XP & Levels
| Level | Title | XP Required |
|-------|-------|-------------|
| 1 | 🌱 Eco Seedling | 0 |
| 2 | 🌿 Green Sprout | 100 |
| 3 | 🍃 Nature Explorer | 300 |
| 4 | ⚔️ Eco Warrior | 600 |
| 5 | 🛡️ Green Guardian | 1,000 |
| 6 | 🌍 Planet Protector | 1,500 |
| 7 | 🏆 Earth Champion | 2,500 |
| 8 | 🦉 Sustainability Sage | 4,000 |
| 9 | ⭐ Eco Legend | 6,000 |
| 10 | 🌟 Earth Deity | 10,000 |

### Quiz XP Formula
```
xpEarned = round((percentage / 100) × quizXPReward)
Perfect score (100%) → xpEarned × 1.5 bonus
```

### Seeded Badges (10 total)
| Badge | Trigger |
|-------|---------|
| 🌱 Welcome Sprout | Register |
| 👣 First Steps | Complete 1 quiz |
| 📚 Knowledge Seeker | Complete 5 quizzes |
| 🎓 Quiz Master | Complete 20 quizzes |
| ⚔️ Eco Warrior | Reach 500 XP |
| 🛡️ Green Guardian | Reach Level 5 |
| 🔥 Streak Starter | 3-day streak |
| 💪 Week Warrior | 7-day streak |
| 🏆 Challenge Champion | Complete 10 challenges |
| 🌍 Planet Protector | Reach 2000 XP |

---

## 🧪 Sample Test Data

The seeder creates:
- **5 quizzes** (5 questions each): Climate Change, Recycling, Biodiversity, Ocean Health, Renewable Energy
- **10 badges** with automatic unlock triggers
- **8 challenges** (daily + weekly)
- **1 admin account**: `admin@ecoquest.com` / `Admin123!`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Framer Motion, Tailwind CSS, Axios |
| Backend | Node.js, Express.js, Socket.io, JWT, bcryptjs |
| Database | MongoDB with Mongoose ODM |
| Real-time | Socket.io (WebSocket + polling fallback) |
| DevOps | Docker, Docker Compose, nginx |
| Fonts | Playfair Display (display), DM Sans (body) |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — free to use for educational and commercial projects.

---

*Built with 💚 for a greener planet.*
