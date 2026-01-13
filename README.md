# app-be-card

Dashboard web de BeCard (React + TypeScript + Vite).

## Requisitos
- Node.js 20+

## Configuración
- Copiar `.env.example` → `.env` (solo para desarrollo).
- `VITE_API_BASE_URL` (opcional):
  - Si no se define en producción, el frontend usa API relativa: `/api/v1`.

## Comandos
```bash
npm install
npm run dev
npm run check
npm test
npm run build
npm run preview
```

## Deploy
Incluye `Dockerfile` y `nginx.conf` para servir `dist/` y proxyear `/api/v1` a la API en un stack Docker Compose.
