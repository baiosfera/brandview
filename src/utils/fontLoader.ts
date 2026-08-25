// Utilidad robusta para cargar fuentes en caliente (Envato y Google Fonts)

const loadedFonts = new Set<string>();

export async function loadFontDynamically(fontIdentifier: string): Promise<string> {
  if (!fontIdentifier) return 'system-ui';

  const cleanName = fontIdentifier.replace(/\.(otf|ttf|woff|woff2)$/i, '').replace(/[\s\—\-\:\;\,\.]+$/g, '').trim();

  if (loadedFonts.has(cleanName)) {
    return cleanName;
  }

  // 1. Intentar cargar desde el catálogo local de Envato (_extracted)
  try {
    const url = `/api/fonts/envato/${encodeURIComponent(fontIdentifier)}`;
    const fontFace = new FontFace(cleanName, `url("${url}")`);
    const loaded = await fontFace.load();
    document.fonts.add(loaded);
    loadedFonts.add(cleanName);
    console.log(`[FontLoader] Fuente Envato cargada con éxito: "${cleanName}"`);
    return cleanName;
  } catch {}

  // 2. Si falló con el identificador original, intentar con el nombre limpio
  if (cleanName !== fontIdentifier) {
    try {
      const url = `/api/fonts/envato/${encodeURIComponent(cleanName)}`;
      const fontFace = new FontFace(cleanName, `url("${url}")`);
      const loaded = await fontFace.load();
      document.fonts.add(loaded);
      loadedFonts.add(cleanName);
      console.log(`[FontLoader] Fuente Envato cargada con éxito: "${cleanName}"`);
      return cleanName;
    } catch {}
  }

  // 3. Fallback a Google Fonts API v2
  try {
    const familyQuery = cleanName.replace(/ /g, '+');
    const linkId = `gfont-${familyQuery}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${familyQuery}:ital,wght@0,100..900;1,100..900&display=swap`;
      document.head.appendChild(link);
    }
    await document.fonts.load(`16px "${cleanName}"`);
    loadedFonts.add(cleanName);
    console.log(`[FontLoader] Google Font cargada: "${cleanName}"`);
    return cleanName;
  } catch (err) {
    console.warn(`[FontLoader] Fallback para "${cleanName}":`, err);
  }

  return cleanName;
}
