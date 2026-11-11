# GameVerse 307 — Backend & Stack $0/mes

Motor central en Node.js (Express + Telegraf + Supabase) para **GameVerse 307** (`gameverse307.pages.dev` / futuro `gameverse307.com`).

## Despliegue rápido ($0/mes)
1. **Base de datos (Supabase Free):** Ejecuta [`supabase/schema.sql`](../supabase/schema.sql) en el SQL Editor (incluye tablas, RPCs y el bote inicial de $10.00 USDT).
2. **Bot (@BotFather):** Crea el bot y copia el `TELEGRAM_BOT_TOKEN`.
3. **Backend (Render o Koyeb Free):**
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
   - Variables de entorno (ver `.env.example`): `TELEGRAM_BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WEBAPP_URL=https://gameverse307.pages.dev`, `NODE_ENV=production`.
4. **Frontend (Cloudflare Pages Free):** Despliega la raíz del repositorio y pega tu URL de backend (`/api`) y tu `Zone ID` de Monetag en los `<meta>` de `index.html`.
