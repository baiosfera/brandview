import { Component, onMount, Show } from 'solid-js';
import { Header } from './components/Header';
import { FloatingPanel } from './components/FloatingPanel';
import { Step1Fonts } from './components/Step1Fonts';
import { Step2Symbol } from './components/Step2Symbol';
import { Step3Chroma } from './components/Step3Chroma';
import { Step4Kinetic } from './components/Step4Kinetic';
import { Step5Brandbook } from './components/Step5Brandbook';
import { 
  currentStep, 
  globalFullscreen, 
  setGlobalFullscreen, 
  loadBrands, 
  loadActiveBrand, 
  loadEnvatoFonts,
  activeBrandId
} from './state';

export const App: Component = () => {
  onMount(async () => {
    await loadBrands();
    await loadActiveBrand(activeBrandId());
    await loadEnvatoFonts();
  });

  return (
    <div class="h-screen w-screen flex flex-col overflow-hidden font-sans select-none bg-gray-950 text-gray-100">
      {/* Header Principal */}
      <Header />

      {/* Contenedor Principal según el Paso Activo */}
      <div class={`flex-1 flex flex-col overflow-hidden relative ${
        globalFullscreen() ? 'fullscreen-active bg-gray-950' : ''
      }`}>
        <Show when={currentStep() === 1}>
          <Step1Fonts />
        </Show>
        <Show when={currentStep() === 2}>
          <Step2Symbol />
        </Show>
        <Show when={currentStep() === 3}>
          <Step3Chroma />
        </Show>
        <Show when={currentStep() === 4}>
          <Step4Kinetic />
        </Show>
        <Show when={currentStep() === 5}>
          <Step5Brandbook />
        </Show>

        {/* Botón de Cierre para Fullscreen Global */}
        <Show when={globalFullscreen()}>
          <button 
            onClick={() => setGlobalFullscreen(false)}
            class="fixed top-4 right-4 z-[999999] bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 text-xl font-bold shadow-2xl flex items-center justify-center transition transform hover:scale-110 cursor-pointer"
            title="Salir de Pantalla Completa"
          >
            ✕
          </button>
        </Show>
      </div>

      {/* Panel Flotante Arrastrable */}
      <FloatingPanel />
    </div>
  );
};

export default App;
