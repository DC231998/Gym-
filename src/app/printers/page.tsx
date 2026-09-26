'use client';

import React, { useState, useEffect } from 'react';
import {
  Printer,
  Plus,
  Wrench,
  Clock,
  Zap,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import {
  formatCurrency,
  calculateDepreciationPerHour,
  calculateDepreciationCost,
} from '@/lib/calculations';

export default function PrintersPage() {
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Printer Modal
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<any | null>(null);

  // Printer Form Fields
  const [brand, setBrand] = useState('Bambu Lab');
  const [model, setModel] = useState('P1S Combo');
  const [name, setName] = useState('Bambu Lab P1S Combo Principal');
  const [purchasePrice, setPurchasePrice] = useState<number>(21999);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [powerWatts, setPowerWatts] = useState<number>(150);
  const [accumulatedHours, setAccumulatedHours] = useState<number>(342.5);
  const [lifespanHours, setLifespanHours] = useState<number>(6000);
  const [residualValue, setResidualValue] = useState<number>(4000);
  const [depreciationEnabled, setDepreciationEnabled] = useState<boolean>(true);
  const [notes, setNotes] = useState('');

  // Maintenance Modal
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [activePrinterForMaint, setActivePrinterForMaint] = useState<any | null>(null);
  const [maintType, setMaintType] = useState('Lubricación de varillas de carbono y husillos Z');
  const [maintCost, setMaintCost] = useState<number>(0);
  const [maintHours, setMaintHours] = useState<number>(342);
  const [maintDesc, setMaintDesc] = useState('');
  const [maintNextHours, setMaintNextHours] = useState<number>(500);

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/printers');
      const data = await res.json();
      if (Array.isArray(data)) setPrinters(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreatePrinter = () => {
    setEditingPrinter(null);
    setBrand('Bambu Lab');
    setModel('P1S Combo');
    setName('Bambu Lab P1S Combo #' + (printers.length + 1));
    setPurchasePrice(21999);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPowerWatts(150);
    setAccumulatedHours(0);
    setLifespanHours(6000);
    setResidualValue(4000);
    setDepreciationEnabled(true);
    setNotes('');
    setIsPrinterModalOpen(true);
  };

  const openEditPrinter = (p: any) => {
    setEditingPrinter(p);
    setBrand(p.brand);
    setModel(p.model);
    setName(p.name);
    setPurchasePrice(p.purchasePrice);
    setPurchaseDate(p.purchaseDate ? p.purchaseDate.split('T')[0] : '');
    setPowerWatts(p.powerWatts);
    setAccumulatedHours(p.accumulatedHours);
    setLifespanHours(p.lifespanHours);
    setResidualValue(p.residualValue);
    setDepreciationEnabled(p.depreciationEnabled);
    setNotes(p.notes || '');
    setIsPrinterModalOpen(true);
  };

  const handleSavePrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !brand.trim() || !model.trim()) return;

    const payload = {
      brand,
      model,
      name,
      purchasePrice: Number(purchasePrice),
      purchaseDate,
      powerWatts: Number(powerWatts),
      accumulatedHours: Number(accumulatedHours),
      lifespanHours: Number(lifespanHours),
      residualValue: Number(residualValue),
      depreciationEnabled,
      notes,
    };

    try {
      let res;
      if (editingPrinter) {
        res = await fetch('/api/printers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPrinter.id, ...payload }),
        });
      } else {
        res = await fetch('/api/printers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      setIsPrinterModalOpen(false);
      loadPrinters();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeletePrinter = async (id: string, printerName: string) => {
    if (!confirm(`¿Eliminar la impresora "${printerName}"?`)) return;
    try {
      const res = await fetch(`/api/printers?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      loadPrinters();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const openAddMaintenance = (p: any) => {
    setActivePrinterForMaint(p);
    setMaintType('Limpieza de boquilla y lubricación');
    setMaintCost(0);
    setMaintHours(p.accumulatedHours);
    setMaintDesc('Limpieza preventiva de boquilla de 0.4mm con aguja y alcohol isopropílico.');
    setMaintNextHours(Math.round(p.accumulatedHours + 250));
    setIsMaintModalOpen(true);
  };

  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePrinterForMaint || !maintDesc.trim()) return;

    try {
      const res = await fetch(`/api/printers/${activePrinterForMaint.id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: maintType,
          cost: Number(maintCost),
          printerHoursAtMaintenance: Number(maintHours),
          description: maintDesc,
          nextDueHours: Number(maintNextHours),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      setIsMaintModalOpen(false);
      loadPrinters();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Printer className="w-6 h-6 text-brand-400" />
            Parque de Impresoras 3D & Mantenimiento
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Bambu Lab P1S Combo, amortización por hora, bitácora de servicio y consumo eléctrico
          </p>
        </div>

        <button
          onClick={openCreatePrinter}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" /> Agregar Nueva Impresora
        </button>
      </div>

      {/* Printers List */}
      <div className="space-y-6">
        {printers.map((p) => {
          const depPerHour = calculateDepreciationPerHour(
            p.purchasePrice,
            p.residualValue,
            p.lifespanHours
          );
          const depAccumulated = calculateDepreciationCost(
            depPerHour,
            p.accumulatedHours,
            p.depreciationEnabled
          );
          const kwhAccumulated = (p.powerWatts * p.accumulatedHours) / 1000;
          const electricityCost = kwhAccumulated * 2.15; // CFE Tarímbaro

          return (
            <div
              key={p.id}
              className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6"
            >
              {/* Printer Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-white">{p.name}</h2>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {p.brand} {p.model} • Compra: {new Date(p.purchaseDate).toLocaleDateString('es-MX')} ({formatCurrency(p.purchasePrice)})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAddMaintenance(p)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-brand-400 border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" /> Registrar Mantenimiento
                  </button>
                  <button
                    onClick={() => openEditPrinter(p)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {printers.length > 1 && (
                    <button
                      onClick={() => handleDeletePrinter(p.id, p.name)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Depreciation & Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">HORAS ACUMULADAS</span>
                  <span className="text-xl font-black text-white font-mono">{p.accumulatedHours} h</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Vida útil: {p.lifespanHours} h
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">DEPRECIACIÓN / HORA</span>
                  <span className="text-xl font-black text-brand-400 font-mono">
                    {p.depreciationEnabled ? `${formatCurrency(depPerHour)}/h` : 'Desactivada'}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Residual: {formatCurrency(p.residualValue)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">DEPRECIACIÓN ACUMULADA</span>
                  <span className="text-xl font-black text-rose-400 font-mono">
                    {formatCurrency(depAccumulated)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Amortizado en costos</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">ENERGÍA CONSUMIDA</span>
                  <span className="text-xl font-black text-amber-400 font-mono">
                    {formatCurrency(electricityCost)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {p.powerWatts}W ({kwhAccumulated.toFixed(1)} kWh)
                  </span>
                </div>
              </div>

              {/* Maintenance Log */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-brand-400" /> Historial de Mantenimientos & Servicios
                  </span>
                  <span className="text-slate-400">{p.maintenances?.length || 0} registros</span>
                </div>

                <div className="space-y-2">
                  {p.maintenances && p.maintenances.length > 0 ? (
                    p.maintenances.map((m: any) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4 text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{m.type}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(m.date).toLocaleDateString('es-MX')} • Horas máquina: {m.printerHoursAtMaintenance}h • {m.description}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="font-mono font-bold text-slate-200">
                            {m.cost > 0 ? formatCurrency(m.cost) : 'Sin costo'}
                          </span>
                          {m.nextDueHours && (
                            <div className="text-[10px] text-amber-400">
                              Próximo: {m.nextDueHours}h
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500 rounded-xl bg-slate-950/40 border border-slate-800/60">
                      No hay registros de mantenimiento para esta impresora.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT PRINTER MODAL */}
      {isPrinterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-brand-400" />
                {editingPrinter ? 'Editar Impresora' : 'Agregar Impresora 3D'}
              </h3>
              <button onClick={() => setIsPrinterModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePrinter} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Bambu Lab, Prusa, Creality..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Modelo</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="P1S Combo, X1C, MK4..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Descriptivo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Consumo Eléctrico (Watts)</label>
                  <input
                    type="number"
                    value={powerWatts}
                    onChange={(e) => setPowerWatts(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Depreciation Section */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                  <input
                    type="checkbox"
                    checked={depreciationEnabled}
                    onChange={(e) => setDepreciationEnabled(e.target.checked)}
                    className="rounded border-slate-700 text-brand-500"
                  />
                  Habilitar Depreciación para esta Impresora
                </label>

                {depreciationEnabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Vida útil (horas)</span>
                      <input
                        type="number"
                        value={lifespanHours}
                        onChange={(e) => setLifespanHours(parseFloat(e.target.value) || 6000)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Valor Residual ($)</span>
                      <input
                        type="number"
                        value={residualValue}
                        onChange={(e) => setResidualValue(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Horas Actuales</span>
                      <input
                        type="number"
                        value={accumulatedHours}
                        onChange={(e) => setAccumulatedHours(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrinterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs"
                >
                  Guardar Impresora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD MAINTENANCE MODAL */}
      {isMaintModalOpen && activePrinterForMaint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-brand-400" />
                Mantenimiento: {activePrinterForMaint.name}
              </h3>
              <button onClick={() => setIsMaintModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMaintenance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Mantenimiento</label>
                <input
                  type="text"
                  required
                  value={maintType}
                  onChange={(e) => setMaintType(e.target.value)}
                  placeholder="Ej: Lubricación ejes, Cambio termistor, Boquilla..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Costo de Insumos ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={maintCost}
                    onChange={(e) => setMaintCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Horas Máquina</label>
                  <input
                    type="number"
                    value={maintHours}
                    onChange={(e) => setMaintHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción de las Labores Realizadas</label>
                <textarea
                  rows={2}
                  required
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Próximo Mantenimiento (Horas acumuladas)</label>
                <input
                  type="number"
                  value={maintNextHours}
                  onChange={(e) => setMaintNextHours(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaintModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs"
                >
                  Registrar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
