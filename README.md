# 🎨 Brandview — SOTA Brand Identity Workbench & DTCG Master Compiler

`brandview` es el Centro de Control y Workbench interactivo para la previsualización paramétrica a 60fps, edición tipográfica con ligaduras OpenType y Stylistic Sets avanzados, modelado de geometría sagrada, auditoría cromática dual en vivo (WCAG 2.2 AAA + APCA Lc) y compilación de tokens W3C DTCG en Zerops.

---

## 🚀 Pila Tecnológica
- **Runtime:** Bun 1.3.9 en Zerops Incus LXC
- **Backend:** Hono v4 + WebSockets (`Bun.serve`) + Fast JSON Patch (RFC 6902) + @resvg/resvg-js + Sharp + Inkscape CLI
- **Frontend:** SolidJS 2.0 + Vite 6 + Tailwind CSS v4 + Web Audio API (Síntesis ADSR) + colorjs.io
- **Almacenamiento:** Montaje persistente de Zerops Local Storage en `/mnt/localstorage/` con soporte multi-raíz dinámico y fallback a Google Drive

---

## 🏛️ Invariantes de Dominio y Aprendizajes Críticos

Este repositorio implementa soluciones definitivas a los siguientes desafíos arquitectónicos:

### 1. Motor Tipográfico OpenType (`ss01`–`ss09`, Swashes & PUA)
Muchas fuentes premium de autor (como *Kalieb Luxury*, *Biancha*, *Sagora Glamour*) alojan sus mayúsculas ornamentales y florituras en **Stylistic Sets (`ss01`, `ss02`, etc.)** y en el rango **PUA (Private Use Area: `U+E001` - `U+F8FF`)**, no en las ligaduras comunes (`liga`).

- **Base de datos de metadatos:** `server/fonts_features.json` contiene el mapeo exacto de tablas GSUB, sustituciones y glifos PUA de todas las fuentes extraídas.
- **Extractor automatizado:** Cualquier fuente nueva añadida se cataloga ejecutando:
  ```bash
  python3 scripts/extract_font_features.py
  ```
- **Inyección CSS calculada:** `computeFontFeatureSettings` inyecta automáticamente `"ss01" 1, "ss02" 1, "ss03" 1, "swsh" 1, "salt" 1, "liga" 1, "dlig" 1` al activar ligaduras y adornos.
- **Paleta PUA interactiva:** La UI dispone de un cajón de glifos que permite hacer clic sobre cualquier ornamento para insertarlo directamente en el texto.

### 2. Jerarquía Tridimensional No-Destructiva (Bloque $\leftrightarrow$ Palabra $\leftrightarrow$ Letra)
La edición de textos opera bajo un modelo de herencia en cascada:
- **Nivel Bloque:** Define el estilo global del contenedor (H1, H2, Slogan, Logo).
- **Nivel Palabra:** Permite sobreescribir estilos de una palabra concreta sin romper los estilos del bloque.
- **Nivel Letra:** Permite ajustar una letra individual (rotación, escala, color, ornamento) heredando de la palabra y del bloque.
Cambiar de un modo a otro **nunca** resetea ni corrompe el trabajo realizado en otros niveles.

### 3. Arrastre y Sliders Libres de Bloqueos (Deadlock-Free Pointers)
Todos los controles de arrastre de lienzo y deslizadores numéricos usan captura global de puntero (`window.addEventListener('pointerup', ..., { once: true })`) y control por umbral de movimiento (`wasDragged`), evitando que el cursor quede atrapado en estado de arrastre tras un clic.

### 4. Fuentes de `fontgen` y Carga Dinámica de Google Fonts
- Las tipografías recomendadas en `font_manifest.json` (`candidate_ecosystems`) se posicionan de forma prioritaria en el selector.
- Cualquier fuente del catálogo de Google Fonts puede cargarse al instante escribiendo su nombre en el input `+ Cargar Google Font`.

---

## 🛠️ Comandos de Desarrollo
```bash
# Instalar dependencias
bun install

# Extraer metadatos OpenType de fuentes instaladas
python3 scripts/extract_font_features.py

# Ejecutar servidor de desarrollo con Vite HMR
bun run dev

# Compilar frontend para producción
bun run build

# Iniciar servidor unificado (Hono + WebSockets + Servidor estático)
bun run start
```
