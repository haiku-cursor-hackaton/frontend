# Deploy on Railway (portal + platform)

Both services live in the **lithe** Railway project.

| Service | URL |
| --- | --- |
| **genko-portal** (this repo) | `https://genko-portal-production.up.railway.app` |
| **genko-platform** (backend) | `https://genko-platform-production.up.railway.app` |

---

## 1. Frontend service (`genko-portal`)

Connect repo `haiku-cursor-hackaton/frontend` or deploy from CLI:

```powershell
cd frontend
railway link -p lithe -e production
railway service genko-portal   # after creating the service once
railway up
```

**Variables** (Railway → genko-portal → Variables):

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://kfutwosjsossgqhnhjor.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → API → **anon public** |
| `VITE_UCP_API_URL` | `https://genko-platform-production.up.railway.app` |
| `VITE_MCP_URL` | `https://genko-platform-production.up.railway.app/mcp` |

Redeploy after changing any `VITE_*` (baked in at Docker build time).

---

## 2. Backend service (`genko-platform`)

**Variables** (Railway → genko-platform → Variables):

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | `https://kfutwosjsossgqhnhjor.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → API → **service_role** |
| `PUBLIC_BASE_URL` | `https://genko-platform-production.up.railway.app` |
| `MCP_PATH` | `/mcp` |
| `ENVIRONMENT` | `production` |
| `CORS_ORIGINS` | `https://genko-portal-production.up.railway.app` |

No quotes. Redeploy after env changes.

### Verify CORS

```powershell
curl.exe -i -X OPTIONS "https://genko-platform-production.up.railway.app/v1/connect/client" `
  -H "Origin: https://genko-portal-production.up.railway.app" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Expect `200` + `access-control-allow-origin: https://genko-portal-production.up.railway.app`.

---

## 3. Local dev

```powershell
# Terminal 1 — genko-backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cp .env.example .env
npm install
npm run dev
```

---

## Keys

| Key | Service |
| --- | --- |
| `VITE_SUPABASE_ANON_KEY` | genko-portal only (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | genko-platform only |
| `gk_mcp_*` | Issued by `/v1/connect/client` for Codex |

Never put `service_role` in `VITE_*`.
