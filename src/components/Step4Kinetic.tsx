import { Component, createSignal, For, Show } from 'solid-js';
import { 
  brandData,
  setCurrentStep, 
  brandDisplayName, 
  brandSlogan,
  definitiveDisplayFont,
  definitiveSloganFont,
  definitiveVectorSvg,
  definitivePrimaryColor,
  definitiveSecondaryColor,
  definitiveAccentColor,
  definitiveKineticPresetId,
  setDefinitiveKineticPresetId,
  definitiveKeyframes
} from '../state';

export class WebAudioSynthesizer {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playTone(freq: number, type: OscillatorType = 'sine', duration: number = 0.1, volume: number = 0.12) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }
}

const synth = new WebAudioSynthesizer();

export const Step4Kinetic: Component = () => {
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [fullscreen, setFullscreen] = createSignal(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = createSignal<number>(0);

  const displayFont = () => definitiveDisplayFont();
  const sloganFont = () => definitiveSloganFont();
  const vectorSvg = () => definitiveVectorSvg();
  const primaryColor = () => definitivePrimaryColor();
  const secondaryColor = () => definitiveSecondaryColor();
  const accentColor = () => definitiveAccentColor();

  const manifest = () => brandData.kinetic_manifest;

  const animationOptions = () => {
    const km = manifest();
    if (!km) return [];
    if (km.animation_options && Array.isArray(km.animation_options)) {
      return km.animation_options;
    }
    return [
      {
        id: 'anim-orbit-precession',
        name: 'Precesión Orbital & Respiración',
        concept: 'Suave, continua, rotación a 24s y pulso a 6s',
        css_keyframes: km.css_keyframes || ''
      }
    ];
  };

  const activeOption = () => {
    const list = animationOptions();
    return list[selectedOptionIndex()] || list[0];
  };

  const isCurrentDefinitive = () => {
    return definitiveKineticPresetId() === activeOption()?.id;
  };

  const handleMarkDefinitive = () => {
    const opt = activeOption();
    if (opt?.id) {
      setDefinitiveKineticPresetId(opt.id);
    }
  };

  const triggerAnimation = () => {
    setIsPlaying(true);
    synth.playTone(523.25, 'sine', 0.12, 0.15); // C5
    setTimeout(() => synth.playTone(659.25, 'sine', 0.15, 0.15), 100); // E5
    setTimeout(() => synth.playTone(783.99, 'sine', 0.25, 0.18), 200); // G5
    setTimeout(() => setIsPlaying(false), 1200);
  };

  return (
    <div class={`flex-1 p-6 overflow-y-auto bg-gray-950 flex flex-col items-center ${
      fullscreen() ? 'fixed inset-0 z-50 bg-gray-950 p-4' : ''
    }`}>
      <div class="max-w-4xl w-full flex flex-col gap-6">
        
        {/* Barra Superior */}
        <div class="flex items-center justify-between flex-wrap gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-md">
          <div>
            <h2 class="text-lg font-black text-white">Fase 4: Motion Design (3 Opciones) & Micro-Audio</h2>
            <p class="text-xs text-gray-400">
              Animaciones 60fps sobre el SVG definitivo de Fase 2 para <span class="text-emerald-400 font-bold font-mono">"{brandDisplayName()}"</span>
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button 
              onClick={() => setFullscreen(!fullscreen())}
              class="bg-gray-800 hover:bg-gray-700 text-white px-2.5 py-1.5 rounded text-xs font-bold border border-gray-700 cursor-pointer"
            >
              {fullscreen() ? '✕ Salir' : '⛶ Fullscreen'}
            </button>

            <button 
              onClick={() => setCurrentStep(3)}
              class="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs px-3 py-1.5 rounded transition cursor-pointer border border-gray-700"
            >
              ⬅ Volver a Colores (Fase 3)
            </button>
            <button 
              onClick={() => setCurrentStep(5)}
              class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded shadow transition cursor-pointer"
            >
              Siguiente: Brandbook Master ➔
            </button>
          </div>
        </div>

        {/* Selector de Opciones de Animación */}
        <div class="flex items-center gap-2 bg-gray-900 p-2 rounded-xl border border-gray-800 shadow">
          <For each={animationOptions()}>
            {(opt, idx) => (
              <button
                onClick={() => setSelectedOptionIndex(idx())}
                class={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer text-center ${
                  selectedOptionIndex() === idx()
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'text-gray-400 hover:text-white bg-gray-950/60'
                }`}
              >
                {opt.name || `Opción ${idx() + 1}`}
              </button>
            )}
          </For>
        </div>

        {/* Visualizador Cinético Real con SVG Animado y Micro-Audio */}
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[420px] shadow-2xl relative overflow-hidden">
          {/* Inyección de CSS Keyframes de la Opción Seleccionada */}
          <Show when={activeOption()?.css_keyframes || manifest()?.css_keyframes}>
            <style innerHTML={activeOption()?.css_keyframes || manifest()?.css_keyframes} />
          </Show>

          {/* Renderizado del SVG con Bucles Cinéticos y Colores de Fase 3 */}
          <div class="w-56 h-56 flex items-center justify-center mb-6 relative">
            <Show 
              when={vectorSvg()}
              fallback={<div class="text-4xl text-gray-700">⬡</div>}
            >
              <div 
                innerHTML={vectorSvg()}
                class={`w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full transition-transform duration-500 ${
                  isPlaying() ? 'scale-110 drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]' : 'scale-100'
                }`}
                style={{
                  color: primaryColor(),
                  stroke: primaryColor(),
                  '--brand-primary': primaryColor(),
                  '--brand-secondary': secondaryColor(),
                  '--brand-accent': accentColor()
                }}
              />
            </Show>
          </div>

          <div class="text-center">
            <div 
              class={`text-3xl md:text-4xl font-black text-white tracking-tight transition-all duration-500 ${
                isPlaying() ? 'text-emerald-400 translate-y-[-4px]' : ''
              }`}
              style={{ 'font-family': `"${displayFont()}", serif` }}
            >
              {brandDisplayName()}
            </div>
            <p 
              class="text-xs uppercase tracking-widest text-gray-400 mt-1 font-semibold"
              style={{ 'font-family': `"${sloganFont()}", sans-serif` }}
            >
              {brandSlogan()}
            </p>
          </div>

          {/* Botón de Marcado como Definitivo */}
          <button
            onClick={handleMarkDefinitive}
            class={`mt-6 px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              isCurrentDefinitive()
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
            }`}
          >
            <span>{isCurrentDefinitive() ? '✓' : '★'}</span>
            {isCurrentDefinitive() ? 'Animación Definitiva Seleccionada' : 'Elegir como Animación Definitiva'}
          </button>

          {/* Controles de Disparo y Banco de Sonido ADSR */}
          <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={triggerAnimation}
              class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-lg hover:scale-105 transition transform active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>▶</span> Probar Acorde de Éxito
            </button>

            <button 
              onClick={() => synth.playTone(587.33, 'sine', 0.06, 0.08)}
              class="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3.5 py-2 rounded-lg border border-gray-700 transition cursor-pointer"
            >
              🔔 Hover (587Hz)
            </button>

            <button 
              onClick={() => synth.playTone(783.99, 'triangle', 0.07, 0.1)}
              class="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3.5 py-2 rounded-lg border border-gray-700 transition cursor-pointer"
            >
              ⚡ Click (784Hz)
            </button>

            <button 
              onClick={() => synth.playTone(440.00, 'sine', 0.2, 0.12)}
              class="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3.5 py-2 rounded-lg border border-gray-700 transition cursor-pointer"
            >
              🏛️ Modal (440Hz)
            </button>
          </div>

          <div class="mt-6 flex items-center gap-4 text-[10px] font-mono text-gray-400">
            <span>FPS Target: <strong class="text-emerald-400">60 FPS</strong></span>
            <span>•</span>
            <span>GSAP Context: <strong class="text-blue-400">Scoped</strong></span>
            <span>•</span>
            <span>Audio: <strong class="text-amber-400">Native Web Audio API ADSR</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
};

