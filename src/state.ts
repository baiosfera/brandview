import { createSignal, createEffect } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import type { Operation } from 'fast-json-patch';
import { loadFontDynamically } from './utils/fontLoader';

export interface BrandSummary {
  id: string;
  name: string;
  hasFontManifest: boolean;
  hasSymbolManifest: boolean;
  hasChromaManifest: boolean;
  hasKineticManifest: boolean;
  hasBrandbook: boolean;
}

export interface FontEcosystem {
  id: string;
  name: string;
  archetype: string;
  rationale: string;
  tokens: {
    display_primary: { $value: string; url?: string; source?: string };
    ui_secondary: { $value: string; url?: string; source?: string };
    accent_brand: { $value: string; url?: string; source?: string };
  };
  layers?: {
    logo?: string;
    slogan?: string;
    h1?: string;
    h2?: string;
    body?: string;
    ui?: string;
  };
}

export interface ElementStyle {
  text: string;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  fontFamily: string;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  fontWeight: 'normal' | 'bold' | '500' | '600' | '700' | '800';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  ligatures: boolean;
  translateX: number;
  translateY: number;
  rotation: number;
  mirror: boolean;
}

export interface CanvasCardState {
  id: string;
  fontFamily: string;
  theme: 'dark' | 'light';
  zoom: number;
  showLeft: boolean;
  showRight: boolean;
  mode: 'letra' | 'palabra' | 'bloque';
  fullscreen: boolean;
  isDefinitive?: boolean;
}

export interface SymbolLockupState {
  symbolId: string;
  symbolScale: number;
  symbolStroke: number;
  symbolX: number;
  symbolY: number;
  initialsX: number;
  initialsY: number;
  brandX: number;
  brandY: number;
  sloganX: number;
  sloganY: number;
}

export const [brands, setBrands] = createSignal<BrandSummary[]>([]);
export const [activeBrandId, setActiveBrandId] = createSignal<string>('CATALINA_GLAMUR');
export const [currentStep, setCurrentStep] = createSignal<number>(1);
export const [gridCols, setGridCols] = createSignal<number>(1);
export const [globalFullscreen, setGlobalFullscreen] = createSignal<boolean>(false);
export const [envatoFonts, setEnvatoFonts] = createSignal<string[]>([]);
export const [selectedEcosystem, setSelectedEcosystem] = createSignal<FontEcosystem | null>(null);
export const [selectedVersion, setSelectedVersion] = createSignal<string>('latest');
export const [showEcosystemsSection, setShowEcosystemsSection] = createSignal<boolean>(true);

// Persistencia Global de Lienzos de Fase 1 (Punto 5.a)
export const [cards, setCards] = createSignal<CanvasCardState[]>([]);

// Textos globales de la marca activa
export const [brandInitials, setBrandInitials] = createSignal<string>('CG');
export const [brandDisplayName, setBrandDisplayName] = createSignal<string>('CATALINA GLAMUR');
export const [brandSlogan, setBrandSlogan] = createSignal<string>('Quiet Luxury Athleisure');

// Estado del Lockup de Isologo en Fase 2
export const [symbolLockup, setSymbolLockup] = createStore<SymbolLockupState>({
  symbolId: 'golden_ratio',
  symbolScale: 1,
  symbolStroke: 3,
  symbolX: 0,
  symbolY: -40,
  initialsX: 0,
  initialsY: 0,
  brandX: 0,
  brandY: 80,
  sloganX: 0,
  sloganY: 130
});

// Estado reactivo de la marca activa
export const [brandData, setBrandData] = createStore<Record<string, any>>({
  id: '',
  name: '',
  font_manifest: null,
  symbol_manifest: null,
  chroma_manifest: null,
  kinetic_manifest: null,
  brandbook: null,
  fontgen_versions: [],
  active_version: null
});

// Selección activa en el lienzo para el FloatingPanel
export const [activeSelection, setActiveSelection] = createSignal<{
  cardId: string;
  itemId: string;
  defaultStyle: ElementStyle;
} | null>(null);

// Estilos individuales por nodo en cada lienzo
export const [elementsStore, setElementsStore] = createStore<Record<string, ElementStyle>>({});

// Estado del Panel Flotante
export const [floatingPanel, setFloatingPanel] = createStore<{
  visible: boolean;
  title: string;
  x: number;
  y: number;
}>({
  visible: false,
  title: 'Editor de Tipografía',
  x: 40,
  y: 70
});

// Limpiar selección activa (Punto 3.e)
export function clearSelection() {
  setActiveSelection(null);
  setFloatingPanel('visible', false);
}

// Obtener estilos del elemento seleccionado actualmente
export function getActiveElementStyle(): ElementStyle {
  const sel = activeSelection();
  if (!sel) {
    return {
      text: '',
      fontSize: 56,
      letterSpacing: 0.04,
      lineHeight: 1.15,
      fontFamily: 'Plus Jakarta Sans',
      textTransform: 'none',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      ligatures: true,
      translateX: 0,
      translateY: 0,
      rotation: 0,
      mirror: false
    };
  }
  const key = `${sel.cardId}_${sel.itemId}`;
  return elementsStore[key] || sel.defaultStyle;
}

// Actualizar propiedad del elemento seleccionado
export function updateActiveElementStyle<K extends keyof ElementStyle>(prop: K, value: ElementStyle[K]) {
  const sel = activeSelection();
  if (!sel) return;
  const key = `${sel.cardId}_${sel.itemId}`;
  if (!elementsStore[key]) {
    setElementsStore(key, { ...getActiveElementStyle() });
  }
  setElementsStore(key, prop, value);
}

// Getters reactivos de herencia para Fases 2, 3, 4 y 5 (Punto 5.b)
export function definitiveDisplayFont(): string {
  const defCard = cards().find(c => c.isDefinitive) || cards()[0];
  if (defCard) {
    const brandStyle = elementsStore[`${defCard.id}_brand`];
    const h1Style = elementsStore[`${defCard.id}_h1`];
    if (brandStyle?.fontFamily) return brandStyle.fontFamily;
    if (h1Style?.fontFamily) return h1Style.fontFamily;
    if (defCard.fontFamily) return defCard.fontFamily;
  }
  return selectedEcosystem()?.tokens.display_primary?.$value || 'Rising';
}

export function definitiveUiFont(): string {
  const defCard = cards().find(c => c.isDefinitive) || cards()[0];
  if (defCard) {
    const bodyStyle = elementsStore[`${defCard.id}_body`];
    if (bodyStyle?.fontFamily) return bodyStyle.fontFamily;
  }
  return selectedEcosystem()?.tokens.ui_secondary?.$value || 'Plus Jakarta Sans';
}

export function definitiveAccentFont(): string {
  const defCard = cards().find(c => c.isDefinitive) || cards()[0];
  if (defCard) {
    const initialsStyle = elementsStore[`${defCard.id}_initials`];
    if (initialsStyle?.fontFamily) return initialsStyle.fontFamily;
  }
  return selectedEcosystem()?.tokens.accent_brand?.$value || 'Calestra';
}

export function definitiveSloganFont(): string {
  const defCard = cards().find(c => c.isDefinitive) || cards()[0];
  if (defCard) {
    const sloganStyle = elementsStore[`${defCard.id}_slogan`];
    if (sloganStyle?.fontFamily) return sloganStyle.fontFamily;
  }
  return selectedEcosystem()?.layers?.slogan || definitiveDisplayFont();
}

// Señales y Getters para Selección Definitiva de Fase 2 (Vector B/N)
export const [definitiveVectorId, setDefinitiveVectorId] = createSignal<string>('isologo-1');

export function definitiveVectorSvg(): string {
  const sm = brandData.symbol_manifest;
  if (!sm) return '';
  const currentId = definitiveVectorId();
  
  // Buscar en isologos
  if (sm.isologos && Array.isArray(sm.isologos)) {
    const found = sm.isologos.find((v: any) => v.id === currentId);
    if (found?.svg_raw) return found.svg_raw;
  }
  // Buscar en monograms
  if (sm.monograms && Array.isArray(sm.monograms)) {
    const found = sm.monograms.find((v: any) => v.id === currentId);
    if (found?.svg_raw) return found.svg_raw;
  }
  // Buscar en favicons
  if (sm.favicons && Array.isArray(sm.favicons)) {
    const found = sm.favicons.find((v: any) => v.id === currentId);
    if (found?.svg_raw) return found.svg_raw;
  }
  // Buscar en vectors dict
  if (sm.vectors && sm.vectors[currentId]?.svg_raw) {
    return sm.vectors[currentId].svg_raw;
  }
  return sm.svg || sm.logo || '';
}

// Señales y Getters para Selección Definitiva de Fase 3 (Ecosistema Cromático OKLCH)
export const [definitiveChromaEcosystemId, setDefinitiveChromaEcosystemId] = createSignal<string>('eco-dark-obsidian');

export function definitivePrimaryColor(): string {
  const cm = brandData.chroma_manifest;
  if (!cm) return '#E2C974';
  const ecoId = definitiveChromaEcosystemId();
  if (cm.ecosystems && Array.isArray(cm.ecosystems)) {
    const found = cm.ecosystems.find((e: any) => e.id === ecoId);
    if (found?.themes?.dark?.primary?.hex) return found.themes.dark.primary.hex;
  }
  return cm.themes?.dark?.primary?.hex || cm.palettes?.[0]?.colors?.primary || '#E2C974';
}

export function definitiveSecondaryColor(): string {
  const cm = brandData.chroma_manifest;
  if (!cm) return '#10B981';
  const ecoId = definitiveChromaEcosystemId();
  if (cm.ecosystems && Array.isArray(cm.ecosystems)) {
    const found = cm.ecosystems.find((e: any) => e.id === ecoId);
    if (found?.themes?.dark?.secondary?.hex) return found.themes.dark.secondary.hex;
  }
  return cm.themes?.dark?.secondary?.hex || cm.palettes?.[0]?.colors?.secondary || '#10B981';
}

export function definitiveAccentColor(): string {
  const cm = brandData.chroma_manifest;
  if (!cm) return '#34D399';
  const ecoId = definitiveChromaEcosystemId();
  if (cm.ecosystems && Array.isArray(cm.ecosystems)) {
    const found = cm.ecosystems.find((e: any) => e.id === ecoId);
    if (found?.themes?.dark?.accent?.hex) return found.themes.dark.accent.hex;
  }
  return cm.themes?.dark?.accent?.hex || '#34D399';
}

export function definitiveBackgroundColor(): string {
  const cm = brandData.chroma_manifest;
  if (!cm) return '#0F172A';
  const ecoId = definitiveChromaEcosystemId();
  if (cm.ecosystems && Array.isArray(cm.ecosystems)) {
    const found = cm.ecosystems.find((e: any) => e.id === ecoId);
    if (found?.themes?.dark?.background?.hex) return found.themes.dark.background.hex;
  }
  return cm.themes?.dark?.background?.hex || '#0F172A';
}

// Señales y Getters para Selección Definitiva de Fase 4 (Kinetic Animation)
export const [definitiveKineticPresetId, setDefinitiveKineticPresetId] = createSignal<string>('anim-orbit-precession');

export function definitiveKeyframes(): string {
  const km = brandData.kinetic_manifest;
  if (!km) return '';
  const animId = definitiveKineticPresetId();
  if (km.animation_options && Array.isArray(km.animation_options)) {
    const found = km.animation_options.find((a: any) => a.id === animId);
    if (found?.css_keyframes) return found.css_keyframes;
  }
  return km.css_keyframes || '';
}

let ws: WebSocket | null = null;

export function connectWebSocket(brandId: string) {
  if (ws) {
    ws.close();
    ws = null;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws?brand=${brandId}`;
  
  try {
    ws = new WebSocket(wsUrl);
  } catch (err) {
    console.warn('[WS Connect]', err);
  }
}

export function sendPatch(manifestName: string, patches: Operation[]) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'PATCH', manifestName, patches }));
  }
}

export async function loadBrands() {
  try {
    const res = await fetch('/api/brands');
    const data = await res.json();
    if (data.brands && data.brands.length > 0) {
      setBrands(data.brands);
      if (!data.brands.find((b: any) => b.id === activeBrandId())) {
        setActiveBrandId(data.brands[0].id);
      }
    }
  } catch (e) {
    console.error('Error cargando marcas:', e);
  }
}

export async function loadActiveBrand(brandId: string, version: string = 'latest') {
  try {
    const query = version !== 'latest' ? `?version=${version}` : '';
    const res = await fetch(`/api/brand/${brandId}${query}`);
    if (res.ok) {
      const data = await res.json();
      setBrandData(reconcile(data));
      setSelectedVersion(data.active_version || version);

      // Auto-expandir sección de candidatos al escoger un nuevo cliente
      setShowEcosystemsSection(true);

      // Sincronizar nombres e iniciales
      const name = data.name || brandId.replace(/_/g, ' ');
      setBrandDisplayName(name);

      const words = name.split(' ');
      if (words.length >= 2) {
        setBrandInitials((words[0][0] + words[1][0]).toUpperCase());
      } else {
        setBrandInitials(name.substring(0, 2).toUpperCase());
      }

      // Si hay ecosistemas candidatos, cargar el primero en memoria
      if (data.font_manifest?.selected_ecosystem) {
        setSelectedEcosystem(data.font_manifest.selected_ecosystem);
      } else if (data.font_manifest?.candidate_ecosystems?.[0]) {
        setSelectedEcosystem(data.font_manifest.candidate_ecosystems[0]);
      }

      // Pre-cargar fuentes del ecosistema
      const eco = selectedEcosystem();
      if (eco) {
        if (eco.tokens.display_primary?.$value) loadFontDynamically(eco.tokens.display_primary.$value);
        if (eco.tokens.ui_secondary?.$value) loadFontDynamically(eco.tokens.ui_secondary.$value);
        if (eco.tokens.accent_brand?.$value) loadFontDynamically(eco.tokens.accent_brand.$value);
      }

      connectWebSocket(brandId);
    }
  } catch (e) {
    console.error('Error cargando marca activa:', e);
  }
}

export async function generatePhase(brandId: string, phase: string) {
  try {
    const res = await fetch(`/api/brand/${brandId}/generate-phase/${phase}`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      await loadActiveBrand(brandId, selectedVersion());
      return data;
    }
  } catch (e) {
    console.error(`Error generando fase ${phase}:`, e);
  }
}

export async function loadEnvatoFonts() {
  try {
    const res = await fetch('/api/fonts/envato');
    const data = await res.json();
    if (data.fonts) setEnvatoFonts(data.fonts);
  } catch (e) {
    console.error('Error cargando fuentes Envato:', e);
  }
}

export async function extractAndReloadEnvatoFonts(): Promise<number> {
  try {
    const res = await fetch('/api/fonts/extract', { method: 'POST' });
    const data = await res.json();
    if (data.fonts) {
      setEnvatoFonts(data.fonts);
      // Pre-cargar fuentes en el navegador
      data.fonts.forEach((f: string) => loadFontDynamically(f));
      return data.fonts.length;
    }
  } catch (e) {
    console.error('Error extrayendo fuentes Envato:', e);
  }
  return 0;
}

// Establecer el Ecosistema Definitivo DIRECTAMENTE desde un Lienzo de Trabajo editado por el usuario
export function setDefinitiveFromCanvas(canvasId: string, cardFontFamily: string, customName?: string) {
  const brandStyle = elementsStore[`${canvasId}_brand`] || { fontFamily: cardFontFamily };
  const h1Style = elementsStore[`${canvasId}_h1`] || { fontFamily: cardFontFamily };
  const bodyStyle = elementsStore[`${canvasId}_body`] || { fontFamily: 'Plus Jakarta Sans' };
  const initialsStyle = elementsStore[`${canvasId}_initials`] || { fontFamily: cardFontFamily };

  const customEco: FontEcosystem = {
    id: `definitive-canvas-${canvasId}`,
    name: customName || `${brandDisplayName()} — Ecosistema Maestro (Lienzo ${cardFontFamily})`,
    archetype: 'Ecosistema Personalizado en Workbench',
    rationale: `Definido en el lienzo de trabajo con ${brandStyle.fontFamily || cardFontFamily} para display y ${bodyStyle.fontFamily || 'Plus Jakarta Sans'} para UI.`,
    tokens: {
      display_primary: { $value: brandStyle.fontFamily || cardFontFamily, source: 'canvas_custom' },
      ui_secondary: { $value: bodyStyle.fontFamily || 'Plus Jakarta Sans', source: 'canvas_custom' },
      accent_brand: { $value: initialsStyle.fontFamily || cardFontFamily, source: 'canvas_custom' }
    }
  };

  setSelectedEcosystem(customEco);

  // Persistir en JSON
  try {
    const patchPayload = {
      type: 'PATCH',
      manifestName: 'font_manifest',
      patches: [
        { op: 'add', path: '/selected_ecosystem', value: customEco }
      ]
    };
    sendPatch('font_manifest', patchPayload.patches as Operation[]);
  } catch (e) {}
}
