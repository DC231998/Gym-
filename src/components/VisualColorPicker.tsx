'use client';

import React, { useState } from 'react';
import { Check, Palette } from 'lucide-react';

export interface PredefinedColor {
  name: string;
  hex: string;
}

export const POPULAR_FILAMENT_COLORS: PredefinedColor[] = [
  { name: 'Negro Carbón', hex: '#1A1A1A' },
  { name: 'Blanco Jade', hex: '#F8FAFC' },
  { name: 'Rojo Fuego', hex: '#DC2626' },
  { name: 'Azul Real', hex: '#2563EB' },
  { name: 'Verde Esmeralda', hex: '#16A34A' },
  { name: 'Amarillo Solar', hex: '#EAB308' },
  { name: 'Naranja Neón', hex: '#EA580C' },
  { name: 'Gris Espacial', hex: '#64748B' },
  { name: 'Morado Galaxia', hex: '#9333EA' },
  { name: 'Rosa Pastel', hex: '#F472B6' },
  { name: 'Dorado Silk', hex: '#D97706' },
  { name: 'Cristal Transparente', hex: '#CBD5E1' },
];

interface VisualColorPickerProps {
  selectedHex: string;
  selectedName: string;
  onChange: (hex: string, name: string) => void;
  label?: string;
}

export default function VisualColorPicker({
  selectedHex,
  selectedName,
  onChange,
  label = 'Color del Filamento',
}: VisualColorPickerProps) {
  const [customHex, setCustomHex] = useState(selectedHex || '#1A1A1A');
  const [customName, setCustomName] = useState(selectedName || 'Personalizado');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleSelectPreset = (preset: PredefinedColor) => {
    setIsCustomMode(false);
    setCustomHex(preset.hex);
    setCustomName(preset.name);
    onChange(preset.hex, preset.name);
  };

  const handleCustomHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setCustomHex(hex);
    setIsCustomMode(true);
    onChange(hex, customName || 'Color Personalizado');
  };

  const handleCustomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setCustomName(name);
    onChange(customHex, name || 'Color Personalizado');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Palette className="w-4 h-4 text-brand-400" />
          {label}
        </label>
        <div className="flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
            style={{ backgroundColor: selectedHex }}
          />
          <span className="font-medium text-slate-300">{selectedName || 'Sin color'}</span>
          <span className="text-slate-400 font-mono text-[10px]">{selectedHex}</span>
        </div>
      </div>

      {/* Grid of Visual Color Swatches */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {POPULAR_FILAMENT_COLORS.map((preset) => {
          const isSelected = selectedHex.toLowerCase() === preset.hex.toLowerCase();
          const isLight = ['#f8fafc', '#ffffff', '#cbd5e1'].includes(preset.hex.toLowerCase());

          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all border ${
                isSelected
                  ? 'border-brand-400 bg-brand-950/40 text-white ring-2 ring-brand-400/30 shadow-md'
                  : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center shadow-inner ${
                  isLight ? 'border border-slate-400' : 'border border-white/20'
                }`}
                style={{ backgroundColor: preset.hex }}
              >
                {isSelected && (
                  <Check
                    className={`w-3 h-3 ${isLight ? 'text-slate-900 stroke-[3]' : 'text-white stroke-[3]'}`}
                  />
                )}
              </span>
              <span className="text-xs font-medium truncate uppercase">{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Color Selector Section */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap sm:flex-nowrap items-center gap-2">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex-1">
          <input
            type="color"
            value={customHex.startsWith('#') && customHex.length === 7 ? customHex : '#1A1A1A'}
            onChange={handleCustomHexChange}
            className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
            title="Seleccionar color exacto"
          />
          <input
            type="text"
            value={customHex}
            onChange={handleCustomHexChange}
            placeholder="#HEX"
            className="w-20 bg-transparent text-xs text-slate-200 font-mono focus:outline-none uppercase"
          />
          <input
            type="text"
            value={customName}
            onChange={handleCustomNameChange}
            placeholder="Nombre de color personalizado"
            className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
