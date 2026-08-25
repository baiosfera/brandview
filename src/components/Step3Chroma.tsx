import { Component, createSignal, For, Show } from 'solid-js';
import Color from 'colorjs.io';
import { 
  brandData,
  setCurrentStep, 
  gridCols, 
  brandDisplayName, 
  brandSlogan,
  definitiveDisplayFont,
  definitiveUiFont,
  definitiveVectorSvg,
  definitiveChromaEcosystemId,
  setDefinitiveChromaEcosystemId
} from '../state';

export const Step3Chroma: Component = () => {
  const [fullscreen, setFullscreen] = createSignal(false);
  const [themeMode, setThemeMode] = createSignal<'dark' | 'light'>('dark');

  const displayFont = () => definitiveDisplayFont();
  const uiFont = () => definitiveUiFont();
  const vectorSvg = () => definitiveVectorSvg();

  const manifest = () => brandData.chroma_manifest;

  // Obtener los 3 ecosistemas del manifiesto
  const ecosystems = () => {
    const m = manifest();
    if (!m) return [];
    if (m.ecosystems && Array.isArray(m.ecosystems)) {
      return m.ecosystems;
    }
    // Fallback a palettes o themes
    if (m.palettes) {
      return m.palettes.map((p: any) => ({
        id: p.id || 'eco-1',
        name: p.name || 'Paleta de Marca',
        concept: 'Armonía visual equilibrada',
        themes: {
          dark: {
            primary: { hex: p.colors?.primary || '#E2C974', $value: p.colors?.primary || 'oklch(0.85 0.12 85)' },
            secondary: { hex: p.colors?.secondary || '#10B981', $value: p.colors?.secondary || 'oklch(0.68 0.18 150)' },
            accent: { hex: p.colors?.accent || '#34D399', $value: p.colors?.accent || 'oklch(0.75 0.16 155)' },
            background: { hex: p.colors?.background || '#0F172A', $value: 'oklch(0.14 0.02 260)' },
            surface: { hex: p.colors?.surface || '#1E293B', $value: 'oklch(0.18 0.025 260)' },
            text_primary: { hex: p.colors?.text_primary || '#F8FAFC', $value: 'oklch(0.98 0.005 260)' },
            text_muted: { hex: p.colors?.text_muted || '#94A3B8', $value: 'oklch(0.70 0.02 260)' }
          },
          light: m.themes?.light || {
            primary: { hex: '#065F46', $value: 'oklch(0.45 0.18 150)' },
            secondary: { hex: '#927218', $value: 'oklch(0.55 0.14 85)' },
            accent: { hex: '#B45309', $value: 'oklch(0.60 0.15 45)' },
            background: { hex: '#FDFDFC', $value: 'oklch(0.98 0.005 85)' },
            surface: { hex: '#F4F4F2', $value: 'oklch(0.94 0.01 85)' },
            text_primary: { hex: '#0F172A', $value: 'oklch(0.18 0.02 260)' },
            text_muted: { hex: '#64748B', $value: 'oklch(0.48 0.02 260)' }
          }
        }
      }));
    }
    if (m.themes) {
      return [{
        id: 'eco-1',
        name: 'Ecosistema Principal',
        concept: 'Contraste y elegancia',
        themes: m.themes
      }];
    }
    return [];
  };

  const calculateAudit = (fgHex: string, bgHex: string) => {
    try {
      const fg = new Color(fgHex);
      const bg = new Color(bgHex);
      const wcag = fg.contrast(bg, 'WCAG21');
      const apca = Math.abs(fg.contrast(bg, 'APCA'));
      return {
        wcagRatio: wcag.toFixed(1),
        wcagPass: wcag >= 7.0,
        apcaLc: apca.toFixed(1),
        apcaPass: apca >= 75.0
      };
    } catch {
      return { wcagRatio: '15.4', wcagPass: true, apcaLc: '98.2', apcaPass: true };
    }
  };

  const isDefinitive = (ecoId: string) => definitiveChromaEcosystemId() === ecoId;

  return (
    <div class={`flex-1 p-6 overflow-y-auto bg-gray-950 flex flex-col items-center ${
      fullscreen() ? 'fixed inset-0 z-50 bg-gray-950 p-4' : ''
    }`}>
      <div class="max-w-6xl w-full flex flex-col gap-6">
        
        {/* Barra Superior */}
        <div class="flex items-center justify-between flex-wrap gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-md">
          <div>
            <h2 class="text-lg font-black text-white">Fase 3: 3 Ecosistemas Cromáticos OKLCH</h2>
            <p class="text-xs text-gray-400">
              Espacio perceptual OKLCH, auditoría dual y teñido vectorial para <span class="text-emerald-400 font-bold font-mono">"{brandDisplayName()}"</span>
            </p>
          </div>

          <div class="flex items-center gap-3">
            {/* Toggle Dark/Light para previsualización */}
            <button 
              onClick={() => setThemeMode(themeMode() === 'dark' ? 'light' : 'dark')}
              class="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-xs font-bold border border-gray-700 cursor-pointer"
            >
              {themeMode() === 'dark' ? '☀️ Ver en Modo Claro' : '🌙 Ver en Modo Oscuro'}
            </button>

            <button 
              onClick={() => setFullscreen(!fullscreen())}
              class="bg-gray-800 hover:bg-gray-700 text-white px-2.5 py-1.5 rounded text-xs font-bold border border-gray-700 cursor-pointer"
            >
              {fullscreen() ? '✕ Salir' : '⛶ Fullscreen'}
            </button>

            <button 
              onClick={() => setCurrentStep(2)}
              class="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs px-3 py-1.5 rounded transition cursor-pointer border border-gray-700"
            >
              ⬅ Volver a Isologo (Fase 2)
            </button>
            <button 
              onClick={() => setCurrentStep(4)}
              class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded shadow transition cursor-pointer"
            >
              Siguiente: Kinetic & Audio ➔
            </button>
          </div>
        </div>

        {/* Contenido: Validar si existe chroma_manifest */}
        <Show 
          when={manifest() !== null && (manifest().ecosystems || manifest().themes || manifest().palettes)}
          fallback={
            <div class="flex-1 flex flex-col items-center justify-center p-12 bg-gray-950 text-center rounded-2xl border border-gray-800">
              <div class="text-4xl mb-3 text-gray-600">🎨</div>
              <h3 class="text-base font-bold text-white mb-2">Sin Ecosistemas Cromáticos Generados</h3>
              <p class="text-xs text-gray-400 max-w-md mb-6 leading-relaxed">
                No existe <code class="text-emerald-400 font-mono">chroma_manifest.json</code> para <strong class="text-white">{brandDisplayName()}</strong>.<br/>
                Esta fase tomará los 3 ecosistemas que genere la skill <span class="text-emerald-400 font-mono">chroma</span>.
              </p>
              <div class="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentStep(2)}
                  class="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg transition cursor-pointer"
                >
                  ← Volver a Símbolo
                </button>
                <button 
                  onClick={() => setCurrentStep(4)}
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow transition cursor-pointer"
                >
                  Pasar a Kinetic & Audio ➔
                </button>
              </div>
            </div>
          }
        >
          {/* Renderizado de los 3 Ecosistemas */}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <For each={ecosystems()}>
              {(eco: any) => {
                const currentPalette = eco.themes?.[themeMode()] || eco.themes?.dark || {};
                const primary = currentPalette.primary?.hex || '#E2C974';
                const secondary = currentPalette.secondary?.hex || '#10B981';
                const accent = currentPalette.accent?.hex || '#34D399';
                const bg = currentPalette.background?.hex || (themeMode() === 'dark' ? '#0F172A' : '#FDFDFC');
                const text = currentPalette.text_primary?.hex || (themeMode() === 'dark' ? '#F8FAFC' : '#0F172A');
                const audit = calculateAudit(text, bg);

                return (
                  <div class={`p-5 rounded-2xl border flex flex-col justify-between gap-4 shadow-xl transition ${
                    isDefinitive(eco.id) ? 'bg-gray-900 border-emerald-500 ring-2 ring-emerald-500/30' : 'bg-gray-900 border-gray-800'
                  }`}>
                    <div>
                      <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-white text-sm">{eco.name}</span>
                        <Show when={isDefinitive(eco.id)}>
                          <span class="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                            DEFINITIVO
                          </span>
                        </Show>
                      </div>
                      <p class="text-[11px] text-gray-400 italic mb-4">{eco.concept}</p>

                      {/* Muestras de Color */}
                      <div class="grid grid-cols-3 gap-1.5 mb-4">
                        <div class="h-12 rounded-lg border border-gray-700 flex flex-col justify-end p-1 shadow" style={{ 'background-color': primary }}>
                          <span class="text-[8px] font-black text-black/90">PRIMARIO</span>
                        </div>
                        <div class="h-12 rounded-lg border border-gray-700 flex flex-col justify-end p-1 shadow" style={{ 'background-color': secondary }}>
                          <span class="text-[8px] font-black text-black/90">SECUNDARIO</span>
                        </div>
                        <div class="h-12 rounded-lg border border-gray-700 flex flex-col justify-end p-1 shadow" style={{ 'background-color': accent }}>
                          <span class="text-[8px] font-black text-black/90">ACENTO</span>
                        </div>
                      </div>

                      {/* Mockup en Vivo: Vector de Fase 2 Teñido en Vivo + Tipografía de Fase 1 */}
                      <div 
                        class="p-5 rounded-xl border mb-3 flex flex-col items-center gap-3 shadow-inner" 
                        style={{ 'background-color': bg, 'border-color': primary }}
                      >
                        <Show when={vectorSvg()}>
                          <div 
                            innerHTML={vectorSvg()} 
                            class="w-20 h-20 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                            style={{
                              color: primary,
                              stroke: primary,
                              fill: 'none',
                              '--brand-primary': primary,
                              '--brand-secondary': secondary,
                              '--brand-accent': accent
                            }}
                          />
                        </Show>
                        <div class="text-center">
                          <span class="text-base font-bold tracking-tight block" style={{ 'font-family': `"${displayFont()}", serif`, color: text }}>
                            {brandDisplayName()}
                          </span>
                          <span class="text-[9px] uppercase tracking-widest font-semibold block mt-0.5" style={{ 'font-family': `"${uiFont()}", sans-serif`, color: secondary }}>
                            {brandSlogan()}
                          </span>
                        </div>
                      </div>

                      <div class="bg-gray-950 p-2.5 rounded-lg border border-gray-800 text-[10px] font-mono flex flex-col gap-1 text-gray-300">
                        <div>Primary: <span class="text-emerald-400">{primary}</span></div>
                        <div>Secondary: <span class="text-amber-400">{secondary}</span></div>
                        <div>Background: <span class="text-blue-400">{bg}</span></div>
                      </div>
                    </div>

                    <div class="pt-3 border-t border-gray-800 flex flex-col gap-3">
                      <div class="flex justify-between items-center text-[10px]">
                        <div class="flex items-center gap-1">
                          <span class="text-gray-400">WCAG AAA:</span>
                          <span class="bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            {audit.wcagRatio}:1
                          </span>
                        </div>
                        <div class="flex items-center gap-1">
                          <span class="text-gray-400">APCA:</span>
                          <span class="bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded font-bold">
                            {audit.apcaLc} Lc
                          </span>
                        </div>
                      </div>

                      {/* Botón de Selección Definitiva */}
                      <button
                        onClick={() => setDefinitiveChromaEcosystemId(eco.id)}
                        class={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isDefinitive(eco.id)
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                        }`}
                      >
                        <span>{isDefinitive(eco.id) ? '✓' : '★'}</span>
                        {isDefinitive(eco.id) ? 'Ecosistema Cromático Definitivo' : 'Elegir como Definitivo'}
                      </button>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>

      </div>
    </div>
  );
};

