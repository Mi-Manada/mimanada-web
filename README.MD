# MiManada Web

Frontend de MiManada con Next.js (App Router), TypeScript y Tailwind CSS.

## Requisitos

- Node.js 20+
- npm

## Setup

Desde la raíz del monorepo (`MiManada`):

```bash
npm run setup   # primera vez
npm run dev     # DB + API + Web
```

O solo este frontend:

```bash
cp .env.example .env.local
npm install
npm run dev
```

La app corre en [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | URL base de la API (HTTPS en producción) | `https://tu-api.up.railway.app` |

En Vercel, define `NEXT_PUBLIC_API_URL` apuntando a tu API pública en **HTTPS** y vuelve a desplegar. Las fotos (`/uploads/...`) se sirven vía rewrite del mismo dominio para evitar mixed content.

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run start` — servir build
- `npm run lint` — ESLint 
