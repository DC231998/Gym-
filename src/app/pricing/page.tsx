'use client';

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Save,
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  Plus,
  RefreshCw,
  Box,
} from 'lucide-react';
import FilamentVisualSelector, { FilamentOption } from '@/components/FilamentVisualSelector';
import VisualColorPicker from '@/components/VisualColorPicker';
import { calculateRealProductPricing, formatCurrency } from '@/lib/calculations';

export default function PricingCalculatorPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filaments, setFilaments] = useState<FilamentOption[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState<string>('new');
  const [productName, setProductName] = useState('');
  const [productSku, setProductSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [seasonId, setSeasonId] = useState('');

  // Filament Selection
  const [selectedFilament, setSelectedFilament] = useState<FilamentOption | null>(null);
  const [filamentColorHex, setFilamentColorHex] = useState('#1A1A1A');
  const [filamentColorName, setFilamentColorName] = useState('Negro Carbón');

  // Specs & Inputs
  const [weightGrams, setWeightGrams] = useState<number>(50);
  const [printHours, setPrintHours] = useState<number>(1.5);
  const [quantityPieces, setQuantityPieces] = useState<number>(1);
  const [failureRatePercent, setFailureRatePercent] = useState<number>(5);

  // Electricity
  const [powerWatts, setPowerWatts] = useState<number>(150);
  const [electricityRate, setElectricityRate] = useState<number>(2.15);

  // Depreciation
  const [depreciationEnabled, setDepreciationEnabled] = useState<boolean>(true);
  const [printerPrice, setPrinterPrice] = useState<number>(21999);
  const [printerResidual, setPrinterResidual] = useState<number>(4000);
  const [printerLifespan, setPrinterLifespan] = useState<number>(6000);

  // Labor & Other
  const [laborEnabled, setLaborEnabled] = useState<boolean>(true);
  const [laborRatePerHour, setLaborRatePerHour] = useState<number>(60);
  const [laborHours, setLaborHours] = useState<number>(0.25);
  const [otherCosts, setOtherCosts] = useState<number>(0);

  // Margin & Rounding
  const [marginPercent, setMarginPercent] = useState<number>(50);
  const [roundPrices, setRoundPrices] = useState<boolean>(true);

  // Status & Feedback
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, filRes, catRes, seaRes, setRes] = await Promise.all([
          fetch('/api/products').then((r) => r.json()),
          fetch('/api/filaments').then((r) => r.json()),
          fetch('/api/categories').then((r) => r.json()),
          fetch('/api/seasons').then((r) => r.json()),
          fetch('/api/settings').then((r) => r.json()),
        ]);

        if (Array.isArray(prodRes)) setProducts(prodRes);
        if (Array.isArray(filRes)) {
          setFilaments(filRes);
          if (filRes.length > 0) {
            setSelectedFilament(filRes[0]);
            setFilamentColorHex(filRes[0].colorHex);
            setFilamentColorName(filRes[0].colorName);
          }
        }
        if (Array.isArray(catRes)) {
          setCategories(catRes);
          if (catRes.length > 0) setCategoryId(catRes[0].id);
        }
        if (Array.isArray(seaRes)) {
          setSeasons(seaRes);
          if (seaRes.length > 0) setSeasonId(seaRes[0].id);
        }
        if (setRes) {
          setSettings(setRes);
          if (setRes.defaultElectricityRate) setElectricityRate(setRes.defaultElectricityRate);
          if (setRes.defaultLaborRatePerHour) setLaborRatePerHour(setRes.defaultLaborRatePerHour);
          if (setRes.defaultMarginPercent) setMarginPercent(setRes.defaultMarginPercent);
          if (setRes.defaultRoundPrices !== undefined) setRoundPrices(setRes.defaultRoundPrices);
        }
      } catch (e) {
        console.error('Error loading pricing data:', e);
      }
    }
    loadData();
  }, []);

  // When an existing product is selected, populate values
  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    setSavedSuccess(null);
    if (id === 'new') {
      setProductName('');
      setProductSku('');
      setWeightGrams(50);
      setPrintHours(1.5);
      return;
    }

    const prod = products.find((p) => p.id === id);
    if (prod) {
      setProductName(prod.name);
      setProductSku(prod.sku);
      setCategoryId(prod.categoryId);
      setSeasonId(prod.seasonId);
      setWeightGrams(prod.weightGrams);
      setPrintHours(Number(((prod.printTimeMinutes || 0) / 60).toFixed(2)));
      setMarginPercent(prod.marginPercent || 50);
      setOtherCosts(prod.otherCosts || 0);
      if (prod.filament) {
        setSelectedFilament(prod.filament);
        setFilamentColorHex(prod.defaultColorHex || prod.filament.colorHex);
        setFilamentColorName(prod.defaultColorName || prod.filament.colorName);
      }
    }
  };

  // Execute precise calculation
  const calculation = calculateRealProductPricing({
    filamentPricePerGram: selectedFilament?.pricePerGram || 0.46,
    weightGrams: weightGrams * Math.max(1, quantityPieces),
    failureRatePercent,
    powerWatts,
    printTimeHours: printHours * Math.max(1, quantityPieces),
    electricityRatePerKwh: electricityRate,
    depreciationEnabled,
    printerPurchasePrice: printerPrice,
    printerResidualValue: printerResidual,
    printerLifespanHours: printerLifespan,
    laborRatePerHour: laborEnabled ? laborRatePerHour : 0,
    laborHours: laborEnabled ? laborHours : 0,
    otherCosts: otherCosts * Math.max(1, quantityPieces),
    marginPercent,
    roundPrices,
  });

  // Save / Update product
  const handleSaveProduct = async () => {
    if (!productName.trim()) {
      alert('Por favor introduce el nombre del producto');
      return;
    }
    if (!categoryId || !seasonId) {
      alert('Por favor selecciona una categoría y temporada');
      return;
    }

    setIsSaving(true);
    setSavedSuccess(null);

    const payload = {
      name: productName,
      sku: productSku || `PRD-${Date.now().toString(36).toUpperCase()}`,
      categoryId,
      seasonId,
      primaryFilamentId: selectedFilament?.id || null,
      defaultColorHex: filamentColorHex,
      defaultColorName: filamentColorName,
      weightGrams,
      printTimeMinutes: Math.round(printHours * 60),
      failureRatePercent,
      filamentCost: calculation.totalFilamentCost,
      electricityCost: calculation.electricityCost,
      depreciationCost: calculation.depreciationCost,
      laborCost: calculation.laborCost,
      otherCosts: calculation.otherCosts,
      realCost: calculation.realCost,
      marginPercent,
      salePrice: calculation.finalPrice,
    };

    try {
      let res;
      if (selectedProductId !== 'new') {
        res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedProductId, ...payload }),
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al guardar');

      setSavedSuccess(`¡Producto "${json.name}" guardado exitosamente con precio de ${formatCurrency(json.salePrice)}!`);
      // Refresh products list
      const refreshed = await fetch('/api/products').then((r) => r.json());
      setProducts(refreshed);
      if (selectedProductId === 'new') {
        setSelectedProductId(json.id);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Calculator className="w-6 h-6 text-brand-400" />
            Fijador de Precios & Costeo Real
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cálculo matemático exacto: filamento + merma + luz CFE + depreciación + margen
          </p>
        </div>

        {savedSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{savedSuccess}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Seleccionar o Crear Producto */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                <Box className="w-4 h-4" /> Paso 1: Producto a Costear
              </span>
              <button
                type="button"
                onClick={() => handleProductSelect('new')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Nuevo producto
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Producto Existente</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="new">-- Crear Nuevo Producto --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ej: Llavero Hexagonal Personalizado"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Categoría</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Temporada</label>
                <select
                  value={seasonId}
                  onChange={(e) => setSeasonId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2 & 3. Filamento e Inventario Visual */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Paso 2 y 3: Selección Visual de Filamento y Color
            </span>

            <FilamentVisualSelector
              filaments={filaments}
              selectedFilamentId={selectedFilament?.id || ''}
              onSelect={(fil) => {
                setSelectedFilament(fil);
                setFilamentColorHex(fil.colorHex);
                setFilamentColorName(fil.colorName);
              }}
            />

            <div className="pt-3 border-t border-slate-800">
              <VisualColorPicker
                label="Muestra Visual de Color Específico"
                selectedHex={filamentColorHex}
                selectedName={filamentColorName}
                onChange={(hex, name) => {
                  setFilamentColorHex(hex);
                  setFilamentColorName(name);
                }}
              />
            </div>
          </div>

          {/* 4, 5, 6, 7. Peso, Horas, Piezas y Desperdicio */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Paso 4 al 7: Parámetros de Impresión
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Gramos por Pieza</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-7 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">g</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Horas de Impresión</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={printHours}
                    onChange={(e) => setPrintHours(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-7 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">h</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cantidad de Piezas</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantityPieces}
                  onChange={(e) => setQuantityPieces(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Desperdicio / Merma</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={failureRatePercent}
                    onChange={(e) => setFailureRatePercent(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-7 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 8, 9, 10. Electricidad CFE, Depreciación, Mano de Obra y Otros */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Paso 8 al 10: Costos Indirectos & Depreciación
            </span>

            {/* Electricidad CFE Tarímbaro */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Electricidad CFE (Tarímbaro, Mich.)</span>
                <span className="text-[11px] font-mono text-brand-400 font-semibold">
                  {formatCurrency(calculation.electricityCost)} ({calculation.kwhConsumed} kWh)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Consumo Impresora (Watts)</label>
                  <input
                    type="number"
                    value={powerWatts}
                    onChange={(e) => setPowerWatts(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tarifa CFE ($/kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={electricityRate}
                    onChange={(e) => setElectricityRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Depreciación Bambu Lab P1S Combo */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                  <input
                    type="checkbox"
                    checked={depreciationEnabled}
                    onChange={(e) => setDepreciationEnabled(e.target.checked)}
                    className="rounded border-slate-700 text-brand-500 focus:ring-brand-500"
                  />
                  Depreciación de Impresora ({formatCurrency(calculation.depreciationPerHour)}/hora)
                </label>
                <span className="text-[11px] font-mono text-slate-300 font-semibold">
                  {formatCurrency(calculation.depreciationCost)}
                </span>
              </div>
              {depreciationEnabled && (
                <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                  <div>Compra: {formatCurrency(printerPrice)}</div>
                  <div>Residual: {formatCurrency(printerResidual)}</div>
                  <div>Vida útil: {printerLifespan}h</div>
                </div>
              )}
            </div>

            {/* Mano de Obra y Otros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                    <input
                      type="checkbox"
                      checked={laborEnabled}
                      onChange={(e) => setLaborEnabled(e.target.checked)}
                      className="rounded border-slate-700 text-brand-500 focus:ring-brand-500"
                    />
                    Mano de Obra
                  </label>
                  <span className="text-[11px] font-mono text-slate-300 font-semibold">
                    {formatCurrency(calculation.laborCost)}
                  </span>
                </div>
                {laborEnabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">$/hora</span>
                      <input
                        type="number"
                        value={laborRatePerHour}
                        onChange={(e) => setLaborRatePerHour(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Horas prep/post</span>
                      <input
                        type="number"
                        step="0.05"
                        value={laborHours}
                        onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Otros Costos (Empaque/Accesorios)</span>
                  <span className="text-[11px] font-mono text-slate-300 font-semibold">
                    {formatCurrency(calculation.otherCosts)}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={otherCosts}
                  onChange={(e) => setOtherCosts(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Breakdown Card & Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-5 sticky top-20">
          {/* Main Visual Breakdown requested in prompt */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-brand-500/30 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold tracking-wider uppercase text-brand-400">
                Desglose de Costo Real
              </span>
              <span className="text-xs text-slate-400">
                {quantityPieces > 1 ? `${quantityPieces} piezas` : '1 pieza'}
              </span>
            </div>

            {/* Individual Breakdown Line Items */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">FILAMENTO (Base + {failureRatePercent}% merma):</span>
                <span className="font-mono font-bold text-slate-200">
                  {formatCurrency(calculation.totalFilamentCost)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">ELECTRICIDAD (CFE 150W):</span>
                <span className="font-mono font-bold text-slate-200">
                  {formatCurrency(calculation.electricityCost)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">DEPRECIACIÓN (P1S Combo):</span>
                <span className="font-mono font-bold text-slate-200">
                  {formatCurrency(calculation.depreciationCost)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">MANO DE OBRA:</span>
                <span className="font-mono font-bold text-slate-200">
                  {formatCurrency(calculation.laborCost)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">OTROS COSTOS:</span>
                <span className="font-mono font-bold text-slate-200">
                  {formatCurrency(calculation.otherCosts)}
                </span>
              </div>

              {/* Total Real Cost Divider */}
              <div className="pt-3 border-t-2 border-dashed border-slate-700/80 flex items-center justify-between">
                <span className="text-sm font-black text-white">COSTO REAL:</span>
                <span className="font-mono text-base font-black text-rose-400">
                  {formatCurrency(calculation.realCost)}
                </span>
              </div>
            </div>

            {/* Margins & Rounding Section */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Margen de Ganancia:</span>
                <span className="text-brand-400 font-mono font-bold">{marginPercent}%</span>
              </div>

              {/* Quick Margin Pills */}
              <div className="grid grid-cols-5 gap-1.5">
                {[20, 30, 40, 50, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMarginPercent(m)}
                    className={`py-1 rounded-lg text-xs font-bold transition-all ${
                      marginPercent === m
                        ? 'bg-brand-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {m}%
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="text-xs text-slate-400 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roundPrices}
                    onChange={(e) => setRoundPrices(e.target.checked)}
                    className="rounded border-slate-700 text-brand-500"
                  />
                  Redondear precio comercial (ej. $147 → $150)
                </label>
              </div>
            </div>

            {/* Pricing Results */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-950/80 to-slate-950 border border-brand-500/40 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-brand-300 uppercase tracking-wider">
                  PRECIO DE VENTA SUGERIDO:
                </span>
                <span className="text-2xl sm:text-3xl font-black text-brand-400 tracking-tight font-mono">
                  {formatCurrency(calculation.finalPrice)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-brand-900/60">
                <span className="text-slate-300">GANANCIA NETA POR VENTA:</span>
                <span className="font-mono font-bold text-emerald-400">
                  +{formatCurrency(calculation.profit)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Margen Efectivo:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {calculation.effectiveMarginPercent}%
                </span>
              </div>
            </div>

            {/* Save Product Button */}
            <button
              type="button"
              onClick={handleSaveProduct}
              disabled={isSaving}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Guardando producto...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Guardar Producto con Este Precio
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
