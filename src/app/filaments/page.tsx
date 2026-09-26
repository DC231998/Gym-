'use client';

import React, { useState, useEffect } from 'react';
import {
  Disc,
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  Boxes,
  Edit2,
  Trash2,
  X,
  PackagePlus,
  Thermometer,
  Layers,
} from 'lucide-react';
import VisualColorPicker from '@/components/VisualColorPicker';
import { formatCurrency, calculateFilamentPricePerGram } from '@/lib/calculations';

export default function FilamentsPage() {
  const [filaments, setFilaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilament, setEditingFilament] = useState<any | null>(null);

  // Form Fields
  const [brand, setBrand] = useState('Bambu Lab');
  const [materialType, setMaterialType] = useState('PLA');
  const [customType, setCustomType] = useState('');
  const [name, setName] = useState('');
  const [colorName, setColorName] = useState('Negro Carbón');
  const [colorHex, setColorHex] = useState('#1A1A1A');
  const [purchasePrice, setPurchasePrice] = useState<number>(450);
  const [purchaseWeightGrams, setPurchaseWeightGrams] = useState<number>(1000);
  const [availableGrams, setAvailableGrams] = useState<number>(1000);
  const [supplier, setSupplier] = useState('Bambu Lab Store');
  const [minStockGrams, setMinStockGrams] = useState<number>(200);
  const [density, setDensity] = useState<number>(1.24);
  const [printTemp, setPrintTemp] = useState<number>(220);
  const [bedTemp, setBedTemp] = useState<number>(55);
  const [notes, setNotes] = useState('');

  // Quick Restock Modal
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockFilament, setRestockFilament] = useState<any | null>(null);
  const [restockGrams, setRestockGrams] = useState<number>(1000);
  const [restockCost, setRestockCost] = useState<number>(450);

  useEffect(() => {
    loadFilaments();
  }, []);

  const loadFilaments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/filaments');
      const data = await res.json();
      if (Array.isArray(data)) setFilaments(data);
    } catch (e) {
      console.error('Error fetching filaments:', e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingFilament(null);
    setBrand('Bambu Lab');
    setMaterialType('PLA');
    setCustomType('');
    setName('Bambu PLA Basic Negro');
    setColorName('Negro Carbón');
    setColorHex('#1A1A1A');
    setPurchasePrice(450);
    setPurchaseWeightGrams(1000);
    setAvailableGrams(1000);
    setSupplier('Bambu Lab Store México');
    setMinStockGrams(200);
    setDensity(1.24);
    setPrintTemp(220);
    setBedTemp(55);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (fil: any) => {
    setEditingFilament(fil);
    setBrand(fil.brand);
    setMaterialType(fil.materialType);
    setCustomType('');
    setName(fil.name);
    setColorName(fil.colorName);
    setColorHex(fil.colorHex);
    setPurchasePrice(fil.purchasePrice);
    setPurchaseWeightGrams(fil.purchaseWeightGrams);
    setAvailableGrams(fil.availableGrams);
    setSupplier(fil.supplier || '');
    setMinStockGrams(fil.minStockGrams);
    setDensity(fil.density || 1.24);
    setPrintTemp(fil.printTemp || 215);
    setBedTemp(fil.bedTemp || 60);
    setNotes(fil.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalMaterialType = materialType === 'OTRO' ? customType : materialType;

    const payload = {
      brand,
      materialType: finalMaterialType,
      name: name || `${brand} ${finalMaterialType} ${colorName}`,
      colorName,
      colorHex,
      purchasePrice: Number(purchasePrice),
      purchaseWeightGrams: Number(purchaseWeightGrams),
      availableGrams: Number(availableGrams),
      supplier,
      minStockGrams: Number(minStockGrams),
      density: Number(density),
      printTemp: Number(printTemp),
      bedTemp: Number(bedTemp),
      notes,
    };

    try {
      let res;
      if (editingFilament) {
        res = await fetch('/api/filaments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingFilament.id, ...payload }),
        });
      } else {
        res = await fetch('/api/filaments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }

      setIsModalOpen(false);
      loadFilaments();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockFilament) return;

    try {
      const newAvailable = restockFilament.availableGrams + Number(restockGrams);
      const res = await fetch('/api/filaments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: restockFilament.id,
          availableGrams: newAvailable,
          adjustmentReason: `Reabastecimiento de bobina (+${restockGrams}g)`,
        }),
      });

      if (!res.ok) throw new Error('Error al registrar compra');

      // Record in expenses
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Filamento',
          description: `Compra de bobina: ${restockFilament.brand} ${restockFilament.materialType} ${restockFilament.colorName}`,
          amount: Number(restockCost),
          supplier: restockFilament.supplier,
        }),
      });

      setRestockModalOpen(false);
      loadFilaments();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string, color: string) => {
    if (!confirm(`¿Eliminar la bobina de filamento ${color}?`)) return;
    try {
      const res = await fetch(`/api/filaments?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      loadFilaments();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Distinct brands and types for filter
  const brands = Array.from(new Set(filaments.map((f) => f.brand)));
  const types = Array.from(new Set(filaments.map((f) => f.materialType)));

  const filtered = filaments.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.colorName.toLowerCase().includes(search.toLowerCase()) ||
      f.brand.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'all' || f.materialType === selectedType;
    const matchesBrand = selectedBrand === 'all' || f.brand === selectedBrand;
    return matchesSearch && matchesType && matchesBrand;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Disc className="w-6 h-6 text-brand-400" />
            Inventario de Filamentos & Colores
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro visual con muestra de color real, costo por gramo y control de bobinas
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" /> Registrar Filamento
        </button>
      </div>

      {/* Visual Quick Color Bar requested by user */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>Paleta Visual de Filamentos Disponibles:</span>
          <span className="text-slate-400">{filaments.length} bobinas activas</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {filaments.map((fil) => {
            const isLight = ['#f8fafc', '#ffffff', '#cbd5e1'].includes(fil.colorHex.toLowerCase());
            return (
              <button
                key={fil.id}
                onClick={() => setSearch(fil.colorName)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500/50 flex-shrink-0 transition-colors"
                title={`${fil.colorName} (${fil.materialType}) - ${Math.round(fil.availableGrams)}g disponibles`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${isLight ? 'border border-slate-400' : 'border border-white/20'}`}
                  style={{ backgroundColor: fil.colorHex }}
                />
                <span className="text-xs font-bold text-slate-200 uppercase">{fil.colorName}</span>
                <span className="text-[10px] text-brand-400 font-mono">
                  {Math.round(fil.availableGrams)}g
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por color, marca o nombre..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="all">Todos los Materiales (PLA, PETG, etc.)</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="all">Todas las Marcas</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filaments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((fil) => {
          const isLowStock = fil.availableGrams <= fil.minStockGrams;
          const isLight = ['#f8fafc', '#ffffff', '#cbd5e1'].includes(fil.colorHex.toLowerCase());
          const percentRemaining = Math.min(100, Math.round((fil.availableGrams / fil.purchaseWeightGrams) * 100));

          return (
            <div
              key={fil.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              {/* Header with visual color swatch circle */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg relative ${
                      isLight ? 'border border-slate-400' : 'border border-white/20'
                    }`}
                    style={{ backgroundColor: fil.colorHex }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-white/30" />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-white uppercase">{fil.colorName}</h3>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-brand-400 border border-slate-700">
                        {fil.materialType}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{fil.brand} • {fil.name}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-brand-400">
                    {formatCurrency(fil.pricePerGram)}/g
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono uppercase">{fil.colorHex}</div>
                </div>
              </div>

              {/* Progress bar of available filament */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Gramos Disponibles</span>
                  <span className={`font-mono font-bold ${isLowStock ? 'text-amber-400' : 'text-slate-200'}`}>
                    {Math.round(fil.availableGrams)}g / {fil.purchaseWeightGrams}g
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isLowStock ? 'bg-amber-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${percentRemaining}%` }}
                  />
                </div>
              </div>

              {/* Specs & Temperatures */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-brand-400" />
                  <span>Boquilla: {fil.printTemp || 215}°C</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cama: {fil.bedTemp || 60}°C</span>
                </div>
              </div>

              {/* Actions row */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => {
                    setRestockFilament(fil);
                    setRestockGrams(1000);
                    setRestockCost(fil.purchasePrice);
                    setRestockModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-brand-400 flex items-center gap-1 transition-colors"
                >
                  <PackagePlus className="w-3.5 h-3.5" /> Reabastecer Bobina
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(fil)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Editar filamento"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(fil.id, fil.colorName)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 transition-colors"
                    title="Eliminar filamento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Disc className="w-5 h-5 text-brand-400" />
                {editingFilament ? 'Editar Filamento' : 'Registrar Nuevo Filamento'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Bambu Lab, eSUN, Polymaker..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Material</label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PLA+">PLA+</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                    <option value="ASA">ASA</option>
                    <option value="TPU">TPU</option>
                    <option value="PC">Policarbonato (PC)</option>
                    <option value="OTRO">Personalizado / Otro</option>
                  </select>
                </div>

                {materialType === 'OTRO' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Material Personalizado</label>
                    <input
                      type="text"
                      required
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      placeholder="Ej: PLA Fibra de Carbono, Nylon..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                )}
              </div>

              {/* Visual Color Picker */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <VisualColorPicker
                  selectedHex={colorHex}
                  selectedName={colorName}
                  onChange={(hex, name) => {
                    setColorHex(hex);
                    setColorName(name);
                  }}
                />
              </div>

              {/* Price & Weight Calculations */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Precio Compra ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Peso Comprado (g)</label>
                  <input
                    type="number"
                    value={purchaseWeightGrams}
                    onChange={(e) => setPurchaseWeightGrams(parseFloat(e.target.value) || 1000)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gramos Disponibles</label>
                  <input
                    type="number"
                    value={availableGrams}
                    onChange={(e) => setAvailableGrams(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-400">Precio calculado automáticamente por gramo:</span>
                <span className="font-mono font-bold text-brand-400">
                  {formatCurrency(calculateFilamentPricePerGram(purchasePrice, purchaseWeightGrams))}/g
                </span>
              </div>

              {/* Temps & Supplier */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Temp. Boquilla (°C)</label>
                  <input
                    type="number"
                    value={printTemp}
                    onChange={(e) => setPrintTemp(parseInt(e.target.value) || 215)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Temp. Cama (°C)</label>
                  <input
                    type="number"
                    value={bedTemp}
                    onChange={(e) => setBedTemp(parseInt(e.target.value) || 60)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Mínimo (g)</label>
                  <input
                    type="number"
                    value={minStockGrams}
                    onChange={(e) => setMinStockGrams(parseFloat(e.target.value) || 200)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-slate-950 font-bold text-xs"
                >
                  {editingFilament ? 'Guardar Cambios' : 'Registrar Filamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESTOCK BOBINA MODAL */}
      {restockModalOpen && restockFilament && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PackagePlus className="w-4 h-4 text-brand-400" />
                Reabastecer Bobina: {restockFilament.colorName}
              </h3>
              <button onClick={() => setRestockModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Gramos a Agregar (g)</label>
                <input
                  type="number"
                  required
                  value={restockGrams}
                  onChange={(e) => setRestockGrams(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Costo de la Compra ($)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={restockCost}
                  onChange={(e) => setRestockCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Se registrará automáticamente en el módulo de Gastos bajo la categoría &ldquo;Filamento&rdquo;.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs"
                >
                  Confirmar Reabastecimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
