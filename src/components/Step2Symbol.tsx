import { Component, createSignal, For, Show } from 'solid-js';
import { 
  brandData,
  activeBrandId,
  currentStep,
  setCurrentStep, 
  brandInitials, 
  brandDisplayName, 
  brandSlogan,
  definitiveDisplayFont,
  definitiveUiFont,
  definitiveAccentFont,
  definitiveSloganFont,
  definitiveVectorId,
  setDefinitiveVectorId,
  definitiveVectorSvg
} from '../state';

export const Step2Symbol: Component = () => {
  const [theme, setTheme] = createSignal<'dark' | 'light'>('dark');
  const [fullscreen, setFullscreen] = createSignal(false);
  const [categoryTab, setCategoryTab] = createSignal<'isologos' | 'monograms' | 'favicons'>('isologos');
  const [selectedOptionIndex, setSelectedOptionIndex] = createSignal<number>(0);

  const displayFont = () => definitiveDisplayFont();
  const uiFont = () => definitiveUiFont();
  const accentFont = () => definitiveAccentFont();
  const sloganFont = () => definitiveSloganFont();

  const manifest = () => brandData.symbol_manifest;

  // Obtener la lista de propuestas para la categoría actual
  const currentProposals = () => {
    const m = manifest();
    if (!m) return [];
    if (categoryTab() === 'isologos') {
      return m.isologos || (m.vectors?.logo_primary ? [{ id: 'isologo-1', name: 'Isologo Principal', svg_raw: m.vectors.logo_primary.svg_raw }] : []);
    }
    if (categoryTab() === 'monograms') {
      return m.monograms || (m.vectors?.monogram ? [{ id: 'monogram-1', name: 'Monograma Esculpido', svg_raw: m.vectors.monogram.svg_raw }] : []);
    }
    return m.favicons || (m.vectors?.favicon ? [{ id: 'favicon-1', name: 'Favicon Minimalista', svg_raw: m.vectors.favicon.svg_raw }] : []);
  };

  const activeVector = () => {
    const list = currentProposals();
    if (list.length === 0) return { id: 'default', name: 'Isologo', svg_raw: manifest()?.svg || manifest()?.logo || '' };
    return list[selectedOptionIndex()] || list[0];
  };

  const isCurrentDefinitive = () => {
    return definitiveVectorId() === activeVector()?.id;
  };

  const handleMarkDefinitive = () => {
    const v = activeVector();
    if (v?.id) {
      setDefinitiveVectorId(v.id);
    }
  };

  return (
    <div class={`flex-1 flex flex-col overflow-hidden ${fullscreen() ? 'fixed inset-0 z-50' : ''} bg-gray-950`}>
      {/* Sub-Header con Controles */}
      <div class="bg-gray-900 border-b border-gray-800 px-4 py-2.5 flex items-center justify-between gap-3 text-xs flex-wrap">
        <div class="flex items-center gap-3">
          <button 
            onClick={() => setCurrentStep(1)}
            class="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1"
          >
            ← Volver a Fuentes (Fase 1)
          </button>
          <span class="text-gray-500">|</span>
          <span class="font-bold text-white">Fase 2: Vectores B/N</span>
          <span class="text-gray-500">|</span>
          <span class="text-emerald-400 font-semibold">{brandDisplayName()}</span>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          {/* Selector de Categoría */}
          <div class="flex bg-gray-950 p-0.5 rounded-lg border border-gray-800 text-[11px]">
            <button
              onClick={() => { setCategoryTab('isologos'); setSelectedOptionIndex(0); }}
              class={`px-3 py-1 rounded transition ${categoryTab() === 'isologos' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              Isologos (3)
            </button>
            <button
              onClick={() => { setCategoryTab('monograms'); setSelectedOptionIndex(0); }}
              class={`px-3 py-1 rounded transition ${categoryTab() === 'monograms' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              Monogramas (3)
            </button>
            <button
              onClick={() => { setCategoryTab('favicons'); setSelectedOptionIndex(0); }}
              class={`px-3 py-1 rounded transition ${categoryTab() === 'favicons' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              Favicons (3)
            </button>
          </div>

          <button 
            onClick={() => setTheme(theme() === 'dark' ? 'light' : 'dark')}
            class="bg-gray-800 hover:bg-gray-700 text-white px-2.5 py-1 rounded text-xs transition"
          >
            {theme() === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
          </button>
          
          <button 
            onClick={() => setFullscreen(!fullscreen())}
            class="bg-gray-800 hover:bg-gray-700 text-white px-2.5 py-1 rounded text-xs transition"
          >
            {fullscreen() ? '✕ Salir' : '⛶ Fullscreen'}
          </button>

          <button 
            onClick={() => setCurrentStep(3)}
            class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-xs shadow transition cursor-pointer"
          >
            Pasar a Colores OKLCH ➔
          </button>
        </div>
      </div>

      {/* Contenido: Validar si existe symbol_manifest */}
      <Show 
        when={manifest() !== null && (manifest().isologos || manifest().vectors || manifest().svg || manifest().logo)}
        fallback={
          <div class="flex-1 flex flex-col items-center justify-center p-8 bg-gray-950 text-center">
            <div class="text-4xl mb-3 text-gray-600">⬡</div>
            <h3 class="text-base font-bold text-white mb-2">Sin Isologo Generado</h3>
            <p class="text-xs text-gray-400 max-w-md mb-6 leading-relaxed">
              No existe <code class="text-emerald-400 font-mono">symbol_manifest.json</code> para el cliente <strong class="text-white">{brandDisplayName()}</strong>.<br/>
              Esta fase tomará exclusivamente los datos individuales del JSON que genere la skill <span class="text-emerald-400 font-mono">symbol</span> / <span class="text-emerald-400 font-mono">orchesbrand</span>.
            </p>
            <div class="flex items-center gap-3">
              <button 
                onClick={() => setCurrentStep(1)}
                class="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg transition cursor-pointer"
              >
                ← Volver a Fuentes
              </button>
              <button 
                onClick={() => setCurrentStep(3)}
                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow transition cursor-pointer"
              >
                Pasar a Colores OKLCH ➔
              </button>
            </div>
          </div>
        }
      >
        <main class={`flex-1 p-6 flex flex-col items-center justify-center overflow-auto ${
          theme() === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
        }`}>
          {/* Selector de Propuestas (3 opciones) */}
          <div class="flex items-center gap-2 mb-6 bg-gray-900/80 p-1.5 rounded-xl border border-gray-800 shadow">
            <For each={currentProposals()}>
              {(p, idx) => (
                <button
                  onClick={() => setSelectedOptionIndex(idx())}
                  class={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedOptionIndex() === idx()
                      ? 'bg-emerald-600 text-white font-bold shadow'
                      : 'text-gray-400 hover:text-white bg-gray-950/60'
                  }`}
                >
                  {p.name || `Opción ${idx() + 1}`}
                </button>
              )}
            </For>
          </div>

          {/* Lienzo Monocromático Puro */}
          <div class={`max-w-xl w-full p-8 rounded-2xl border shadow-2xl flex flex-col items-center gap-6 ${
            theme() === 'dark' ? 'border-gray-800 bg-gray-950/80' : 'border-gray-300 bg-slate-50'
          }`}>
            <div class="w-56 h-56 flex items-center justify-center p-2">
              <div 
                innerHTML={activeVector()?.svg_raw || ''} 
                class="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                style={{
                  color: theme() === 'dark' ? '#ffffff' : '#000000',
                  stroke: theme() === 'dark' ? '#ffffff' : '#000000'
                }}
              />
            </div>

            <div class="text-center">
              <h2 
                style={{ 'font-family': `"${displayFont()}", serif` }}
                class="text-3xl font-bold tracking-wider mb-1"
              >
                {brandDisplayName()}
              </h2>
              <p 
                style={{ 'font-family': `"${sloganFont()}", sans-serif` }}
                class={`text-xs uppercase tracking-widest font-semibold ${
                  theme() === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {brandSlogan()}
              </p>
            </div>

            <Show when={activeVector()?.geometry_style || manifest()?.geometry_rationale}>
              <p class="text-[11px] text-gray-400 text-center max-w-md italic border-t border-gray-800/40 pt-3">
                "{activeVector()?.geometry_style || manifest()?.geometry_rationale}"
              </p>
            </Show>

            {/* Botón de Marcado como Definitivo */}
            <button
              onClick={handleMarkDefinitive}
              class={`mt-2 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                isCurrentDefinitive()
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
              }`}
            >
              <span>{isCurrentDefinitive() ? '✓' : '★'}</span>
              {isCurrentDefinitive() ? 'Vector Definitivo Seleccionado' : 'Elegir como Vector Definitivo'}
            </button>
          </div>
        </main>
      </Show>
    </div>
  );
};

