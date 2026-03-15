# How to Run Locally

**Prerequisites:**
- PostgreSQL 16 running (`brew services start postgresql@16`)
- DB `ascortbali` exists and is seeded
- PNPM 9.12.3 installed

**Single command from project root:**

```bash
pnpm dev
```

This starts **4 services in parallel**:
| Service | URL | Notes |
|---------|-----|-------|
| Express API | `http://localhost:4000` | Health: `http://localhost:4000/health` → `{"ok":true}` |
| Next.js Web | `http://localhost:3000` | Main frontend |

> **Wait for this line before opening the browser — Next.js takes ~26s to compile:**
> ```
> app/web dev:  ✓ Ready in 25.7s
> ```
> Opening `http://localhost:3000` before `Ready` will show nothing.

---

**If DB is ever lost/reset**, re-seed it first:
```bash
export DATABASE_URL="postgresql://ascort:ascort@localhost:5432/ascortbali"
python3 database/migrate.py   # create tables
python3 database/seed.py      # load creators + images
```

---

## How to Stop / Kill All Services

**If you started with `pnpm dev` in a terminal:**
```
Ctrl + C
```

**If running in the background (force kill):**
```bash
pkill -f "tsx src/index.ts" && pkill -f "next dev"
```

**Or kill by port:**
```bash
kill $(lsof -ti :4000) && kill $(lsof -ti :3000)
```
