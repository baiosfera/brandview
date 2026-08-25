# Brandview — Brand Identity Workbench & DTCG Master Compiler

## Descripción
`brandview` es el Workbench y Centro de Control interactivo para previsualización, edición en vivo a 60fps, auditoría de accesibilidad y compilación de manuales de marca (W3C DTCG) sobre Zerops.

## Pila Tecnológica
- **Runtime:** Bun 1.3.9 en Zerops LXC
- **Backend:** Hono v4 + WebSockets nativos (`Bun.serve`) + Fast JSON Patch (RFC 6902) + Style Dictionary v4 + @resvg/resvg-js + Inkscape CLI
- **Frontend:** SolidJS 2.0 + Vite 6 + Tailwind CSS v4 (@theme en OKLCH) + Web Audio API (ADSR) + colorjs.io (WCAG 2.2 AAA + APCA Lc)
- **Almacenamiento:** Montaje persistente de `baiostorage` en `/mnt/baiostorage/`

## Rutas y Archivos Clave
- Clientes y Diagnósticos: `/mnt/baiostorage/baiosfera/ASTROLOGÍA/DIAG/[MARCA]/`
- Fuentes de Autor Envato: `/mnt/baiostorage/baiosfera/FUENTES/ENVATO/` (auto-extracción en `_extracted/`)
- Backend Entrypoint: `server/index.ts`
- Frontend Entrypoint: `src/index.tsx`

## Comandos de Desarrollo
- Instalar dependencias: `bun install`
- Compilar frontend: `bun run build`
- Iniciar servidor unificado: `bun run server/index.ts`
- Modo desarrollo: `bun run dev`
