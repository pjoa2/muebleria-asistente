# Asistente de Ventas — Mueblería

App de IA para asesorar ventas de muebles: carga catálogos de proveedores en PDF, consulta al asistente y analiza habitaciones con foto.

## Despliegue rápido

1. Sube este repo a GitHub
2. Conecta en [netlify.com](https://netlify.com) → "Add new site" → "Import from Git"
3. Build command: `npm run build` · Publish directory: `dist`
4. Deploy

## Desarrollo local

```bash
npm install
npm run dev
```

## Tecnología

- React 18 + Vite
- Claude API (Anthropic) — asistente conversacional y análisis de imágenes
- PDF.js — extracción de texto de catálogos PDF en el navegador
- Sin backend, todo en el cliente
