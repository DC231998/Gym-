'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Disc,
  Box,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  History,
  Search,
  Filter,
  X,
  Check,
} from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

export default function InventoryPage() {
  const [data, setData] = useState<any>({
    filaments: [],
    products: [],
    movements: [],
    lowStockFilaments: [],
    lowStockProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'filaments' | 'products' | 'movements'>('filaments');

  // Adjustment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemType, setItemType] = useState<'filament' | 'product'>('filament');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [movementType, setMovementType] = useState<'entrada' | 'salida' | 'ajuste'>('entrada');
  const [quantity, setQuantity] = useState<number>(100);
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      const json = await res.json();
      setData(json);
      if (json.filaments?.length > 0 && !selectedItemId) {
        setSelectedItemId(json.filaments[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || quantity <= 0) {
      alert('Selecciona un elemento y cantidad válida');
      return;
    }

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType,
          itemId: selectedItemId,
          movementType,
          quantity: Number(quantity),
          reason: reason || 'Ajuste manual de inventario',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      setIsModalOpen(false);
      setReason('');
      loadInventory();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const lowStockCount = (data.lowStockFilaments?.length || 0) + (data.lowStockProducts?.length || 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-brand-400" />
            Control de Inventario & Kardex
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitorea existencias de filamentos en gramos, productos terminados y registro de movimientos
          </p>
        </div>

        <button
          onClick={() => {
            setItemType('filament');
            setSelectedItemId(data.filaments?.[0]?.id || '');
            setQuantity(100);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" /> Registrar Entrada / Salida
        </button>
      </div>

      {/* Low Stock Alerts Banner */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-300">
              Alerta de Stock Mínimo ({lowStockCount} artículos con nivel bajo):
            </span>
            <div className="text-slate-300 flex flex-wrap gap-2 pt-0.5">
              {data.lowStockFilaments?.map((f: any) => (
                <span key={f.id} className="bg-slate-900/80 px-2 py-0.5 rounded border border-amber-500/40">
                  {f.colorName} ({f.materialType}): {Math.round(f.availableGrams)}g
                </span>
              ))}
              {data.lowStockProducts?.map((p: any) => (
                <span key={p.id} className="bg-slate-900/80 px-2 py-0.5 rounded border border-amber-500/40">
                  {p.name}: {p.stock} pzas
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('filaments')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'filaments'
              ? 'bg-brand-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Disc className="w-3.5 h-3.5" /> Filamentos ({data.filaments?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'products'
              ? 'bg-brand-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Box className="w-3.5 h-3.5" /> Productos ({data.products?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'movements'
              ? 'bg-brand-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Movimientos Recientes
        </button>
      </div>

      {/* FILAMENTS STOCK TAB */}
      {activeTab === 'filaments' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.filaments?.map((fil: any) => {
            const isLow = fil.availableGrams <= fil.minStockGrams;
            return (
              <div
                key={fil.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-8 h-8 rounded-full border border-white/20 flex-shrink-0 shadow-inner"
                    style={{ backgroundColor: fil.colorHex }}
                  />
                  <div className="truncate">
                    <div className="font-bold text-white truncate uppercase">{fil.colorName}</div>
                    <div className="text-[11px] text-slate-400">{fil.brand} • {fil.materialType}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-mono font-bold text-sm block ${isLow ? 'text-amber-400' : 'text-slate-200'}`}>
                    {Math.round(fil.availableGrams)}g
                  </span>
                  <span className="text-[10px] text-slate-500">Mín: {fil.minStockGrams}g</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRODUCTS STOCK TAB */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.products?.map((prod: any) => {
            const isLow = prod.stock <= prod.minStock;
            return (
              <div
                key={prod.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-slate-500">{prod.sku}</span>
                  <div className="font-bold text-white truncate">{prod.name}</div>
                  <div className="text-[11px] text-slate-400">{prod.category?.name}</div>
                </div>

                <div className="text-right">
                  <span className={`font-mono font-bold text-sm block ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {prod.stock} pzas
                  </span>
                  <span className="text-[10px] text-slate-500">Mín: {prod.minStock} pzas</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MOVEMENTS KARDEX TAB */}
      {activeTab === 'movements' && (
        <div className="space-y-2">
          {data.movements?.map((m: any) => (
            <div
              key={m.id}
              className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    m.movementType === 'entrada'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {m.movementType === 'entrada' ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="font-semibold text-white">
                    {m.itemType === 'filament' ? 'Filamento' : 'Producto'}: {m.reason}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(m.createdAt).toLocaleDateString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              <div className="text-right font-mono text-xs">
                <span
                  className={`font-bold block ${
                    m.movementType === 'entrada' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {m.movementType === 'entrada' ? '+' : '-'}
                  {m.quantity} {m.itemType === 'filament' ? 'g' : 'pzas'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Stock: {m.previousStock} &rarr; {m.newStock}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADJUSTMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-brand-400" />
                Registrar Movimiento de Inventario
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Elemento</label>
                  <select
                    value={itemType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setItemType(val);
                      setSelectedItemId(
                        val === 'filament'
                          ? data.filaments?.[0]?.id || ''
                          : data.products?.[0]?.id || ''
                      );
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="filament">Filamento (Gramos)</option>
                    <option value="product">Producto (Piezas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Movimiento</label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="entrada">Entrada (+)</option>
                    <option value="salida">Salida / Merma (-)</option>
                    <option value="ajuste">Ajuste de Conteo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Seleccionar Elemento</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {itemType === 'filament'
                    ? data.filaments?.map((f: any) => (
                        <option key={f.id} value={f.id}>
                          {f.brand} {f.materialType} {f.colorName} ({Math.round(f.availableGrams)}g disp.)
                        </option>
                      ))
                    : data.products?.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.stock} pzas disp.)
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cantidad ({itemType === 'filament' ? 'gramos' : 'piezas'})
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Motivo del Movimiento</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Calibración, Impresión fallida, Conteo físico..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs"
                >
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
