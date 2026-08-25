import { Component, For, Show } from 'solid-js';
import { 
  brands, 
  activeBrandId, 
  setActiveBrandId, 
  loadActiveBrand, 
  currentStep, 
  setCurrentStep, 
  gridCols, 
  setGridCols, 
  globalFullscreen, 
  setGlobalFullscreen,
  brandData,
  selectedVersion
} from '../state';

export const Header: Component = () => {
  const steps = [
    { num: 1, label: '1. Fuentes & Workbench' },
    { num: 2, label: '2. Isologo SVG' },
    { num: 3, label: '3. Colores OKLCH' },
    { num: 4, label: '4. Kinetic & Audio' },
    { num: 5, label: '5. Brandbook Master' }
  ];

  const handleBrandChange = (e: Event) => {
    const val = (e.target as HTMLSelectElement).value;
    setActiveBrandId(val);
    loadActiveBrand(val);
  };

  const handleVersionChange = (e: Event) => {
    const ver = (e.target as HTMLSelectElement).value;
    loadActiveBrand(activeBrandId(), ver);
  };

  return (
    <Show when={!globalFullscreen()}>
      <header class="bg-gray-900 border-b border-gray-800 shrink-0 w-full flex items-center justify-between px-4 py-2.5 gap-4 flex-wrap z-20 shadow-md">
        
        {/* Selector Unificado de Cliente y Versiones Fontgen (Punto 1.a) */}
        <div class="flex items-center gap-2.5 flex-wrap">
          <span class="text-xs font-black tracking-widest text-emerald-400 bg-emerald-950/90 border border-emerald-800 px-2.5 py-1 rounded shadow-inner">
            BRANDVIEW
          </span>

          <select 
            value={(() => {
              const currentBrand = brands().find((b: any) => b.id === activeBrandId());
              if (!currentBrand) return `${activeBrandId()}::latest`;
              const vers = currentBrand.fontgen_versions || [];
              if (vers.length > 1) {
                if (selectedVersion() && vers.includes(selectedVersion())) {
                  return `${activeBrandId()}::${selectedVersion()}`;
                }
                return `${activeBrandId()}::${vers[0]}`;
              }
              return `${activeBrandId()}::latest`;
            })()} 
            onChange={(e) => {
              const [brandId, ver] = e.currentTarget.value.split('::');
              setActiveBrandId(brandId);
              loadActiveBrand(brandId, ver || 'latest');
            }}
            class="bg-gray-950 border border-gray-700 text-white font-bold text-xs rounded px-3 py-1.5 focus:outline-none focus:border-emerald-500 transition cursor-pointer shadow-sm min-w-[220px]"
          >
            <For each={brands()}>
              {(b: any) => {
                const versions = () => b.fontgen_versions || [];
                return (
                  <Show 
                    when={versions().length > 1} 
                    fallback={<option value={`${b.id}::latest`}>{b.name}</option>}
                  >
                    <optgroup label={b.name}>
                      <For each={versions()}>
                        {(v: string, idx) => (
                          <option value={`${b.id}::${v}`}>
                            {b.name} — {v.toUpperCase()} {idx() === 0 ? '(Actual)' : ''}
                          </option>
                        )}
                      </For>
                    </optgroup>
                  </Show>
                );
              }}
            </For>
          </select>
        </div>

        {/* Pestañas de Etapas Secuenciales */}
        <nav class="bg-gray-950 border border-gray-800 flex items-center gap-1 p-1 rounded-lg overflow-x-auto">
          <For each={steps}>
            {(s) => (
              <button
                onClick={() => setCurrentStep(s.num)}
                class={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  currentStep() === s.num
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <span>{s.label}</span>
                {currentStep() > s.num && <span class="text-emerald-300 text-[10px]">✓</span>}
              </button>
            )}
          </For>
        </nav>

        {/* Controles: Grid & Fullscreen */}
        <div class="flex items-center gap-2.5">
          {/* Selector de Columnas Grid */}
          <div class="bg-gray-950 border border-gray-800 flex items-center gap-1 rounded p-1 text-xs">
            <span class="text-gray-400 px-1 text-[10px]">Grid:</span>
            <button 
              onClick={() => setGridCols(1)}
              class={`px-2 py-0.5 rounded text-xs transition cursor-pointer ${gridCols() === 1 ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:bg-gray-700/50'}`}
            >1</button>
            <button 
              onClick={() => setGridCols(2)}
              class={`px-2 py-0.5 rounded text-xs transition cursor-pointer ${gridCols() === 2 ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:bg-gray-700/50'}`}
            >2</button>
            <button 
              onClick={() => setGridCols(3)}
              class={`px-2 py-0.5 rounded text-xs transition cursor-pointer ${gridCols() === 3 ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:bg-gray-700/50'}`}
            >3</button>
          </div>

          {/* Fullscreen Global */}
          <button 
            onClick={() => setGlobalFullscreen(true)}
            class="bg-gray-800 hover:bg-gray-700 text-white px-2.5 py-1.5 rounded text-xs font-bold border border-gray-700 transition cursor-pointer shadow-sm"
            title="Pantalla Completa Global (Oculta barras)"
          >
            ⛶ Global
          </button>
        </div>
      </header>
    </Show>
  );
};
