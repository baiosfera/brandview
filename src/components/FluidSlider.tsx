import { Component } from 'solid-js';

export interface FluidSliderProps {
  min: string | number;
  max: string | number;
  step?: string | number;
  value: number;
  onChange: (v: number) => void;
  class?: string;
}

export const FluidSlider: Component<FluidSliderProps> = (props) => {
  return (
    <input 
      type="range" 
      min={props.min} 
      max={props.max} 
      step={props.step ?? 1}
      value={typeof props.value === 'number' && !isNaN(props.value) ? props.value : (parseFloat(String(props.min)) || 0)}
      onInput={(e) => {
        const val = parseFloat(e.currentTarget.value);
        if (!isNaN(val)) {
          props.onChange(val);
        }
      }}
      onChange={(e) => {
        const val = parseFloat(e.currentTarget.value);
        if (!isNaN(val)) {
          props.onChange(val);
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      class={`w-full accent-emerald-500 cursor-pointer h-2 bg-gray-800 rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-400 ${props.class || ''}`}
    />
  );
};
