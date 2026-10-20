// Utilidad robusta para cargar fuentes en caliente (Envato y Google Fonts)

const loadedFonts = new Set<string>();

export async function loadFontDynamically(fontIdentifier: string, customUrl?: string): Promise<string> {
  if (!fontIdentifier) return 'system-ui';

  const cleanName = fontIdentifier
    .replace(/\.(otf|ttf|woff|woff2)$/i, '')
    .replace(/[\s\—\-\:\;\,\.]+$/g, '')
    .trim();

  if (loadedFonts.has(cleanName)) {
    return cleanName;
  }

  // 1. Si viene una URL específica de Google Fonts v2 o directa
  if (customUrl && typeof customUrl === 'string' && customUrl.startsWith('http')) {
    try {
      const linkId = `custom-font-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = customUrl;
        document.head.appendChild(link);
      }
      await document.fonts.load(`16px "${cleanName}"`);
      loadedFonts.add(cleanName);
      console.log(`[FontLoader] Fuente cargada desde custom URL: "${cleanName}"`);
      return cleanName;
    } catch (e) {
      console.warn(`[FontLoader] Fallo con custom URL para "${cleanName}":`, e);
    }
  }

  // 2. Intentar cargar desde el catálogo local de Envato (/api/fonts/envato/:fontName)
  try {
    const url = `/api/fonts/envato/${encodeURIComponent(cleanName)}`;
    const fontFace = new FontFace(cleanName, `url("${url}")`);
    const loaded = await fontFace.load();
    document.fonts.add(loaded);
    loadedFonts.add(cleanName);
    console.log(`[FontLoader] Fuente Envato cargada con éxito: "${cleanName}"`);
    return cleanName;
  } catch {}

  // Intento 2b con fontIdentifier original
  if (cleanName !== fontIdentifier) {
    try {
      const url = `/api/fonts/envato/${encodeURIComponent(fontIdentifier)}`;
      const fontFace = new FontFace(cleanName, `url("${url}")`);
      const loaded = await fontFace.load();
      document.fonts.add(loaded);
      loadedFonts.add(cleanName);
      console.log(`[FontLoader] Fuente Envato cargada con éxito: "${cleanName}"`);
      return cleanName;
    } catch {}
  }

  // 3. Google Fonts API v2 - Consulta resiliente universal
  try {
    const familyQuery = encodeURIComponent(cleanName).replace(/%20/g, '+');
    const linkId = `gfont-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${familyQuery}&display=swap`;
      document.head.appendChild(link);
    }
    await document.fonts.load(`16px "${cleanName}"`);
    loadedFonts.add(cleanName);
    console.log(`[FontLoader] Google Font cargada: "${cleanName}"`);
    return cleanName;
  } catch (err) {
    console.warn(`[FontLoader] Error en Google Fonts para "${cleanName}":`, err);
  }

  return cleanName;
}
