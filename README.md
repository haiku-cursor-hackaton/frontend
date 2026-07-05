# frontend

Frontend de **genko** — una app unificada (Cliente + Comercio) sobre **UCP (Universal Commerce Protocol)**.

## Stack

- **Vite + React + TypeScript**
- **Tailwind CSS v4**
- **React Router** (rutas protegidas)
- **Supabase** para autenticación (con _modo demo_ si aún no hay credenciales)
- **TanStack Query** (listo para conectar el backend UCP)

## Requisitos

- Node.js 20+ (probado con 22)

## Puesta en marcha

```bash
npm install
cp .env.example .env   # pega VITE_SUPABASE_ANON_KEY desde Supabase Dashboard
npm run dev
```

Abre http://localhost:5173.

Backend local en otra terminal (`genko-backend`): `uvicorn app.main:app --reload --port 8000`.

**Deploy (Netlify + Railway):** ver [`DEPLOY.md`](DEPLOY.md).

> **Modo demo:** si no configuras `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`,
> el login acepta cualquier email + contraseña (4+ caracteres) para poder
> explorar la app sin backend.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — typecheck + build de producción
- `npm run preview` — sirve el build
- `npm run typecheck` — solo chequeo de tipos

## Estructura

```
src/
  auth/         # AuthContext (Supabase / demo) + ProtectedRoute
  components/   # Layout (shell) y primitivos de UI
  data/         # datos mock alineados a UCP
  lib/          # supabase, helpers de dinero/fechas
  pages/        # Login, Dashboard, Perfil, Comercio, Historial, Agente
  types/        # tipos UCP (Product, Checkout, Order, AgenticEvent, ...)
```

## Notas de dominio (UCP)

- Los importes se manejan en **unidades menores**: `2500` = `$25.00` (ver `src/lib/money.ts`).
- Fechas en formato **RFC 3339**.
- Tipos derivados de la especificación UCP `2026-04-08` (catalog, cart, checkout, order).

El backend UCP está en desarrollo; mientras tanto la UI consume `src/data/mock.ts`.
Al conectar el backend, reemplaza esos accesos por llamadas vía TanStack Query a
`VITE_UCP_API_URL`.
