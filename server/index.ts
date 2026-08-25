import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { applyPatch, type Operation } from 'fast-json-patch';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, openSync, fsyncSync, closeSync, renameSync, unlinkSync, statSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

// Resolver raíces de almacenamiento SSoT con múltiples rutas de fallback
function resolveBrandsRoot(): string {
  const candidates = [
    process.env.BRANDS_SSOT_ROOT,
    '/mnt/baiostorage/DIAG',
    '/mnt/baiostorage/baiosfera/ASTROLOGÍA/DIAG',
    '/var/www/baiosfera/ASTROLOGÍA/DIAG'
  ];
  for (const c of candidates) {
    if (c && existsSync(c)) return c;
  }
  return '/mnt/baiostorage/DIAG';
}

function resolveFontsRoot(): string {
  const candidates = [
    process.env.ENVATO_FONTS_ROOT,
    '/mnt/baiostorage/FUENTES/ENVATO',
    '/mnt/baiostorage/baiosfera/FUENTES/ENVATO',
    '/var/www/baiosfera/FUENTES/ENVATO'
  ];
  for (const c of candidates) {
    if (c && existsSync(c)) return c;
  }
  return '/mnt/baiostorage/FUENTES/ENVATO';
}

const BRANDS_ROOT = resolveBrandsRoot();
const FONTS_ROOT = resolveFontsRoot();
const EXTRACTED_FONTS = join(FONTS_ROOT, '_extracted');

if (!existsSync(EXTRACTED_FONTS)) {
  try { mkdirSync(EXTRACTED_FONTS, { recursive: true }); } catch {}
}

const app = new Hono();

// Memoria viva de estados por marca y temporizadores de persistencia atómica
const brandStateCache = new Map<string, Record<string, any>>();
const writeDebouncers = new Map<string, Timer>();

function saveJsonAtomic(filePath: string, data: any) {
  const tmpPath = `${filePath}.tmp.${randomUUID()}`;
  try {
    writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    const fd = openSync(tmpPath, 'r+');
    fsyncSync(fd);
    closeSync(fd);
    renameSync(tmpPath, filePath);
  } catch (err) {
    try { unlinkSync(tmpPath); } catch {}
    console.error(`[AtomicSave Error] Fallo al guardar ${filePath}:`, err);
  }
}

// Extractor automático de archivos ZIP de fuentes Envato
async function extractAllZipFonts(): Promise<string[]> {
  const extractedDirs = [
    '/var/www/baiosfera/FUENTES/ENVATO/_extracted',
    '/mnt/baiostorage/FUENTES/ENVATO/_extracted'
  ];

  for (const ed of extractedDirs) {
    if (!existsSync(ed)) {
      try { mkdirSync(ed, { recursive: true }); } catch {}
    }
  }

  const sourceRoots = [
    '/var/www/baiosfera/FUENTES/ENVATO',
    '/mnt/baiostorage/FUENTES/ENVATO',
    resolveFontsRoot()
  ].filter(r => existsSync(r));

  // Sincronizar todos los zips entre storage y local
  const allZips = new Set<string>();
  for (const sRoot of sourceRoots) {
    try {
      const files = readdirSync(sRoot);
      for (const file of files) {
        if (file.toLowerCase().endsWith('.zip')) {
          allZips.add(join(sRoot, file));
          // Copiar a baiostorage si no existe allí
          const storageZip = join('/mnt/baiostorage/FUENTES/ENVATO', file);
          if (!existsSync(storageZip) && existsSync('/mnt/baiostorage/FUENTES/ENVATO')) {
            try { copyFileSync(join(sRoot, file), storageZip); } catch {}
          }
        }
      }
    } catch {}
  }

  for (const zipPath of allZips) {
    for (const ed of extractedDirs) {
      try {
        const proc = Bun.spawn(['unzip', '-o', '-q', zipPath, '-d', ed], {
          stdout: 'ignore',
          stderr: 'ignore'
        });
        await proc.exited;
      } catch (e) {
        console.warn(`[ZipExtract] Error extrayendo ${zipPath}:`, e);
      }
    }
  }

  return scanExtractedFonts();
}

function scanExtractedFonts(): string[] {
  const scanDirs = [
    '/var/www/baiosfera/FUENTES/ENVATO/_extracted',
    '/mnt/baiostorage/FUENTES/ENVATO/_extracted',
    '/var/www/baiosfera/FUENTES/ENVATO',
    '/mnt/baiostorage/FUENTES/ENVATO',
    join(resolveFontsRoot(), '_extracted')
  ];

  function scanDir(dir: string): string[] {
    let results: string[] = [];
    if (!existsSync(dir)) return results;
    try {
      const list = readdirSync(dir, { withFileTypes: true });
      for (const item of list) {
        const full = join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('__MACOSX')) {
          results = results.concat(scanDir(full));
        } else if (/\.(otf|ttf|woff|woff2)$/i.test(item.name)) {
          results.push(item.name);
        }
      }
    } catch {}
    return results;
  }

  const all = scanDirs.flatMap(d => scanDir(d));
  return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b));
}

// Parser inteligente de reportes Markdown de fontgen con extracción estricta de nombres y URLs
function parseFontToken(line: string): { name: string; url?: string; source: string } {
  if (!line) return { name: 'Plus Jakarta Sans', source: 'google_fonts' };
  
  // 1. Extraer URL limpia si existe
  const urlMatch = line.match(/https?:\/\/[^\s\)\'\"]+/i);
  const url = urlMatch ? urlMatch[0].replace(/[\)\.\,\"\']+$/, '') : undefined;

  // 2. Extraer la porción después del descriptor del Token
  let afterDescriptor = line;
  const colonIdx = line.indexOf(':');
  if (colonIdx !== -1) {
    const tokenMatch = line.match(/Token[^\:]*:\s*/i);
    if (tokenMatch && tokenMatch.index !== undefined) {
      afterDescriptor = line.substring(tokenMatch.index + tokenMatch[0].length);
    } else {
      afterDescriptor = line.substring(colonIdx + 1);
    }
  }

  // 3. Limpiar markdown links [Texto](url), URLs directas, backticks y caracteres de formato
  let clean = afterDescriptor
    .replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1')
    .replace(/https?:\/\/[^\s\)\'\"]+/g, '')
    .replace(/—\s*Fuente[^\n]*/i, '')
    .replace(/–\s*Fuente[^\n]*/i, '')
    .replace(/Fuente[^\n]*/i, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[\*\_\(\)\[\]]/g, ' ')
    .trim();

  // Si tiene separadores como "—", "–" o " - "
  clean = clean.split('—')[0].split('–')[0].split(' - ')[0].trim();

  // Eliminar palabras residuales como "Token", "Display", "Acento", "UI", etc.
  clean = clean
    .replace(/^(Token|Primario|Secundario|Acento|Display|UI|Autoridad|Fricción Cero|Brand Voice|Lectura)\s*[:\/\-]?\s*/gi, '')
    .replace(/\s*(Token|Primario|Secundario|Acento|Display|UI)\s*$/gi, '')
    .replace(/[\s\—\-\–\:\;\,\.]+$/g, '')
    .trim();

  if (!clean || clean.length < 2) clean = 'Plus Jakarta Sans';

  const isGoogle = url?.includes('google') || [
    'Plus Jakarta Sans', 'Inter', 'Space Grotesk', 'Urbanist', 'Manrope', 
    'Host Grotesk', 'Hanken Grotesk', 'Playfair Display', 'Cinzel', 'Montserrat'
  ].includes(clean);

  const source = url?.includes('envato') ? 'envato' : isGoogle ? 'google_fonts' : 'envato';
  return { name: clean, url, source };
}

function parseFontgenMarkdown(content: string) {
  const ecoRegex = /### Ecosistema\s*(\d+)[:\s]+([^\n]+)([\s\S]*?)(?=(?:### Ecosistema|\$|---|$))/gi;
  let match;
  const ecos = [];
  while ((match = ecoRegex.exec(content)) !== null) {
    const num = match[1];
    const title = match[2].trim();
    const body = match[3];

    const archetypeMatch = body.match(/\*\*Arquetipo[^\:]*:\s*\*?\*?([^\n\-\[\*]+)/i) ||
                           body.match(/Arquetipo[^\:]*:\s*\*?\*?([^\n\-\[\*]+)/i);
    const primaryLine = body.match(/Token Primario[^\n]+/i)?.[0] || '';
    const secondaryLine = body.match(/Token Secundario[^\n]+/i)?.[0] || '';
    const accentLine = body.match(/Token de Acento[^\n]+/i)?.[0] || '';
    const rationaleMatch = body.match(/Justificación[^\:]*:\s*\*?\*?([^\n\-\[\*]+)/i) ||
                           body.match(/Métricas Relacionales[^\:]*:\s*\*?\*?([^\n\-\[\*]+)/i);

    const primary = parseFontToken(primaryLine);
    const secondary = parseFontToken(secondaryLine);
    const accent = parseFontToken(accentLine);

    // Herencia funcional estricta de 6 capas
    const logoInherit = body.match(/Logo[^\n:]*:\s*([^\n]+)/i)?.[1] || '';
    const sloganInherit = body.match(/Slogan[^\n:]*:\s*([^\n]+)/i)?.[1] || '';

    const cleanNameOnly = (s: string) => s.replace(/[\s\—\-\:\;\,\.]+$/g, '').trim();

    ecos.push({
      id: `eco-${num}`,
      name: title,
      archetype: archetypeMatch ? archetypeMatch[1].trim() : 'Ecosistema de Marca',
      rationale: rationaleMatch ? rationaleMatch[1].trim() : 'Combinación armónica de alta legibilidad y distinción.',
      tokens: {
        display_primary: { $value: cleanNameOnly(primary.name), url: primary.url, source: primary.source },
        ui_secondary: { $value: cleanNameOnly(secondary.name), url: secondary.url, source: secondary.source },
        accent_brand: { $value: cleanNameOnly(accent.name), url: accent.url, source: accent.source }
      },
      layers: {
        logo: cleanNameOnly(logoInherit.toLowerCase().includes('acento') || logoInherit.toLowerCase().includes('accent') || logoInherit.includes(accent.name) ? accent.name : (primary.name || accent.name)),
        slogan: cleanNameOnly(sloganInherit.toLowerCase().includes('primario') || sloganInherit.toLowerCase().includes('primary') || sloganInherit.includes(primary.name) ? primary.name : (accent.name || primary.name)),
        h1: cleanNameOnly(primary.name),
        h2: cleanNameOnly(primary.name),
        body: cleanNameOnly(secondary.name),
        ui: cleanNameOnly(secondary.name)
      }
    });
  }
  return ecos;
}

// 1. Healthcheck
app.get('/api/health', (c) => c.json({ 
  status: 'ok', 
  uptime: process.uptime(), 
  brandsRoot: BRANDS_ROOT,
  fontsRoot: FONTS_ROOT,
  time: new Date().toISOString() 
}));

// 2. Listar Marcas / Clientes con sus Versiones Fontgen
app.get('/api/brands', (c) => {
  const root = resolveBrandsRoot();
  if (!existsSync(root)) return c.json({ brands: [] });

  const entries = readdirSync(root, { withFileTypes: true });
  const brands = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'coach_report' && e.name !== 'raw')
    .map(e => {
      const brandDir = join(root, e.name);
      const files = readdirSync(brandDir);
      
      const fontgenVersions: string[] = [];
      for (const file of files) {
        const match = file.match(/^fontgen_(?:.*?)_(v\d+)\.md$/i);
        if (match) {
          fontgenVersions.push(match[1]);
        } else if (file.startsWith('fontgen_') && file.endsWith('.md')) {
          fontgenVersions.push('v1');
        }
      }

      const sortedVersions = Array.from(new Set(fontgenVersions)).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numB - numA;
      });

      return {
        id: e.name,
        name: e.name.replace(/_/g, ' '),
        fontgen_versions: sortedVersions,
        hasFontManifest: existsSync(join(brandDir, 'font_manifest.json')) || sortedVersions.length > 0,
        hasSymbolManifest: existsSync(join(brandDir, 'symbol_manifest.json')),
        hasChromaManifest: existsSync(join(brandDir, 'chroma_manifest.json')),
        hasKineticManifest: existsSync(join(brandDir, 'kinetic_manifest.json')),
        hasBrandbook: existsSync(join(brandDir, 'brandbook.json'))
      };
    });
  return c.json({ brands });
});

// 3. Obtener Estado de una Marca con Selección Exhaustiva de Versión
app.get('/api/brand/:name', (c) => {
  const root = resolveBrandsRoot();
  const brandName = c.req.param('name');
  const requestedVersion = c.req.query('version'); // ej: 'v43', 'v50', 'latest'
  const brandDir = join(root, brandName);

  if (!existsSync(brandDir)) {
    return c.json({ error: 'Marca no encontrada' }, 404);
  }

  const manifests = ['font_manifest', 'symbol_manifest', 'chroma_manifest', 'kinetic_manifest', 'brandbook'];
  const data: Record<string, any> = { 
    id: brandName, 
    name: brandName.replace(/_/g, ' '),
    fontgen_versions: [],
    active_version: null
  };

  for (const m of manifests) {
    const file = join(brandDir, `${m}.json`);
    if (existsSync(file)) {
      try {
        data[m] = JSON.parse(readFileSync(file, 'utf-8'));
      } catch (err) {
        data[m] = null;
      }
    } else {
      data[m] = null;
    }
  }

  // Sanitizar font_manifest para eliminar cualquier guión o prefijo residual
  if (data.font_manifest?.candidate_ecosystems) {
    const cleanFontVal = (s?: string) => {
      if (!s) return 'Plus Jakarta Sans';
      return s
        .replace(/^Token[^\:]*\:\s*/i, '')
        .replace(/^(Primario|Secundario|Acento|Display|UI|Autoridad)[^\:]*\:\s*/i, '')
        .replace(/[\s\—\-\:\;\,\.]+$/g, '')
        .trim();
    };

    for (const eco of data.font_manifest.candidate_ecosystems) {
      if (eco.tokens?.display_primary?.$value) {
        eco.tokens.display_primary.$value = cleanFontVal(eco.tokens.display_primary.$value);
      }
      if (eco.tokens?.ui_secondary?.$value) {
        eco.tokens.ui_secondary.$value = cleanFontVal(eco.tokens.ui_secondary.$value);
      }
      if (eco.tokens?.accent_brand?.$value) {
        eco.tokens.accent_brand.$value = cleanFontVal(eco.tokens.accent_brand.$value);
      }
      if (eco.layers) {
        for (const k of Object.keys(eco.layers)) {
          if (typeof eco.layers[k] === 'string') {
            eco.layers[k] = cleanFontVal(eco.layers[k]);
          }
        }
      }
    }
    if (data.font_manifest.selected_ecosystem) {
      const sel = data.font_manifest.selected_ecosystem;
      if (sel.tokens?.display_primary?.$value) sel.tokens.display_primary.$value = cleanFontVal(sel.tokens.display_primary.$value);
      if (sel.tokens?.ui_secondary?.$value) sel.tokens.ui_secondary.$value = cleanFontVal(sel.tokens.ui_secondary.$value);
      if (sel.tokens?.accent_brand?.$value) sel.tokens.accent_brand.$value = cleanFontVal(sel.tokens.accent_brand.$value);
    }
  }

  // Buscar todos los reportes fontgen_*.md
  const allFiles = readdirSync(brandDir);
  const fontgenFiles = allFiles
    .filter(f => f.startsWith('fontgen_') && f.endsWith('.md'))
    .sort((a, b) => {
      // Extraer números de versión si existen para ordenamiento numérico descendente estricto
      const numA = parseInt((a.match(/_v(\d+)\.md$/i) || [0, 0])[1] as any, 10) || 0;
      const numB = parseInt((b.match(/_v(\d+)\.md$/i) || [0, 0])[1] as any, 10) || 0;
      if (numA !== numB) return numB - numA;
      return b.localeCompare(a, undefined, { numeric: true });
    });

  if (fontgenFiles.length > 0) {
    data.fontgen_versions = fontgenFiles.map((f, idx) => {
      const vMatch = f.match(/_v(\d+)\.md$/i);
      const ver = vMatch ? `v${vMatch[1]}` : (fontgenFiles.length === 1 ? 'v1' : `v${idx + 1}`);
      return {
        filename: f,
        version: ver,
        isLatest: idx === 0
      };
    });

    // Seleccionar el archivo según versión solicitada
    let targetFile = fontgenFiles[0];
    if (requestedVersion && requestedVersion !== 'latest') {
      const found = fontgenFiles.find(f => {
        const vMatch = f.match(/_v(\d+)\.md$/i);
        if (vMatch && `v${vMatch[1]}` === requestedVersion) return true;
        return f.includes(`_${requestedVersion}.md`) || f.includes(requestedVersion);
      });
      if (found) targetFile = found;
    }

    const vMatch = targetFile.match(/_v(\d+)\.md$/i);
    data.active_version = vMatch ? `v${vMatch[1]}` : (fontgenFiles.length === 1 ? 'v1' : 'latest');

    const mdContent = readFileSync(join(brandDir, targetFile), 'utf-8');
    data.fontgen_markdown = mdContent;

    const parsedEcos = parseFontgenMarkdown(mdContent);
    if (parsedEcos.length > 0) {
      const prevSelectedId = data.font_manifest?.selected_ecosystem?.id;
      const matchedEco = parsedEcos.find(e => e.id === prevSelectedId) || parsedEcos[0];
      data.font_manifest = {
        candidate_ecosystems: parsedEcos,
        selected_ecosystem: matchedEco
      };
    }
  }

  brandStateCache.set(brandName, data);
  return c.json(data);
});

// 3b. Compilar Brandbook Master SSoT W3C DTCG
app.post('/api/brand/:name/compile-brandbook', async (c) => {
  const root = resolveBrandsRoot();
  const brandName = c.req.param('name');
  const brandDir = join(root, brandName);

  if (!existsSync(brandDir)) {
    return c.json({ error: 'Marca no encontrada' }, 404);
  }

  const fontManifestFile = join(brandDir, 'font_manifest.json');
  const symbolManifestFile = join(brandDir, 'symbol_manifest.json');
  const chromaManifestFile = join(brandDir, 'chroma_manifest.json');
  const kineticManifestFile = join(brandDir, 'kinetic_manifest.json');

  let fontM: any = existsSync(fontManifestFile) ? JSON.parse(readFileSync(fontManifestFile, 'utf-8')) : null;
  let symbolM: any = existsSync(symbolManifestFile) ? JSON.parse(readFileSync(symbolManifestFile, 'utf-8')) : null;
  let chromaM: any = existsSync(chromaManifestFile) ? JSON.parse(readFileSync(chromaManifestFile, 'utf-8')) : null;
  let kineticM: any = existsSync(kineticManifestFile) ? JSON.parse(readFileSync(kineticManifestFile, 'utf-8')) : null;

  const brandbookData = {
    "$schema": "https://www.designtokens.org/TR/2025.10/format/",
    "name": brandName.replace(/_/g, ' '),
    "version": "1.0.0",
    "description": `Design Tokens Maestros W3C DTCG para ${brandName.replace(/_/g, ' ')}`,
    "brand": {
      "name": { "$value": brandName.replace(/_/g, ' '), "$type": "string" },
      "slogan": { "$value": fontM?.candidate_ecosystems?.[0]?.rationale || "Quiet Luxury Athleisure", "$type": "string" },
      "initials": { "$value": brandName.split('_').map((w: string) => w[0]).join(''), "$type": "string" },
      "ecosystem": { "$value": fontM?.selected_ecosystem?.name || "Ecosistema Rector", "$type": "string" }
    },
    "typography": {
      "display": { "$value": fontM?.selected_ecosystem?.tokens?.display_primary?.$value || "Rising", "$type": "fontFamily" },
      "body": { "$value": fontM?.selected_ecosystem?.tokens?.ui_secondary?.$value || "Plus Jakarta Sans", "$type": "fontFamily" },
      "accent": { "$value": fontM?.selected_ecosystem?.tokens?.accent_brand?.$value || "Calestra", "$type": "fontFamily" },
      "slogan": { "$value": fontM?.selected_ecosystem?.layers?.slogan || "Rising", "$type": "fontFamily" }
    },
    "color": chromaM?.themes || {},
    "motion": kineticM?.motion_tokens || {},
    "sound": kineticM?.sound_bank || {},
    "vectors": symbolM?.vectors || {},
    "accessibility": chromaM?.accessibility_audit || {}
  };

  const brandbookJsonPath = join(brandDir, 'brandbook.json');
  writeFileSync(brandbookJsonPath, JSON.stringify(brandbookData, null, 2), 'utf-8');

  // Sincronizar en storage si aplica
  const storageDir = join('/mnt/baiostorage/DIAG', brandName);
  if (existsSync(storageDir)) {
    try {
      writeFileSync(join(storageDir, 'brandbook.json'), JSON.stringify(brandbookData, null, 2), 'utf-8');
    } catch {}
  }

  return c.json({ status: 'success', brandbook: brandbookData });
});

// 4. Listar Fuentes de Envato
app.get('/api/fonts/envato', (c) => {
  const fonts = scanExtractedFonts();
  return c.json({ fonts });
});

// 5. Extraer y Actualizar Fuentes Envato en Vivo
app.post('/api/fonts/extract', async (c) => {
  const fonts = await extractAllZipFonts();
  return c.json({ status: 'ok', count: fonts.length, fonts });
});

// 6. Servir Binario de Fuente Envato con Bun.file
app.get('/api/fonts/envato/:fontName', (c) => {
  const rawTarget = decodeURIComponent(c.req.param('fontName'));
  const normTarget = rawTarget.toLowerCase().replace(/[\s\-_]/g, '').replace(/\.(otf|ttf|woff|woff2)$/i, '');

  const searchRoots = [
    join(resolveFontsRoot(), '_extracted'),
    '/mnt/baiostorage/FUENTES/ENVATO/_extracted',
    '/var/www/baiosfera/FUENTES/ENVATO/_extracted',
    resolveFontsRoot(),
    '/mnt/baiostorage/FUENTES/ENVATO',
    '/var/www/baiosfera/FUENTES/ENVATO'
  ];
  
  function findFile(dir: string): string | null {
    if (!existsSync(dir)) return null;
    try {
      const list = readdirSync(dir, { withFileTypes: true });
      for (const item of list) {
        const full = join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('__MACOSX')) {
          const found = findFile(full);
          if (found) return found;
        } else if (/\.(otf|ttf|woff|woff2)$/i.test(item.name)) {
          const normFile = item.name.toLowerCase().replace(/[\s\-_]/g, '').replace(/\.(otf|ttf|woff|woff2)$/i, '');
          if (normFile === normTarget || normFile.startsWith(normTarget) || normTarget.startsWith(normFile) || normFile.includes(normTarget)) {
            return full;
          }
        }
      }
    } catch {}
    return null;
  }

  let filePath: string | null = null;
  for (const root of searchRoots) {
    filePath = findFile(root);
    if (filePath) break;
  }

  if (!filePath || !existsSync(filePath)) {
    return c.json({ error: 'Archivo de fuente no encontrado', target: rawTarget }, 404);
  }

  const ext = extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.otf': 'font/otf',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
  };

  const bunFile = Bun.file(filePath);
  return new Response(bunFile, {
    headers: {
      'Content-Type': mimeTypes[ext] || 'font/otf',
      'Content-Length': bunFile.size.toString(),
      'Cache-Control': 'public, max-age=31536000',
      'Access-Control-Allow-Origin': '*'
    }
  });
});

// 7. Exportación Rasterizada Retina en Servidor (@resvg/resvg-js + sharp)
app.post('/api/export/render-svg', async (c) => {
  try {
    const body = await c.req.json();
    const { svg, scale = 2, format = 'png', width = 800 } = body;

    if (!svg) return c.json({ error: 'SVG no provisto' }, 400);

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: width * scale },
      font: { loadSystemFonts: true, defaultFontFamily: 'sans-serif' },
      shapeRendering: 2,
      textRendering: 1,
      imageRendering: 0
    });

    const pngBuffer = resvg.render().asPng();

    if (format === 'jpeg' || format === 'jpg') {
      const jpgBuffer = await sharp(pngBuffer).jpeg({ quality: 95 }).toBuffer();
      return new Response(jpgBuffer, { 
        headers: { 
          'Content-Type': 'image/jpeg',
          'Content-Disposition': 'attachment; filename="brand_asset.jpg"'
        } 
      });
    }

    return new Response(pngBuffer, { 
      headers: { 
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="brand_asset.png"'
      } 
    });
  } catch (err: any) {
    return c.json({ error: 'Error en renderizado: ' + err.message }, 500);
  }
});

// Servir frontend estático compilado en producción
app.use('/*', serveStatic({ root: './dist' }));
app.get('*', serveStatic({ path: './dist/index.html' }));

// Servidor Unificado Bun.serve con WebSockets
const server = Bun.serve({
  port: parseInt(process.env.PORT || '3000', 10),
  hostname: '0.0.0.0',
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === '/ws') {
      const brand = url.searchParams.get('brand') || 'default';
      const upgraded = server.upgrade(req, { data: { brand } });
      if (upgraded) return undefined;
    }
    return app.fetch(req);
  },
  websocket: {
    open(ws) {
      const { brand } = ws.data as { brand: string };
      ws.subscribe(`brand:${brand}`);
    },
    message(ws, message) {
      const { brand } = ws.data as { brand: string };
      try {
        const payload = JSON.parse(message.toString());
        if (payload.type === 'PATCH') {
          const patches: Operation[] = payload.patches;
          const current = brandStateCache.get(brand) || {};
          applyPatch(current, patches);
          brandStateCache.set(brand, current);

          ws.publish(`brand:${brand}`, JSON.stringify({ type: 'PATCH', patches }));

          if (writeDebouncers.has(brand)) {
            clearTimeout(writeDebouncers.get(brand)!);
          }
          const timer = setTimeout(() => {
            const root = resolveBrandsRoot();
            const brandDir = join(root, brand);
            if (!existsSync(brandDir)) mkdirSync(brandDir, { recursive: true });

            if (payload.manifestName && current[payload.manifestName]) {
              saveJsonAtomic(join(brandDir, `${payload.manifestName}.json`), current[payload.manifestName]);
            }
          }, 100);
          writeDebouncers.set(brand, timer);
        }
      } catch (e) {
        console.error('[WS Message Error]:', e);
      }
    },
    close(ws) {
      const { brand } = ws.data as { brand: string };
      ws.unsubscribe(`brand:${brand}`);
    }
  }
});

console.log(`🚀 Brandview iniciado en http://0.0.0.0:${server.port}`);
