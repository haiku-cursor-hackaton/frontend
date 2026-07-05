# Deploy — Genko portal + platform

## Frontend (Netlify: `genko-portal.netlify.app`)

Set in **Site settings → Environment variables** (build-time `VITE_*`):

| Variable | Production value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://kfutwosjsossgqhnhjor.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → API → **anon public** |
| `VITE_UCP_API_URL` | `https://genko-platform-production.up.railway.app` |
| `VITE_MCP_URL` | `https://genko-platform-production.up.railway.app/mcp` |

Then **Deploy → Trigger deploy** (env changes require a new build).

### Supabase Auth (same project)

In **Authentication → URL configuration**, add:

- Site URL: `https://genko-portal.netlify.app`
- Redirect URLs: `https://genko-portal.netlify.app/**`, `http://localhost:5173/**`

Enable Email (and Google/GitHub if you use OAuth on the login page).

---

## Backend (Railway: `genko-platform-production`)

| Variable | Production value |
| --- | --- |
| `SUPABASE_URL` | `https://kfutwosjsossgqhnhjor.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → API → **service_role** (server only) |
| `PUBLIC_BASE_URL` | `https://genko-platform-production.up.railway.app` |
| `MCP_PATH` | `/mcp` |
| `ENVIRONMENT` | `production` |
| `CORS_ORIGINS` | `https://genko-portal.netlify.app` |

No quotes around values in Railway. Redeploy after changing env.

### Verify CORS

```powershell
curl.exe -i -X OPTIONS "https://genko-platform-production.up.railway.app/v1/connect/client" `
  -H "Origin: https://genko-portal.netlify.app" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Expect `200` and header `access-control-allow-origin: https://genko-portal.netlify.app`.

---

## Local dev

**Terminal 1 — backend** (`genko-backend/`):

```powershell
pip install -e ".[dev]"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — frontend** (`frontend/`):

```powershell
cp .env.example .env
# Paste VITE_SUPABASE_ANON_KEY from Supabase Dashboard
npm install
npm run dev
```

Open http://localhost:5173 — `VITE_UCP_API_URL` defaults to `http://127.0.0.1:8000`.

---

## Key separation (important)

| Key | Where |
| --- | --- |
| `VITE_SUPABASE_ANON_KEY` | Frontend only (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend / Railway only |
| `gk_mcp_*` | Issued by `/v1/connect/client` for Codex |

Never put `service_role` in `VITE_*` or commit it to git.
