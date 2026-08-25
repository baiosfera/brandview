# 🎨 Brandview — SOTA Brand Identity Workbench & DTCG Master Compiler

`brandview` es el Centro de Control y Workbench interactivo para la previsualización paramétrica a 60fps, edición tipográfica con ligaduras OpenType, modelado de geometría sagrada, auditoría cromática dual en vivo (WCAG 2.2 AAA + APCA Lc) y compilación de tokens W3C DTCG en Zerops.

## 🚀 Pila Tecnológica
- **Runtime:** Bun 1.3.9 en Zerops LXC
- **Backend:** Hono v4 + WebSockets (`Bun.serve`) + Fast JSON Patch (RFC 6902) + @resvg/resvg-js + Sharp + Inkscape CLI
- **Frontend:** SolidJS 2.0 + Vite 6 + Tailwind CSS v4 + Web Audio API (Síntesis ADSR) + colorjs.io
- **Almacenamiento:** Montaje persistente de SeaweedFS `baiostorage` (`/mnt/baiostorage/`)

## 🛠️ Comandos de Desarrollo
```bash
# Instalar dependencias
bun install

# Ejecutar servidor de desarrollo
bun run dev

# Compilar frontend
bun run build

# Iniciar servidor de producción
bun run start
```
