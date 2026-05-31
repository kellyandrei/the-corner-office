# C/O — The Corner Office

> A quiet place for your focus.

AI-powered to-do app. You are the executive. The app is your Chief of Staff.
Paste a brain dump — the AI parses, prioritizes, schedules, and generates subtasks.
Tasks persist across sessions with real user accounts.

**Total cost: $0.00**

| Service         | Free tier                              |
|-----------------|----------------------------------------|
| Vercel          | Hobby plan — free forever              |
| Supabase        | 500MB DB, 50k monthly users — free     |
| Gemini 1.5 Flash| 1,500 requests/day — no billing needed |

---

## Setup (one-time, ~10 minutes)

### Step 1 — Supabase project

1. Go to **[supabase.com](https://supabase.com)** → New Project (free)
2. Pick a name, set a database password, choose a region
3. Once created, go to **SQL Editor → New Query**
4. Open the file `supabase/schema.sql` from this project, paste the entire contents, click **Run**
5. Go to **Settings → API** and copy:
   - **Project URL** → this is your `VITE_SUPABASE_URL`
   - **anon / public key** → this is your `VITE_SUPABASE_ANON_KEY`

### Step 2 — Gemini API key

1. Go to **[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**
2. Sign in with Google → **Create API Key** → copy it
3. Free tier: 1,500 requests/day, no credit card required

### Step 3 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — The Corner Office v2"
git remote add origin https://github.com/YOUR_USERNAME/corner-office.git
git branch -M main
git push -u origin main
```

### Step 4 — Deploy on Vercel

1. **[vercel.com](https://vercel.com)** → Add New Project → import your repo
2. Under **Environment Variables**, add all three:

| Key                    | Value                          |
|------------------------|--------------------------------|
| `VITE_SUPABASE_URL`    | https://xxxx.supabase.co       |
| `VITE_SUPABASE_ANON_KEY` | your anon key                |
| `GEMINI_API_KEY`       | your Gemini key                |

3. Click **Deploy** → live in ~60 seconds

Every `git push` to `main` auto-redeploys.

---

## Local development

```bash
npm install
cp .env.example .env.local
# Fill in your 3 keys in .env.local

npm i -g vercel
vercel dev   # Runs frontend + /api serverless function together
```

---

## Project structure

```
corner-office/
├── api/
│   └── parse.js              # Vercel serverless — Gemini proxy
├── src/
│   ├── lib/
│   │   └── supabase.js        # Supabase client singleton
│   ├── hooks/
│   │   ├── useAuth.js         # Sign in / sign up / sign out
│   │   ├── useTasks.js        # Task CRUD + optimistic updates
│   │   └── useSchedule.js     # Workday preferences persistence
│   ├── App.jsx                # Full UI — all views
│   └── main.jsx               # React entry point
├── supabase/
│   └── schema.sql             # Run this once in Supabase SQL Editor
├── index.html
├── vite.config.js
├── vercel.json
├── .env.example
└── package.json
```

---

## Auth note

Supabase sends a **confirmation email** on sign-up by default.
To disable this during development:
Supabase Dashboard → **Authentication → Providers → Email** → disable "Confirm email"

---

*Budget: $0.00 — Vercel + Supabase + Gemini, all free tiers*
