# Brandview — Brand Identity Workbench & DTCG Master Compiler

## Descripción
`brandview` es el Workbench y Centro de Control interactivo para previsualización, edición en vivo a 60fps, modelado tipográfico OpenType avanzado, auditoría de accesibilidad y compilación de manuales de marca (W3C DTCG) sobre Zerops.

## Pila Tecnológica
- **Runtime:** Bun 1.3.9 en Zerops Incus LXC
- **Backend:** Hono v4 + WebSockets nativos (`Bun.serve`) + Fast JSON Patch (RFC 6902) + @resvg/resvg-js + Sharp + Inkscape CLI
- **Frontend:** SolidJS 2.0 + Vite 6 + Tailwind CSS v4 (@theme en OKLCH) + Web Audio API (ADSR) + colorjs.io (WCAG 2.2 AAA + APCA Lc)
- **Almacenamiento:** Montaje persistente Zerops Local Storage en `/mnt/localstorage/` con soporte multi-raíz dinámico y fallback a Google Drive

---

## 🏛️ Invariantes Arquitectónicos & Lecciones Críticas (SSoT)

Cualquier nuevo ZCP o agente que adopte este repositorio **DEBE** respetar los siguientes invariantes para evitar regresiones:

### 1. Motor OpenType y Adornos/Swashes (`ss01`–`ss09` + PUA)
- **Problema Descubierto:** Tipografías de autor (como *Kalieb Luxury*, *Biancha*, *Sagora Glamour*) **NO** ubican sus mayúsculas ornamentales ni florituras dentro de las ligaduras estándar (`liga` / `dlig`). Las ubican dentro de **Stylistic Sets (`ss01`, `ss02`, `ss03`, ...)** y caracteres PUA (*Private Use Area*: `U+E001` a `U+F8FF`).
- **Regla Invariable:**
  1. `computeFontFeatureSettings(style)` en `src/state.ts` debe generar `"liga" 1, "dlig" 1, "clig" 1, "calt" 1, "hlig" 1, "swsh" 1, "cswh" 1, "salt" 1, "titl" 1, "ss01" 1, "ss02" 1, "ss03" 1` cuando las ligaduras/adornos estén activos.
  2. Cada nueva tipografía agregada a Envato se analiza con `python3 scripts/extract_font_features.py` para regenerar `server/fonts_features.json`.
  3. La UI expone el selector de *Stylistic Set* y el cajón interactivo de glifos PUA para inserción directa en el texto.

### 2. Jerarquía Tridimensional de Estilos (Bloque $\leftrightarrow$ Palabra $\leftrightarrow$ Letra)
- **Problema Descubierto:** Pasar de modo bloque a palabra o letra reseteaba el formato o perdía los estilos aplicados previamente.
- **Regla Invariable:**
  - El sistema utiliza herencia tridimensional no-destructiva en `elementsStore`:
    * `cardId_element` (Nivel Bloque: tamaño base, tracking, fuente, line-height).
    * `cardId_element_word_X` (Nivel Palabra: sobreescrituras específicas sin mutar el bloque).
    * `cardId_element_letter_X` (Nivel Letra: sobreescrituras atómicas que heredan de palabra y bloque).
  - Nunca sobreescribir ni resetear niveles superiores al aplicar estilos atómicos.

### 3. Sliders y Prevención de Puntero Bloqueado (Drag & Drop)
- **Problema Descubierto:** Hacer clic en controles deslizantes o arrastrar elementos provocaba que el puntero quedara bloqueado en estado activo (`cursor-grabbing`) por pérdida del evento `mouseup`.
- **Regla Invariable:**
  - Todo evento de arrastre o slider utiliza `pointerdown` con `window.addEventListener('pointerup', ..., { once: true })` global.
  - La distinción entre clic y drag se gobierna con el flag de umbral de desplazamiento `wasDragged`.

### 4. Fuentes: Ecosistemas Fontgen + Carga Dinámica de Google Fonts
- **Problema Descubierto:** Se limitaba la interfaz a una lista fija de 10 fuentes de Google Fonts y no se destacaban las generadas por `fontgen`.
- **Regla Invariable:**
  - `fontgenFonts()` en `Step1Fonts.tsx` extrae automáticamente los candidatos de `brandData.font_manifest.candidate_ecosystems` y los lista en el grupo prioritario `★ Ecosistema Fontgen (Detectadas)`.
  - La función `loadFontDynamically(name)` permite cargar cualquier fuente del catálogo de Google Fonts en caliente sin rebuild.

### 5. Almacenamiento Persistente Multi-Raíz
- **Regla Invariable:**
  - El backend resuelve raíces mediante `getCandidateBrandRoots()` en `server/index.ts`, chequeando en orden: `/mnt/localstorage`, `/mnt/localstorage/PROYECTOS`, `/mnt/localstorage/baiosfera/PROYECTOS`, `/mnt/localstorage/baiosfera/ASTROLOGÍA/DIAG`, `/var/www/baiosfera/PROYECTOS`.
  - Las mutaciones en disco se realizan exclusivamente mediante `saveJsonAtomic()` (escritura en `.tmp` + `fsyncSync` + `renameSync`) para prevenir corrupción de manifests.

---

## Rutas y Archivos Clave
- Diagnósticos y Marcas: `/mnt/localstorage/baiosfera/ASTROLOGÍA/DIAG/[MARCA]/` o `/mnt/localstorage/PROYECTOS/[MARCA]/`
- Fuentes Envato Extraídas: `/mnt/localstorage/baiosfera/FUENTES/ENVATO/_extracted/`
- Script Extractor OpenType: `scripts/extract_font_features.py`
- Base de Datos de Features: `server/fonts_features.json`
- Backend Entrypoint: `server/index.ts`
- Frontend Entrypoint: `src/index.tsx`
- Estado Reactivo & Herencia: `src/state.ts`
- Workbench Tipográfico: `src/components/Step1Fonts.tsx`
- Panel Flotante & PUA Drawer: `src/components/FloatingPanel.tsx`

---

## Comandos de Desarrollo
```bash
# Instalar dependencias
bun install

# Extraer y catalogar features OpenType de nuevas fuentes
python3 scripts/extract_font_features.py

# Compilar frontend
bun run build

# Iniciar servidor unificado (API + WebSockets + Static)
bun run server/index.ts

# Modo desarrollo interactivo
bun run dev
```
