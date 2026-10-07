import { createSignal, createEffect, onCleanup } from 'solid-js';

export const FluidSlider = (props: { min: string|number; max: string|number; value: number; onChange: (v: number) => void }) => {
  const [local, setLocal] = createSignal(props.value);
  let inputRef: HTMLInputElement | undefined;

  // Sync from props ONLY if not dragging
  createEffect(() => {
    if (document.activeElement !== inputRef) {
      setLocal(props.value);
    }
  });

  return (
    <input 
      ref={inputRef}
      type="range" 
      min={props.min} 
      max={props.max} 
      value={local()}
      onInput={(e) => {
        const val = parseFloat(e.currentTarget.value);
        setLocal(val);
        props.onChange(val);
      }}
      class="w-full accent-emerald-500 cursor-pointer h-1.5"
    />
  );
};
