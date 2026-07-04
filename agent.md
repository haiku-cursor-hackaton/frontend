# Guía para agentes — genko frontend

Instrucciones para asistentes de IA (Cursor, Codex, etc.) que trabajen en este repositorio.

## Qué es este proyecto

Frontend de **genko** — app unificada **Cliente + Comercio** sobre **UCP (Universal Commerce Protocol)** `2026-04-08`. Demuestra comercio **agéntico**: usuarios conectan agentes IA (Claude, Codex, Gemini) vía MCP para buscar y comprar en comercios.

**Stack:** Vite · React 18 · TypeScript · Tailwind v4 · React Router · Supabase Auth (opcional) · TanStack Query (instalado, pendiente de uso).

**Estado:** la UI está montada; los datos vienen de `src/data/mock.ts`. El backend UCP (`VITE_UCP_API_URL`) aún no está conectado.

---

## Antes de tocar código

1. Lee [`docs/como-funciona-el-proyecto.md`](docs/como-funciona-el-proyecto.md) para contexto de negocio.
2. Para protocolo UCP: [`docs/conceptos-ucp.md`](docs/conceptos-ucp.md) o [`contexto.md`](contexto.md).
3. Para integración técnica: [`docs/arquitectura-tecnica.md`](docs/arquitectura-tecnica.md).

---

## Reglas de implementación

### Alcance

- Cambios **mínimos y enfocados**. No refactorizar ni añadir abstracciones no pedidas.
- No crear commits, PRs ni archivos de documentación extra salvo que el usuario lo pida.
- No commitear `.env`, secretos ni `node_modules` / `dist`.

### Dominio UCP

- Importes siempre en **unidades menores**: `2500` = $25.00 USD. Usar `formatMoney()` de `src/lib/money.ts` para mostrar.
- Fechas en **RFC 3339** (`2026-07-04T10:20:00Z`). Usar `formatDateTime()` / `formatDate()`.
- Tipos de dominio en `src/types/ucp.ts`. Extender ahí antes de inventar tipos ad hoc en páginas.
- Nuevos datos de ejemplo → `src/data/mock.ts`, alineados a esos tipos.

### UI y estilos

Seguir `.cursor/rules/elevenlabs-design-system.mdc`:

- Tokens CSS de `src/index.css` (`var(--color-*)`). **Nunca** colores hex hardcodeados en componentes.
- Reutilizar primitivos de `src/components/ui.tsx`: `Card`, `Button`, `Badge`, `Stat`, `Input`, `Field`, `Toggle`, `SectionTitle`.
- Acciones primarias: negro (`--color-brand-strong`). Sin gradientes decorativos.
- Texto en español en la UI (el proyecto ya está en español).

### Rutas y auth

| Ruta | Página | Notas |
|------|--------|-------|
| `/login` | `Login` | Pública |
| `/` | `Dashboard` | Vista cliente/comercio con toggle local |
| `/perfil` | `Perfil` | Datos facturación + conexión MCP |
| `/comercio` | `Comercio` | Panel merchant |
| `/historial` | `Historial` | Tabla `AgenticEvent` |
| `/agente` | `Agente` | Wizard MCP |

- Rutas protegidas viven bajo `ProtectedRoute` + `Layout` en `src/App.tsx`.
- Auth: `useAuth()` de `src/auth/AuthContext.tsx`. Sin Supabase configurado → **modo demo** (`localStorage` key `genko.demoUser`).

### Datos y API

- **Hoy:** importar desde `@/data/mock`.
- **Futuro:** hooks con TanStack Query contra `VITE_UCP_API_URL`. Crear cliente en `src/lib/` si se pide conectar backend.
- No asumir que botones "Vincular", "Guardar", "Copiar" persisten — muchos son UI placeholder.

### Imports

Alias `@/` → `src/` (configurado en Vite/TS).

```ts
import { formatMoney } from "@/lib/money";
import type { AgenticEvent } from "@/types/ucp";
import { agenticEvents } from "@/data/mock";
```

---

## Estructura del código

```
src/
  App.tsx              # Router
  auth/                # AuthContext, ProtectedRoute
  components/          # Layout, ui.tsx
  data/mock.ts         # Datos mock (reemplazar por API)
  lib/                 # supabase.ts, money.ts
  pages/               # Una página por ruta
  types/ucp.ts         # Contrato de dominio UCP
```

---

## Tareas frecuentes

### Añadir una métrica al Dashboard

1. Tipo en `ucp.ts` si hace falta.
2. Dato en `mock.ts`.
3. Mostrar con `Stat` o `Card` en `Dashboard.tsx`.
4. Respetar el toggle `role === "cliente" | "comercio"`.

### Añadir un evento al historial

Extender `agenticEvents` en `mock.ts` con un `AgenticEvent` válido (`action`, `transport`, `result`, etc.).

### Conectar endpoint real

1. `src/lib/ucp-api.ts` — fetch wrapper con `VITE_UCP_API_URL`.
2. Hook `useQuery` en `src/hooks/` o junto a la página.
3. Sustituir import de mock en la página correspondiente.
4. Mantener tipos de `ucp.ts` como contrato.

### Nueva página

1. Componente en `src/pages/`.
2. Ruta en `App.tsx` dentro del bloque `ProtectedRoute`.
3. Entrada en `NAV` de `src/components/Layout.tsx`.

---

## Comandos

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # verificar tipos
npm run build        # producción
```

Modo demo: no configurar `.env` o dejar placeholders `YOUR_PROJECT` / `YOUR_ANON_KEY`.

---

## Qué NO está en este repo

- Backend UCP / servidor MCP de genko.
- Paquete `@genko/commerce-sdk` (solo referenciado en UI).
- Payment handler real.
- Separación de roles cliente/comercio en auth.

No inventar implementaciones de backend aquí salvo que el usuario lo solicite explícitamente.

---

## Checklist antes de terminar

- [ ] `npm run typecheck` pasa.
- [ ] Sin colores hex nuevos en TSX; tokens del design system.
- [ ] Montos en unidades menores; display con `formatMoney`.
- [ ] Textos de UI en español, tono consistente con páginas existentes.
- [ ] Cambio acotado al archivo/ruta pedida.

---

## Referencias rápidas

| Tema | Archivo |
|------|---------|
| Especificación UCP larga | `contexto.md` |
| Docs del proyecto | `docs/README.md` |
| Design system | `.cursor/rules/elevenlabs-design-system.mdc` |
| Tipos UCP | `src/types/ucp.ts` |
| Mock data | `src/data/mock.ts` |
| Env vars | `.env.example` |
