# CollabBoard 🧩

Real-time collaborative Kanban board — Trello + Notion style.
Live cursors · Drag & drop · Board chat · Invite links · 100% Free stack

---

## ✨ Features

| Feature | Status |
|---|---|
| Register / login with JWT | ✅ |
| Create, rename, delete boards | ✅ |
| Add / rename / delete columns | ✅ |
| Add / edit / delete cards with labels | ✅ |
| Drag & drop cards between columns | ✅ |
| Real-time sync via Socket.io | ✅ |
| Live cursors — see teammates working | ✅ |
| Presence bar — who is online | ✅ |
| Board chat with message grouping | ✅ |
| Invite via link or 8-char code | ✅ |
| Mobile responsive | ✅ |

---

## ⚡ Local Setup

### Backend
```bash
cd backend && npm install
cp .env.example .env   # fill MONGODB_URI + JWT_SECRET
npm run dev            # http://localhost:5000
```

### Frontend
```bash
cd frontend && npm install
cp .env.local.example .env.local
npm run dev            # http://localhost:3000
```

---

## 🚀 Deploy (Free)

| Service | Platform |
|---|---|
| Frontend | Vercel — add NEXT_PUBLIC_API_URL |
| Backend | Render — add MONGODB_URI + JWT_SECRET + FRONTEND_URL |
| Database | MongoDB Atlas M0 free tier |

> Tip: Add an UptimeRobot monitor pinging /health every 5 min to keep Render awake.

---

## 🔌 Key Socket Events

client→server: board:join, board:leave, cursor:move, cursor:leave,
               chat:message, card:moved, card:created, card:updated,
               card:deleted, column:created, column:deleted

server→client: room:members, user:joined, user:left, cursor:moved,
               cursor:left, chat:message, card:*, column:*
