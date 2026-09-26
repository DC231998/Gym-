'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  X,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<any | null>(null);

  // Form Fields
  const [itemTitle, setItemTitle] = useState('');
  const [supplier, setSupplier] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [priority, setPriority] = useState('Media');
  const [category, setCategory] = useState('Filamento');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState('Pendiente');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchases');
      const data = await res.json();
      if (Array.isArray(data)) setPurchases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPO(null);
    setItemTitle('');
    setSupplier('');
    setQuantity(1);
    setEstimatedPrice(0);
    setPriority('Media');
    setCategory('Filamento');
    setTargetDate('');
    setStatus('Pendiente');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (po: any) => {
    setEditingPO(po);
    setItemTitle(po.itemTitle);
    setSupplier(po.supplier || '');
    setQuantity(po.quantity);
    setEstimatedPrice(po.estimatedPrice);
    setPriority(po.priority);
    setCategory(po.category);
    setTargetDate(po.targetDate ? po.targetDate.split('T')[0] : '');
    setStatus(po.status);
    setNotes(po.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    const payload = {
      itemTitle,
      supplier,
      quantity: Number(quantity),
      estimatedPrice: Number(estimatedPrice),
      priority,
      category,
      targetDate: targetDate || null,
      status,
      notes,
    };

    try {
      let res;
      if (editingPO) {
        res = await fetch('/api/purchases', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPO.id, ...payload }),
        });
      } else {
        res = await fetch('/api/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      setIsModalOpen(false);
      loadPurchases();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleMarkAsPurchased = async (po: any) => {
    const registerExpense = confirm(
      `¿Marcar "${po.itemTitle}" como Comprado y agregarlo automáticamente al módulo de Gastos ($${po.estimatedPrice})?`
    );

    try {
      const res = await fetch('/api/purchases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: po.id,
          status: 'Comprado',
          createExpense: registerExpense,
          expensePaymentMethod: 'Efectivo',
        }),
      });

      if (!res.ok) throw new Error('Error al actualizar');
      loadPurchases();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta solicitud de compra?')) return;
    try {
      const res = await fetch(`/api/purchases?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      loadPurchases();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filtered = purchases.filter(
    (p) => statusFilter === 'all' || p.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-brand-400" />
            Próximas Compras & Abastecimiento
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Planifica la adquisición de filamentos, repuestos y consumibles según prioridad
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" /> Registrar Solicitud de Compra
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl w-fit">
        {['all', 'Pendiente', 'Comprado', 'Cancelado'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === st
                ? 'bg-brand-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {st === 'all' ? 'Todas' : st}
          </button>
        ))}
      </div>

      {/* Purchases List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((po) => {
          const isPending = po.status === 'Pendiente';
          const isUrgent = po.priority === 'Urgente' || po.priority === 'Alta';

          return (
            <div
              key={po.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      isUrgent
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Prioridad {po.priority}
                  </span>

                  <span
                    className={`text-xs font-semibold ${
                      po.status === 'Comprado'
                        ? 'text-emerald-400'
                        : po.status === 'Pendiente'
                        ? 'text-amber-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {po.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-2">{po.itemTitle}</h3>
                <div className="text-xs text-slate-400 mt-1">
                  {po.supplier ? `Proveedor: ${po.supplier}` : 'Sin proveedor especificado'}
                </div>
              </div>

              {/* Quantities & Price */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">Cantidad: {po.quantity} unid.</span>
                  <span className="font-mono text-base font-bold text-brand-400">
                    {formatCurrency(po.estimatedPrice)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {isPending && (
                    <button
                      onClick={() => handleMarkAsPurchased(po)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/60 text-xs font-semibold transition-colors flex items-center gap-1"
                      title="Marcar como comprado"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Comprado
                    </button>
                  )}

                  <button
                    onClick={() => openEditModal(po)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(po.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
          <ShoppingCart className="w-10 h-10 mx-auto text-slate-600 mb-2 stroke-[1.5]" />
          <p className="text-sm font-semibold">No hay compras registradas en este estado</p>
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-brand-400" />
                {editingPO ? 'Editar Compra' : 'Registrar Próxima Compra'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Insumo o Producto a Comprar</label>
                <input
                  type="text"
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="Ej: Filamento PETG Negro 1kg, Boquilla 0.4mm..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Precio Estimado ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prioridad</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Filamento">Filamento</option>
                    <option value="Herramientas">Herramientas / Boquillas</option>
                    <option value="Empaque">Empaque y Envíos</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Proveedor (Opcional)</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Amazon, 3D Market, Bambu Store..."
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
                  Guardar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
