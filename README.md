# MiniSocial — Mini Social Media App

A small social media app with user profiles, follow/unfollow, posts, likes and
comments. Built with a plain HTML/CSS/JavaScript frontend served directly by
an Express + MongoDB backend, so the **whole app is one project and deploys
as a single web service with a single live URL.**

## Features

- Register / login with JWT authentication (passwords hashed with bcrypt)
- User profiles with bio and avatar (image URL)
- Follow / unfollow other users, follower & following counts
- Create text posts (with an optional image URL)
- Like / unlike posts
- Comment on posts
- Feed of all posts, newest first
- Delete your own posts

## Tech stack

- **Frontend:** plain HTML, CSS, JavaScript (no framework, no build step) — lives in `public/`
- **Backend:** Node.js, Express
- **Database:** MongoDB (MongoDB Atlas for the live demo), Mongoose ODM
- **Auth:** JSON Web Tokens (JWT)

## Project structure

```
social-app/
├── server.js              # Express app entry point — serves API + frontend
├── package.json
├── .env.example            # copy to .env and fill in your own values
├── config/
│   └── db.js                # MongoDB connection
├── models/
│   ├── User.js
│   ├── Post.js
│   └── Comment.js
├── middleware/
│   └── auth.js               # JWT verification middleware
├── routes/
│   ├── authRoutes.js         # /api/auth/*
│   ├── userRoutes.js         # /api/users/*  (profile, follow)
│   ├── postRoutes.js         # /api/posts/*  (feed, create, like)
│   └── commentRoutes.js      # /api/posts/:id/comments, /api/comments/:id
└── public/                  # <-- the entire frontend lives here
    ├── index.html            # login / register page
    ├── feed.html              # main feed
    ├── profile.html           # user profile page
    ├── css/style.css
    └── js/
        ├── api.js             # fetch helper + shared utilities
        ├── feed.js
        └── profile.js
```

Because `public/` is served by the same Express server (`app.use(express.static(...))`
in `server.js`), you only need **one deployment** and **one URL** — there is
no separate frontend server.

## Run locally

1. **Clone the repo and install dependencies**

   ```bash
   git clone <your-repo-url>
   cd social-app
   npm install
   ```

2. **Create a MongoDB Atlas cluster** (free tier is enough)
   - Go to https://www.mongodb.com/cloud/atlas and create a free cluster
   - Create a database user (username + password)
   - Under Network Access, allow access from anywhere (`0.0.0.0/0`) for simplicity
   - Click "Connect" → "Drivers" and copy the connection string, it looks like:
     `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mini-social-app?retryWrites=true&w=majority`

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in:
   - `MONGO_URI` — your Atlas connection string from step 2
   - `JWT_SECRET` — any long random string (e.g. generate one with `openssl rand -hex 32`)
   - `PORT` — leave as `5000` for local dev

4. **Start the server**

   ```bash
   npm start
   ```

   or, for auto-restart on file changes during development:

   ```bash
   npm run dev
   ```

5. Open **http://localhost:5000** in your browser. Register a couple of
   accounts (e.g. in two different browser tabs / incognito windows) to try
   following, posting, liking and commenting.

## Deploy to Render (single live URL)

1. Push this project to a GitHub repository.
2. Go to https://render.com → **New +** → **Web Service** → connect your GitHub repo.
3. Configure the service:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
4. Add environment variables in Render's dashboard (Settings → Environment):
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — your secret string
   - (Do **not** set `PORT` manually — Render provides it automatically and
     `server.js` already reads `process.env.PORT`.)
5. Deploy. Render will build and start the app, and give you a single URL
   like `https://your-app-name.onrender.com` — that URL serves both the
   frontend pages and the `/api/...` backend, so it's your one live demo link.

**Important:** make sure MongoDB Atlas → Network Access allows connections
from anywhere (`0.0.0.0/0`), since Render's outgoing IP isn't fixed on the
free plan.

## API overview

| Method | Endpoint                        | Auth | Description                     |
|--------|----------------------------------|------|----------------------------------|
| POST   | /api/auth/register               | No   | Create an account                |
| POST   | /api/auth/login                  | No   | Log in, get a JWT                |
| GET    | /api/auth/me                     | Yes  | Get the logged-in user           |
| GET    | /api/users/:id                   | No   | Get a profile + their posts      |
| PUT    | /api/users/:id                   | Yes  | Update your own bio/avatar       |
| POST   | /api/users/:id/follow             | Yes  | Follow / unfollow a user         |
| GET    | /api/users/:id/followers           | No   | List followers                   |
| GET    | /api/users/:id/following           | No   | List who they follow             |
| GET    | /api/posts                       | No   | Feed (all posts, newest first)   |
| POST   | /api/posts                       | Yes  | Create a post                    |
| GET    | /api/posts/:id                    | No   | Get one post + its comments      |
| DELETE | /api/posts/:id                    | Yes  | Delete your own post             |
| POST   | /api/posts/:id/like                | Yes  | Like / unlike a post             |
| GET    | /api/posts/:postId/comments        | No   | List comments on a post          |
| POST   | /api/posts/:postId/comments        | Yes  | Add a comment                    |
| DELETE | /api/comments/:id                  | Yes  | Delete your own comment          |

## Notes

- This is a minimal/learning-focused project — there's no image upload
  (avatars/post images use plain URLs), no pagination, and no rate limiting.
  Feel free to extend it.
- Never commit your real `.env` file — it's already listed in `.gitignore`.

## 🔗 Links

**GitHub Repository:**
https://github.com/palrushideepthisree/CodeAlpha_mini-social-app

**Live Demo:**
https://codealpha-mini-social-app.onrender.com

## 👨‍💻 Author

**Deepthi Sree**

GitHub: https://github.com/palrushideepthisree

LinkedIn: https://www.linkedin.com/in/deepthisreepalrushi

---
⭐ If you like this project, consider giving it a star!



