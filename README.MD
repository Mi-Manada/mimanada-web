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
| `NEXT_PUBLIC_API_URL` | URL base de la API | `http://localhost:3001` |

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run start` — servir build
- `npm run lint` — ESLint
