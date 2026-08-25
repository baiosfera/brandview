import { Component, Show, For } from 'solid-js';
import { 
  floatingPanel, 
  setFloatingPanel,
  activeSelection, 
  clearSelection,
  getActiveElementStyle, 
  updateActiveElementStyle,
  envatoFonts,
  selectedEcosystem
} from '../state';
import { loadFontDynamically } from '../utils/fontLoader';

export const FloatingPanel: Component = () => {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initX = 0;
  let initY = 0;

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

  const handleFontSelect = async (fontName: string) => {
    if (!fontName) return;
    const clean = fontName.replace(/\.(otf|ttf|woff|woff2)$/i, '').trim();
    await loadFontDynamically(clean);
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
        onMouseDown={(e) => e.stopPropagation()}
        style={{ left: `${floatingPanel.x}px`, top: `${floatingPanel.y}px` }}
        class="fixed z-[999995] bg-gray-900/98 backdrop-blur-lg border border-emerald-500/80 rounded-xl shadow-2xl w-[720px] max-w-[95vw] flex flex-col text-xs text-gray-200 overflow-hidden select-none"
      >
        {/* Header Arrastrable (Punto 5.a - Fluido con Pointer Events) */}
        <div 
          onPointerDown={handlePanelPointerDown}
          onPointerMove={handlePanelPointerMove}
          onPointerUp={handlePanelPointerUp}
          onPointerCancel={handlePanelPointerUp}
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
                <optgroup label="Google Fonts">
                  <For each={[
                    'Plus Jakarta Sans', 'Inter', 'Space Grotesk', 'Urbanist', 'Manrope', 
                    'Host Grotesk', 'Hanken Grotesk', 'Playfair Display', 'Cinzel', 'Montserrat'
                  ]}>
                    {(gf) => (
                      <option value={gf} style={{ 'font-family': `"${gf}", sans-serif` }}>
                        {gf}
                      </option>
                    )}
                  </For>
                </optgroup>
              </select>

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
              <input 
                type="range" min="10" max="280" value={style().fontSize}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onInput={(e) => updateActiveElementStyle('fontSize', parseFloat(e.currentTarget.value))}
                class="w-full accent-emerald-500 cursor-pointer h-1.5"
              />
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
              <input 
                type="range" min="-0.2" max="1" step="0.01" value={style().letterSpacing}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onInput={(e) => updateActiveElementStyle('letterSpacing', parseFloat(e.currentTarget.value))}
                class="w-full accent-emerald-500 cursor-pointer h-1.5"
              />
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

            {/* Ligaduras OpenType */}
            <button 
              onClick={() => updateActiveElementStyle('ligatures', !style().ligatures)}
              class={`w-full py-1 rounded font-bold border text-xs transition cursor-pointer ${style().ligatures ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
            >
              {style().ligatures ? '✓ Ligaduras Activadas' : 'Activar Ligaduras OpenType'}
            </button>
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
              <input 
                type="range" min="-300" max="300" value={style().translateX}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onInput={(e) => updateActiveElementStyle('translateX', parseFloat(e.currentTarget.value))}
                class="w-full accent-emerald-500 cursor-pointer h-1.5"
              />
            </div>

            {/* Translate Y */}
            <div>
              <div class="flex justify-between text-[10px] text-gray-400 mb-0.5">
                <span>Y: <strong class="text-emerald-400 font-mono">{style().translateY}px</strong></span>
                <button onClick={() => updateActiveElementStyle('translateY', 0)} class="text-gray-500 hover:text-white">↺</button>
              </div>
              <input 
                type="range" min="-300" max="300" value={style().translateY}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onInput={(e) => updateActiveElementStyle('translateY', parseFloat(e.currentTarget.value))}
                class="w-full accent-emerald-500 cursor-pointer h-1.5"
              />
            </div>

            {/* Rotación y Espejo */}
            <div class="flex items-center gap-2">
              <div class="flex-1">
                <div class="flex justify-between text-[10px] text-gray-400 mb-0.5">
                  <span>Rot: <strong class="text-emerald-400 font-mono">{style().rotation}°</strong></span>
                  <button onClick={() => updateActiveElementStyle('rotation', 0)} class="text-gray-500 hover:text-white">↺</button>
                </div>
                <input 
                  type="range" min="-180" max="180" value={style().rotation}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onInput={(e) => updateActiveElementStyle('rotation', parseFloat(e.currentTarget.value))}
                  class="w-full accent-emerald-500 cursor-pointer h-1.5"
                />
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
