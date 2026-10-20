import { Component, Show, For, createSignal, createEffect } from 'solid-js';
import { 
  floatingPanel, 
  setFloatingPanel,
  activeSelection, 
  clearSelection,
  getActiveElementStyle, 
  updateActiveElementStyle,
  envatoFonts,
  selectedEcosystem,
  brandData
} from '../state';
import { loadFontDynamically } from '../utils/fontLoader';
import { FluidSlider } from './FluidSlider';

export const FloatingPanel: Component = () => {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initX = 0;
  let initY = 0;

  const handleRangeInput = (prop: keyof ElementStyle, value: number) => {
    updateActiveElementStyle(prop, value);
  };

  const handlePointerMoveWindow = (e: PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    setFloatingPanel('x', Math.max(10, Math.min(window.innerWidth - 320, initX + dx)));
    setFloatingPanel('y', Math.max(40, Math.min(window.innerHeight - 120, initY + dy)));
  };

  const handlePointerUpWindow = () => {
    if (isDragging) {
      isDragging = false;
      window.removeEventListener('pointermove', handlePointerMoveWindow);
      window.removeEventListener('pointerup', handlePointerUpWindow);
    }
  };

  const handlePanelPointerDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'INPUT') return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initX = floatingPanel.x;
    initY = floatingPanel.y;
    window.addEventListener('pointermove', handlePointerMoveWindow);
    window.addEventListener('pointerup', handlePointerUpWindow);
    e.stopPropagation();
  };

  const style = () => getActiveElementStyle();

  const [customGFont, setCustomGFont] = createSignal('');
  const [fontFeatures, setFontFeatures] = createSignal<{ features: string[]; stylistic_sets: string[]; pua_count: number; pua_glyphs: any[] } | null>(null);
  const [showGlyphPalette, setShowGlyphPalette] = createSignal(false);

  createEffect(() => {
    const fam = style().fontFamily;
    if (fam) {
      fetch(`/api/fonts/features/${encodeURIComponent(fam)}`)
        .then(r => r.json())
        .then(data => setFontFeatures(data))
        .catch(() => setFontFeatures(null));
    }
  });

  const insertGlyph = (char: string) => {
    const current = style().text;
    updateActiveElementStyle('text', current ? current + char : char);
  };

  const fontgenFonts = () => {
    const list = new Set<string>();
    const ecos = brandData.font_manifest?.candidate_ecosystems || [];
    for (const eco of ecos) {
      const clean = (s?: string) => (s || '').replace(/^Token[^\:]*:\s*/i, '').replace(/[\s\—\-\:\;\,\.]+$/g, '').trim();
      if (eco.tokens?.display_primary?.$value) list.add(clean(eco.tokens.display_primary.$value));
      if (eco.tokens?.ui_secondary?.$value) list.add(clean(eco.tokens.ui_secondary.$value));
      if (eco.tokens?.accent_brand?.$value) list.add(clean(eco.tokens.accent_brand.$value));
    }
    return Array.from(list).filter(Boolean);
  };

  const handleFontSelect = async (fontName: string) => {
    if (!fontName) return;
    const clean = fontName.replace(/\.(otf|ttf|woff|woff2)$/i, '').trim();
    let customUrl: string | undefined;
    const ecos = brandData.font_manifest?.candidate_ecosystems || [];
    for (const eco of ecos) {
      if (eco.tokens?.display_primary?.$value === clean) customUrl = eco.tokens.display_primary.google_fonts_v2_url || eco.tokens.display_primary.url;
      if (eco.tokens?.ui_secondary?.$value === clean) customUrl = eco.tokens.ui_secondary.google_fonts_v2_url || eco.tokens.ui_secondary.url;
      if (eco.tokens?.accent_brand?.$value === clean) customUrl = eco.tokens.accent_brand.google_fonts_v2_url || eco.tokens.accent_brand.url;
    }
    await loadFontDynamically(clean, customUrl);
    updateActiveElementStyle('fontFamily', clean);
  };

  const handleFileUpload = (e: Event) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const name = file.name.split('.')[0];
    const url = URL.createObjectURL(file);
    
    const fontFace = new FontFace(name, `url("${url}")`);
    fontFace.load().then((loaded) => {
      document.fonts.add(loaded);
      updateActiveElementStyle('fontFamily', name);
    });
  };

  return (
    <Show when={floatingPanel.visible && activeSelection() !== null}>
      <div 
        onClick={(e) => e.stopPropagation()}
        
        style={{ left: `${floatingPanel.x}px`, top: `${floatingPanel.y}px` }}
        class="fixed z-[999995] bg-gray-900/98 backdrop-blur-lg border border-emerald-500/80 rounded-xl shadow-2xl w-[720px] max-w-[95vw] flex flex-col text-xs text-gray-200 overflow-hidden select-none"
      >
        {/* Header Arrastrable (Punto 5.a - Fluido con Pointer Events) */}
        <div 
          onPointerDown={handlePanelPointerDown}
          class="bg-gray-950 px-4 py-2.5 cursor-grab active:cursor-grabbing flex items-center justify-between border-b border-gray-800 select-none"
        >
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="font-bold text-emerald-400 text-xs">{floatingPanel.title}</span>
            <span class="text-gray-500 text-[11px]">| Control de Nodo</span>
          </div>
          <button 
            onClick={() => clearSelection()}
            class="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 font-bold px-2 py-0.5 rounded text-xs transition cursor-pointer"
            title="Cerrar y Deseleccionar"
          >✕</button>
        </div>

        {/* Sección Superior: Edición Directa de Texto con Reset Individual (Punto 4.a) */}
        <div class="px-4 py-2 bg-gray-950/80 border-b border-gray-800 flex items-center gap-2">
          <span class="text-[11px] font-bold text-gray-400 whitespace-nowrap">Editar Texto:</span>
          <input 
            type="text"
            value={style().text}
            onInput={(e) => updateActiveElementStyle('text', e.currentTarget.value)}
            placeholder="Escribe texto personalizado para este elemento..."
            class="flex-1 bg-gray-900 border border-gray-700 text-white rounded px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500"
          />
          <button 
            onClick={() => updateActiveElementStyle('text', '')}
            class="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs border border-gray-700 transition cursor-pointer"
            title="Restablecer texto original"
          >
            ↺ Original
          </button>
        </div>

        {/* Cuerpo Horizontal en 3 Columnas */}
        <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-900">
          
          {/* Columna 1: Tipografía y Familia */}
          <div class="flex flex-col gap-2.5 border-r border-gray-800 pr-3">
            <span class="text-[11px] font-bold uppercase text-gray-400 tracking-wider">Tipografía & Fuente</span>
            
            {/* Selector de Fuente con Previsualización (Punto 4.a y Previsualización) */}
            <div class="flex flex-col gap-1">
              <div class="flex justify-between items-center text-[10px] text-gray-400">
                <span>Fuente Seleccionada:</span>
                <button 
                  onClick={() => updateActiveElementStyle('fontFamily', activeSelection()?.defaultStyle.fontFamily || 'Plus Jakarta Sans')}
                  class="text-gray-500 hover:text-white text-[10px]"
                  title="Reset Fuente Original"
                >↺</button>
              </div>
              <select 
                value={style().fontFamily}
                onChange={(e) => handleFontSelect(e.currentTarget.value)}
                class="bg-gray-950 border border-gray-700 text-emerald-300 font-bold rounded px-2 py-1 text-xs w-full cursor-pointer focus:outline-none focus:border-emerald-500"
              >
                {/* Opción activa actual si no está en la lista estándar */}
                <Show when={style().fontFamily}>
                  <option value={style().fontFamily} style={{ 'font-family': `"${style().fontFamily}", sans-serif` }}>
                    ✓ {style().fontFamily} (Activa)
                  </option>
                </Show>

                <optgroup label="Ecosistema Definitivo">
                  <option 
                    value={selectedEcosystem()?.tokens.display_primary?.$value || 'Rising'}
                    style={{ 'font-family': `"${selectedEcosystem()?.tokens.display_primary?.$value || 'Rising'}", serif` }}
                  >
                    Display: {selectedEcosystem()?.tokens.display_primary?.$value || 'Rising'}
                  </option>
                  <option 
                    value={selectedEcosystem()?.tokens.ui_secondary?.$value || 'Plus Jakarta Sans'}
                    style={{ 'font-family': `"${selectedEcosystem()?.tokens.ui_secondary?.$value || 'Plus Jakarta Sans'}", sans-serif` }}
                  >
                    UI: {selectedEcosystem()?.tokens.ui_secondary?.$value || 'Plus Jakarta Sans'}
                  </option>
                  <option 
                    value={selectedEcosystem()?.tokens.accent_brand?.$value || 'Calestra'}
                    style={{ 'font-family': `"${selectedEcosystem()?.tokens.accent_brand?.$value || 'Calestra'}", serif` }}
                  >
                    Acento: {selectedEcosystem()?.tokens.accent_brand?.$value || 'Calestra'}
                  </option>
                </optgroup>
                <optgroup label="Fuentes del Ecosistema / Fontgen">
                  <For each={fontgenFonts()}>
                    {(fgFont) => (
                      <option value={fgFont} style={{ 'font-family': `"${fgFont}", sans-serif` }}>
                        ★ {fgFont} (Ecosistema)
                      </option>
                    )}
                  </For>
                </optgroup>
                <optgroup label="Fuentes Envato">
                  <For each={envatoFonts()}>
                    {(f) => {
                      const cleanF = f.replace(/\.(otf|ttf|woff|woff2)$/i, '');
                      return (
                        <option value={cleanF} style={{ 'font-family': `"${cleanF}", sans-serif` }}>
                          {cleanF}
                        </option>
                      );
                    }}
                  </For>
                </optgroup>
                <optgroup label="Google Fonts (Serif & Editorial)">
                  <For each={[
                    'Newsreader', 'Spectral', 'Playfair Display', 'Cinzel', 'Cormorant Garamond', 
                    'Fraunces', 'Bodoni Moda', 'Lora', 'Merriweather', 'Castoro', 'Prata', 'Italiana'
                  ]}>
                    {(gf) => (
                      <option value={gf} style={{ 'font-family': `"${gf}", serif` }}>
                        {gf}
                      </option>
                    )}
                  </For>
                </optgroup>
                <optgroup label="Google Fonts (Sans & UI)">
                  <For each={[
                    'Plus Jakarta Sans', 'Instrument Sans', 'Inter', 'Space Grotesk', 'Urbanist', 
                    'Manrope', 'Host Grotesk', 'Hanken Grotesk', 'Montserrat', 'Outfit', 'DM Sans', 'Work Sans', 'Raleway'
                  ]}>
                    {(gf) => (
                      <option value={gf} style={{ 'font-family': `"${gf}", sans-serif` }}>
                        {gf}
                      </option>
                    )}
                  </For>
                </optgroup>
                <optgroup label="Google Fonts (Display & Mono)">
                  <For each={[
                    'Syne', 'Bebas Neue', 'Oswald', 'Space Mono', 'JetBrains Mono'
                  ]}>
                    {(gf) => (
                      <option value={gf} style={{ 'font-family': `"${gf}", monospace` }}>
                        {gf}
                      </option>
                    )}
                  </For>
                </optgroup>
              </select>

              {/* Cargar cualquier Google Font por Nombre (1700+ fuentes) */}
              <div class="flex items-center gap-1 mt-1">
                <input 
                  type="text" 
                  placeholder="Cargar cualquier Google Font..." 
                  value={customGFont()} 
                  onInput={(e) => setCustomGFont(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customGFont().trim()) {
                      handleFontSelect(customGFont().trim());
                      setCustomGFont('');
                    }
                  }}
                  class="flex-1 bg-gray-950 border border-gray-700 rounded px-2 py-0.5 text-[10px] text-white focus:outline-none focus:border-emerald-500"
                />
                <button 
                  onClick={() => {
                    if (customGFont().trim()) {
                      handleFontSelect(customGFont().trim());
                      setCustomGFont('');
                    }
                  }}
                  class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-0.5 rounded text-[10px] cursor-pointer"
                >
                  Cargar
                </button>
              </div>

              <label class="mt-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] py-1 px-2 rounded cursor-pointer text-center border border-gray-700 transition">
                + Subir Fuente (.otf/.ttf)
                <input type="file" accept=".otf,.ttf,.woff,.woff2" onChange={handleFileUpload} class="hidden" />
              </label>
            </div>

            {/* Tamaño con Reset */}
            <div>
              <div class="flex justify-between text-[11px] text-gray-400 mb-0.5">
                <span>Tamaño: <strong class="text-emerald-400 font-mono">{style().fontSize}px</strong></span>
                <button 
                  onClick={() => updateActiveElementStyle('fontSize', activeSelection()?.defaultStyle.fontSize || 56)}
                  class="text-[10px] text-gray-500 hover:text-white" title="Reset Tamaño"
                >↺</button>
              </div>
              <FluidSlider min="10" max="280" value={style().fontSize} onChange={(v) => handleRangeInput('fontSize', v)} />
            </div>

            {/* Letter Spacing con Reset */}
            <div>
              <div class="flex justify-between text-[11px] text-gray-400 mb-0.5">
                <span>Espaciado: <strong class="text-emerald-400 font-mono">{style().letterSpacing.toFixed(2)}em</strong></span>
                <button 
                  onClick={() => updateActiveElementStyle('letterSpacing', activeSelection()?.defaultStyle.letterSpacing || 0.04)}
                  class="text-[10px] text-gray-500 hover:text-white" title="Reset Espaciado"
                >↺</button>
              </div>
              <FluidSlider min="-0.2" max="1" step="0.01" value={style().letterSpacing} onChange={(v) => handleRangeInput('letterSpacing', v)} />
            </div>
          </div>

          {/* Columna 2: Transformaciones & Alineación */}
          <div class="flex flex-col gap-2.5 border-r border-gray-800 pr-3">
            <span class="text-[11px] font-bold uppercase text-gray-400 tracking-wider">Estilos & Formato</span>

            {/* Transformaciones: AA, aa, Aa, B, I (Punto 4.c: Negrita desactivada por defecto) */}
            <div>
              <span class="text-[10px] text-gray-400 block mb-1">Transformación de Texto:</span>
              <div class="flex gap-1 flex-wrap">
                <button 
                  onClick={() => updateActiveElementStyle('textTransform', style().textTransform === 'uppercase' ? 'none' : 'uppercase')}
                  class={`px-2 py-1 rounded font-bold border text-xs transition cursor-pointer ${style().textTransform === 'uppercase' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                >AA</button>
                <button 
                  onClick={() => updateActiveElementStyle('textTransform', style().textTransform === 'lowercase' ? 'none' : 'lowercase')}
                  class={`px-2 py-1 rounded font-bold border text-xs transition cursor-pointer ${style().textTransform === 'lowercase' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                >aa</button>
                <button 
                  onClick={() => updateActiveElementStyle('textTransform', style().textTransform === 'capitalize' ? 'none' : 'capitalize')}
                  class={`px-2 py-1 rounded font-bold border text-xs transition cursor-pointer ${style().textTransform === 'capitalize' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                >Aa</button>
                <button 
                  onClick={() => updateActiveElementStyle('fontWeight', style().fontWeight === 'bold' ? 'normal' : 'bold')}
                  class={`px-2 py-1 rounded font-bold border text-xs transition cursor-pointer ${style().fontWeight === 'bold' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                >B</button>
                <button 
                  onClick={() => updateActiveElementStyle('fontStyle', style().fontStyle === 'italic' ? 'normal' : 'italic')}
                  class={`px-2 py-1 rounded italic font-bold border text-xs transition cursor-pointer ${style().fontStyle === 'italic' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                >I</button>
              </div>
            </div>

            {/* Alineación */}
            <div>
              <span class="text-[10px] text-gray-400 block mb-1">Alineación:</span>
              <div class="grid grid-cols-4 gap-1">
                <button 
                  onClick={() => updateActiveElementStyle('textAlign', 'left')}
                  class={`py-1 rounded border text-xs transition cursor-pointer ${style().textAlign === 'left' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                >◧</button>
                <button 
                  onClick={() => updateActiveElementStyle('textAlign', 'center')}
                  class={`py-1 rounded border text-xs transition cursor-pointer ${style().textAlign === 'center' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                >◫</button>
                <button 
                  onClick={() => updateActiveElementStyle('textAlign', 'right')}
                  class={`py-1 rounded border text-xs transition cursor-pointer ${style().textAlign === 'right' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                >◨</button>
                <button 
                  onClick={() => updateActiveElementStyle('textAlign', 'justify')}
                  class={`py-1 rounded border text-xs transition cursor-pointer ${style().textAlign === 'justify' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                >≡</button>
              </div>
            </div>

            {/* OpenType: Ligaduras, Swashes & Sets Estilísticos */}
            <div class="flex flex-col gap-1.5 mt-1 bg-gray-950/70 p-2 rounded-lg border border-gray-800">
              <span class="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center justify-between">
                <span>Adornos & OpenType</span>
                <Show when={fontFeatures()?.stylistic_sets?.length}>
                  <span class="text-[9px] text-emerald-400 font-mono">({fontFeatures()?.stylistic_sets?.length} sets detectados)</span>
                </Show>
              </span>

              <button 
                onClick={() => updateActiveElementStyle('ligatures', !style().ligatures)}
                class={`w-full py-1 rounded font-bold border text-xs transition cursor-pointer ${style().ligatures ? 'bg-purple-600 border-purple-500 text-white shadow-md' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
              >
                {style().ligatures ? '✓ Ligaduras & Adornos Mayúsculas' : 'Activar Ligaduras & Adornos'}
              </button>

              <div>
                <span class="text-[10px] text-gray-400 block mb-0.5">Set Estilístico / Swash:</span>
                <select 
                  value={style().stylisticSet || 'auto'}
                  onChange={(e) => updateActiveElementStyle('stylisticSet', e.currentTarget.value as any)}
                  class="w-full bg-gray-900 border border-gray-700 text-purple-200 font-bold rounded px-1.5 py-1 text-[11px] cursor-pointer focus:outline-none focus:border-purple-400"
                >
                  <option value="auto">✨ Auto (ss01-ss03 Adornos Mayúsculas)</option>
                  <option value="all">👑 Todos los Sets Estilísticos</option>
                  <option value="ss01">Set 1: Mayúsculas Adornadas (ss01)</option>
                  <option value="ss02">Set 2: Swash Alternativo (ss02)</option>
                  <option value="ss03">Set 3: Swash Extendido (ss03)</option>
                  <option value="ss04">Set 4: Variación Especial (ss04)</option>
                  <option value="ss05">Set 5: Variación Especial (ss05)</option>
                  <option value="none">Sin Adornos (Texto Base)</option>
                </select>
              </div>

              <div class="flex gap-1">
                <button 
                  onClick={() => updateActiveElementStyle('swashes', style().swashes === false ? true : false)}
                  class={`flex-1 py-1 rounded font-bold border text-[10px] transition cursor-pointer ${style().swashes !== false ? 'bg-purple-900/80 border-purple-500 text-purple-200' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                  title="Alterna swashes ornamentales"
                >
                  {style().swashes !== false ? '✓ Swash On' : 'Swash Off'}
                </button>
                <button 
                  onClick={() => updateActiveElementStyle('alternates', style().alternates === false ? true : false)}
                  class={`flex-1 py-1 rounded font-bold border text-[10px] transition cursor-pointer ${style().alternates !== false ? 'bg-purple-900/80 border-purple-500 text-purple-200' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                  title="Alterna formas tipográficas estilísticas"
                >
                  {style().alternates !== false ? '✓ Alternates On' : 'Alternates Off'}
                </button>
              </div>

              {/* Botón para abrir/cerrar Paleta de Glifos PUA */}
              <Show when={fontFeatures() && fontFeatures()!.pua_count > 0}>
                <button 
                  onClick={() => setShowGlyphPalette(!showGlyphPalette())}
                  class="w-full mt-1 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold rounded text-[10px] transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>{showGlyphPalette() ? '▲ Ocultar Glifos PUA' : `▼ Paleta de Adornos (${fontFeatures()!.pua_count} glifos)`}</span>
                </button>
              </Show>
            </div>

            {/* Cajón de Paleta de Glifos & Adornos PUA */}
            <Show when={showGlyphPalette() && fontFeatures() && fontFeatures()!.pua_glyphs?.length}>
              <div class="col-span-full bg-gray-950 border border-emerald-800/80 rounded-lg p-2 flex flex-col gap-1.5 max-h-36 overflow-y-auto mt-1">
                <div class="text-[10px] text-gray-400 flex justify-between items-center">
                  <span class="font-bold text-emerald-400">Haz clic en cualquier adorno para insertarlo:</span>
                  <span class="text-gray-500 text-[9px]">{fontFeatures()!.pua_glyphs.length} glifos</span>
                </div>
                <div class="grid grid-cols-8 gap-1">
                  <For each={fontFeatures()!.pua_glyphs}>
                    {(g) => (
                      <button
                        onClick={() => insertGlyph(g.char)}
                        class="p-1 bg-gray-900 hover:bg-emerald-900/60 border border-gray-700 hover:border-emerald-500 rounded text-center cursor-pointer transition flex flex-col items-center justify-center group"
                        title={`${g.name} (${g.hex}) - Clic para insertar`}
                      >
                        <span 
                          style={{ 'font-family': `"${style().fontFamily}", sans-serif` }}
                          class="text-base text-white group-hover:text-emerald-300"
                        >
                          {g.char}
                        </span>
                        <span class="text-[8px] text-gray-500 font-mono truncate max-w-full">{g.hex}</span>
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </div>

          {/* Columna 3: Posición & Transformación */}
          <div class="flex flex-col gap-2">
            <span class="text-[11px] font-bold uppercase text-gray-400 tracking-wider">Posición & Transformación</span>

            {/* Translate X */}
            <div>
              <div class="flex justify-between text-[10px] text-gray-400 mb-0.5">
                <span>X: <strong class="text-emerald-400 font-mono">{style().translateX}px</strong></span>
                <button onClick={() => updateActiveElementStyle('translateX', 0)} class="text-gray-500 hover:text-white">↺</button>
              </div>
              <FluidSlider min="-300" max="300" value={style().translateX} onChange={(v) => handleRangeInput('translateX', v)} />
            </div>

            {/* Translate Y */}
            <div>
              <div class="flex justify-between text-[10px] text-gray-400 mb-0.5">
                <span>Y: <strong class="text-emerald-400 font-mono">{style().translateY}px</strong></span>
                <button onClick={() => updateActiveElementStyle('translateY', 0)} class="text-gray-500 hover:text-white">↺</button>
              </div>
              <FluidSlider min="-300" max="300" value={style().translateY} onChange={(v) => handleRangeInput('translateY', v)} />
            </div>

            {/* Rotación y Espejo */}
            <div class="flex items-center gap-2">
              <div class="flex-1">
                <div class="flex justify-between text-[10px] text-gray-400 mb-0.5">
                  <span>Rot: <strong class="text-emerald-400 font-mono">{style().rotation}°</strong></span>
                  <button onClick={() => updateActiveElementStyle('rotation', 0)} class="text-gray-500 hover:text-white">↺</button>
                </div>
                <FluidSlider min="-180" max="180" value={style().rotation} onChange={(v) => handleRangeInput('rotation', v)} />
              </div>

              <button 
                onClick={() => updateActiveElementStyle('mirror', !style().mirror)}
                class={`px-2 py-1 mt-2 rounded border text-xs font-bold transition cursor-pointer ${style().mirror ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300'}`}
                title="Espejo Horizontal"
              >
                ⇄
              </button>
            </div>

            {/* Botón de Reset General (Punto 4.b) */}
            <button 
              onClick={() => {
                const def = activeSelection()?.defaultStyle;
                if (def) {
                  updateActiveElementStyle('text', '');
                  updateActiveElementStyle('fontFamily', def.fontFamily || 'Plus Jakarta Sans');
                  updateActiveElementStyle('fontSize', def.fontSize);
                  updateActiveElementStyle('letterSpacing', def.letterSpacing);
                  updateActiveElementStyle('lineHeight', def.lineHeight);
                  updateActiveElementStyle('textTransform', def.textTransform);
                  updateActiveElementStyle('fontWeight', 'normal');
                  updateActiveElementStyle('fontStyle', def.fontStyle);
                  updateActiveElementStyle('textAlign', def.textAlign);
                  updateActiveElementStyle('ligatures', def.ligatures);
                  updateActiveElementStyle('translateX', 0);
                  updateActiveElementStyle('translateY', 0);
                  updateActiveElementStyle('rotation', 0);
                  updateActiveElementStyle('mirror', false);
                }
              }}
              class="w-full py-1.5 bg-red-950/90 hover:bg-red-900 border border-red-800 text-red-200 rounded font-bold text-xs transition mt-auto cursor-pointer shadow"
            >
              Restablecer Valores & Fuentes Iniciales
            </button>
          </div>

        </div>
      </div>
    </Show>
  );
};
