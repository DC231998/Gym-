'use client';

import React from 'react';
import { Disc, AlertCircle, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

export interface FilamentOption {
  id: string;
  brand: string;
  materialType: string;
  name: string;
  colorName: string;
  colorHex: string;
  pricePerGram: number;
  availableGrams: number;
  minStockGrams: number;
}

interface FilamentVisualSelectorProps {
  filaments: FilamentOption[];
  selectedFilamentId: string;
  onSelect: (filament: FilamentOption) => void;
}

export default function FilamentVisualSelector({
  filaments,
  selectedFilamentId,
  onSelect,
}: FilamentVisualSelectorProps) {
  if (!filaments || filaments.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        No hay filamentos registrados en el inventario. Registra uno en el módulo de Filamentos.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Disc className="w-4 h-4 text-brand-400" />
          Filamento e Inventario Visual
        </label>
        <span className="text-xs text-slate-400">{filaments.length} bobinas disponibles</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {filaments.map((fil) => {
          const isSelected = selectedFilamentId === fil.id;
          const isLowStock = fil.availableGrams <= fil.minStockGrams;
          const isLight = ['#f8fafc', '#ffffff', '#cbd5e1'].includes(fil.colorHex.toLowerCase());

          return (
            <button
              key={fil.id}
              type="button"
              onClick={() => onSelect(fil)}
              className={`flex items-start gap-3 p-3 rounded-xl text-left transition-all border relative ${
                isSelected
                  ? 'border-brand-500 bg-brand-950/40 ring-2 ring-brand-500/30 shadow-md'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              {/* Spool / Color Disc */}
              <div
                className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center shadow-md relative ${
                  isLight ? 'border border-slate-400' : 'border border-white/20'
                }`}
                style={{ backgroundColor: fil.colorHex }}
              >
                {/* Center hole for spool look */}
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-white/30" />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                    <Check className="w-4 h-4 text-white stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Filament Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white truncate uppercase tracking-wider">
                    {fil.colorName}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-brand-400 border border-slate-700">
                    {fil.materialType}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{fil.brand}</div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="font-semibold text-slate-200">{formatCurrency(fil.pricePerGram)}/g</span>
                  <span className={`text-[10px] font-medium ${isLowStock ? 'text-amber-400' : 'text-slate-400'}`}>
                    {Math.round(fil.availableGrams)}g disp.
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
