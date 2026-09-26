'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  PieChart,
  Percent,
  Trash2,
  Edit2,
  X,
  Sparkles,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, calculateProfitDistribution } from '@/lib/calculations';

const EXPENSE_CATEGORIES = [
  'Filamento',
  'Electricidad',
  'Mantenimiento',
  'Herramientas',
  'Empaque',
  'Envíos',
  'Software',
  'Otros',
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [sales, setSales] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Profit Distribution State
  const [reinvestmentPct, setReinvestmentPct] = useState<number>(40);
  const [maintenancePct, setMaintenancePct] = useState<number>(20);
  const [ownerPct, setOwnerPct] = useState<number>(40);
  const [isSavingDistribution, setIsSavingDistribution] = useState(false);
  const [distributionSuccess, setDistributionSuccess] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);

  // Form Fields
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Filamento');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [supplier, setSupplier] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expRes, salesRes, setRes] = await Promise.all([
        fetch('/api/expenses').then((r) => r.json()),
        fetch('/api/sales').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
      ]);

      if (expRes.expenses) {
        setExpenses(expRes.expenses);
        setTotalExpenses(expRes.totalAmount);
      }
      if (Array.isArray(salesRes)) setSales(salesRes);
      if (setRes) {
        setSettings(setRes);
        setReinvestmentPct(setRes.profitReinvestmentPercent || 40);
        setMaintenancePct(setRes.profitMaintenancePercent || 20);
        setOwnerPct(setRes.profitOwnerPercent || 40);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingExpense(null);
    setDescription('');
    setCategory('Filamento');
    setAmount(0);
    setPaymentMethod('Efectivo');
    setSupplier('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (ex: any) => {
    setEditingExpense(ex);
    setDescription(ex.description);
    setCategory(ex.category);
    setAmount(ex.amount);
    setPaymentMethod(ex.paymentMethod);
    setSupplier(ex.supplier || '');
    setDate(ex.date ? ex.date.split('T')[0] : '');
    setNotes(ex.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) {
      alert('Descripción y monto válido son obligatorios');
      return;
    }

    const payload = {
      description,
      category,
      amount: Number(amount),
      paymentMethod,
      supplier,
      date,
      notes,
    };

    try {
      let res;
      if (editingExpense) {
        res = await fetch('/api/expenses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingExpense.id, ...payload }),
        });
      } else {
        res = await fetch('/api/expenses', {
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
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('¿Eliminar este registro de gasto?')) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Profit Distribution Calculations
  const totalSalesRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0);
  const totalSalesCost = sales.reduce((acc, s) => acc + (s.totalCost || 0), 0);
  const totalNetProfit = Math.max(0, totalSalesRevenue - totalSalesCost);

  const distribution = calculateProfitDistribution(
    totalNetProfit,
    reinvestmentPct,
    maintenancePct,
    ownerPct
  );

  const handleSaveDistributionSettings = async () => {
    const sum = reinvestmentPct + maintenancePct + ownerPct;
    if (Math.abs(sum - 100) > 0.5) {
      alert(`Los porcentajes deben sumar exactamente 100% (actual: ${sum.toFixed(1)}%)`);
      return;
    }

    setIsSavingDistribution(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profitReinvestmentPercent: reinvestmentPct,
          profitMaintenancePercent: maintenancePct,
          profitOwnerPercent: ownerPct,
        }),
      });

      if (!res.ok) throw new Error('Error al actualizar distribución');
      setDistributionSuccess(true);
      setTimeout(() => setDistributionSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSavingDistribution(false);
    }
  };

  const filteredExpenses = expenses.filter((ex) => {
    const matchesSearch =
      ex.description.toLowerCase().includes(search.toLowerCase()) ||
      (ex.supplier && ex.supplier.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = categoryFilter === 'all' || ex.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-brand-400" />
            Gastos & Distribución de Ganancias
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro de egresos operativos y asignación porcentual de beneficios para reinversión y mantenimiento
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" /> Registrar Gasto
        </button>
      </div>

      {/* PROFIT DISTRIBUTION CONFIGURATION PANEL */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-brand-500/20 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-brand-400" />
              Distribución de Ganancia Acumulada
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ganancia total del taller: <strong className="text-brand-400">{formatCurrency(totalNetProfit)}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {distributionSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Guardado
              </span>
            )}
            <button
              onClick={handleSaveDistributionSettings}
              disabled={isSavingDistribution}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              Guardar Porcentajes
            </button>
          </div>
        </div>

        {/* Sliders / Inputs for Percentages */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Reinversión */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-sky-400">1. Reinversión</span>
              <span className="font-mono font-bold text-white">{reinvestmentPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={reinvestmentPct}
              onChange={(e) => setReinvestmentPct(parseInt(e.target.value) || 0)}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <div className="pt-1 flex items-baseline justify-between text-xs">
              <span className="text-[11px] text-slate-400">Fondo para filamentos y nuevo equipo:</span>
              <span className="font-mono font-bold text-sky-400">
                {formatCurrency(distribution.reinvestment)}
              </span>
            </div>
          </div>

          {/* 2. Mantenimiento */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-400">2. Mantenimiento</span>
              <span className="font-mono font-bold text-white">{maintenancePct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={maintenancePct}
              onChange={(e) => setMaintenancePct(parseInt(e.target.value) || 0)}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="pt-1 flex items-baseline justify-between text-xs">
              <span className="text-[11px] text-slate-400">Repuestos, boquillas y lubricantes:</span>
              <span className="font-mono font-bold text-amber-400">
                {formatCurrency(distribution.maintenance)}
              </span>
            </div>
          </div>

          {/* 3. Ganancia Dueño */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-brand-400">3. Ganancia Neta Dueño</span>
              <span className="font-mono font-bold text-white">{ownerPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={ownerPct}
              onChange={(e) => setOwnerPct(parseInt(e.target.value) || 0)}
              className="w-full accent-brand-500 cursor-pointer"
            />
            <div className="pt-1 flex items-baseline justify-between text-xs">
              <span className="text-[11px] text-slate-400">Beneficio personal disponible:</span>
              <span className="font-mono font-bold text-brand-400">
                {formatCurrency(distribution.owner)}
              </span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 text-right">
          Suma de porcentajes:{' '}
          <strong className={reinvestmentPct + maintenancePct + ownerPct === 100 ? 'text-emerald-400' : 'text-amber-400'}>
            {reinvestmentPct + maintenancePct + ownerPct}%
          </strong>
        </div>
      </div>

      {/* EXPENSES LOG & METRICS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">Registro de Egresos Operativos</h2>
            <span className="text-xs text-slate-400 font-mono">
              (Total: {formatCurrency(totalExpenses)})
            </span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar descripción o proveedor..."
                className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="all">Todas las Categorías</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-2">
          {filteredExpenses.map((ex) => (
            <div
              key={ex.id}
              className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 text-xs hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="px-2 py-0.5 rounded-md bg-slate-950 text-[10px] font-semibold text-brand-400 border border-slate-800 flex-shrink-0">
                  {ex.category}
                </span>

                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{ex.description}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(ex.date).toLocaleDateString('es-MX')} • {ex.supplier || 'Proveedor sin registrar'} • {ex.paymentMethod}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="font-mono font-bold text-rose-400 text-sm">
                  -{formatCurrency(ex.amount)}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(ex)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(ex.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredExpenses.length === 0 && !loading && (
          <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
            No se encontraron gastos registrados con estos criterios.
          </div>
        )}
      </div>

      {/* CREATE / EDIT EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand-400" />
                {editingExpense ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Bobina PLA Negro, Alcohol isopropílico..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monto ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Mercado Pago">Mercado Pago</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Proveedor (Opcional)</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Ej: CFE, Bambu Lab Store, Amazon..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notas</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
