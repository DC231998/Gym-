'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Disc,
  AlertTriangle,
  Printer,
  ShoppingBag,
  ShoppingCart,
  Boxes,
  ArrowUpRight,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { formatCurrency } from '@/lib/calculations';

export default function DashboardPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchDashboard(period);
  }, [period]);

  const fetchDashboard = async (selectedPeriod: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?period=${selectedPeriod}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Error fetching dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const metrics = data?.metrics || {
    totalSales: 0,
    totalPaid: 0,
    totalPending: 0,
    totalCosts: 0,
    totalProfit: 0,
    totalExpenses: 0,
    totalPrintHours: 0,
    totalFilamentGrams: 0,
  };

  const p1s = data?.bambuP1S || {
    printer: null,
    accumulatedHours: 0,
    monthHours: 0,
    printJobsCount: 0,
    gramsUsed: 0,
    electricCost: 0,
    depreciationPerHour: 0,
    depreciationAccum: 0,
    maintenanceCost: 0,
    totalAccumulatedCost: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Panel de Control</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-mono font-medium border border-brand-500/30">
              En Vivo
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas financieras, producción en tiempo real y costos de taller 3D
          </p>
        </div>

        {/* Filter Period Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
          {(
            [
              { key: 'today', label: 'Hoy' },
              { key: 'week', label: 'Esta Semana' },
              { key: 'month', label: 'Este Mes' },
              { key: 'year', label: 'Este Año' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setPeriod(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === t.key
                  ? 'bg-brand-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI 7 Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. VENTAS DEL MES */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>VENTAS {period === 'month' ? 'DEL MES' : ''}</span>
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {formatCurrency(metrics.totalSales)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-brand-400 font-semibold">{metrics.totalSales > 0 ? '+100%' : '0%'}</span>
            <span>vs costos de producción</span>
          </div>
        </div>

        {/* 2. DINERO COBRADO */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>DINERO COBRADO</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
            {formatCurrency(metrics.totalPaid)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ingresos efectivos recibidos</div>
        </div>

        {/* 3. DINERO PENDIENTE */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>DINERO PENDIENTE</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
            {formatCurrency(metrics.totalPending)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Por liquidar por clientes</div>
        </div>

        {/* 4. COSTOS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>COSTOS DE PRODUCCIÓN</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 rotate-180" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-200 tracking-tight">
            {formatCurrency(metrics.totalCosts)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Filamento + luz + depreciación</div>
        </div>

        {/* 5. GANANCIA */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-brand-950/60 to-slate-900 border border-brand-500/30 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-brand-300 text-xs font-bold mb-2">
            <span>GANANCIA NETA</span>
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-brand-400 tracking-tight">
            {formatCurrency(metrics.totalProfit)}
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            Margen neto:{' '}
            <span className="font-bold text-white">
              {metrics.totalSales > 0 ? ((metrics.totalProfit / metrics.totalSales) * 100).toFixed(0) : 0}%
            </span>
          </div>
        </div>

        {/* 6. HORAS DE IMPRESIÓN */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>HORAS DE IMPRESIÓN</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {metrics.totalPrintHours} <span className="text-sm font-normal text-slate-400">h</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Tiempo de boquilla activa</div>
        </div>

        {/* 7. FILAMENTO UTILIZADO */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden group col-span-2 sm:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>FILAMENTO CONSUMIDO</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Disc className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {metrics.totalFilamentGrams} <span className="text-sm font-normal text-slate-400">g</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              ({(metrics.totalFilamentGrams / 1000).toFixed(2)} kg equivalentes)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Descontado automáticamente de bobinas</div>
        </div>
      </div>

      {/* Financial & Production Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Evolución: Ventas, Gastos y Ganancias</h2>
              <p className="text-xs text-slate-400">Comparativa del periodo seleccionado</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                <span className="text-slate-300">Ventas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300">Gastos</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.chartData || []}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stop-color="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stop-color="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stop-color="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stop-color="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="ventas" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorVentas)" />
                <Area type="monotone" dataKey="gastos" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorGastos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Productos Más Vendidos</h2>
            <Link href="/products" className="text-xs text-brand-400 hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {data?.topProducts && data.topProducts.length > 0 ? (
              data.topProducts.map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="text-xs font-semibold text-slate-200 truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-400">{p.quantity} unidades vendidas</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold text-brand-400">{formatCurrency(p.revenue)}</div>
                    <div className="text-[10px] text-emerald-400">+{formatCurrency(p.profit)} ganancia</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-500">Sin datos de ventas en este periodo</div>
            )}
          </div>
        </div>
      </div>

      {/* DEDICATED PANEL: Bambu Lab P1S Combo */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-brand-500/20 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Panel Bambu Lab P1S Combo</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  Activa • Taller Tarímbaro
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AMS 4 Colores • Boquilla 0.4mm endurecida • Tarifa CFE $2.15/kWh
              </p>
            </div>
          </div>
          <Link
            href="/printers"
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors self-start sm:self-auto flex items-center gap-1.5"
          >
            Configurar Impresoras <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Bambu P1S Grid Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400">HORAS ACUMULADAS</div>
            <div className="text-lg font-black text-white mt-1">{p1s.accumulatedHours} h</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Vida útil: 6,000 h</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400">HORAS DEL PERIODO</div>
            <div className="text-lg font-black text-sky-400 mt-1">{p1s.monthHours} h</div>
            <div className="text-[10px] text-slate-500 mt-0.5">En producción</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400">ELECTRICIDAD ESTIMADA</div>
            <div className="text-lg font-black text-amber-400 mt-1">{formatCurrency(p1s.electricCost)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Consumo: 150W promedio</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400">DEPRECIACIÓN ACUM.</div>
            <div className="text-lg font-black text-rose-400 mt-1">{formatCurrency(p1s.depreciationAccum)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{formatCurrency(p1s.depreciationPerHour)}/hora</div>
          </div>
        </div>
      </div>

      {/* Operational Rows: Pending Sales, Purchases, Low Stock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Sales & Balances */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              Saldos Pendientes de Cobro
            </h3>
            <Link href="/sales" className="text-[11px] text-brand-400 hover:underline">
              Cobrar
            </Link>
          </div>
          <div className="space-y-2">
            {data?.pendingSales && data.pendingSales.length > 0 ? (
              data.pendingSales.map((s: any) => (
                <div key={s.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-200 truncate">{s.customerName}</div>
                    <div className="text-[10px] text-slate-400">{s.saleNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-400">{formatCurrency(s.pendingAmount)}</div>
                    <div className="text-[10px] text-slate-500">De {formatCurrency(s.total)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">No hay ventas con saldo pendiente</div>
            )}
          </div>
        </div>

        {/* Low Stock Filament Alerts */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Disc className="w-4 h-4 text-rose-400" />
              Alertas de Filamento
            </h3>
            <Link href="/filaments" className="text-[11px] text-brand-400 hover:underline">
              Gestionar
            </Link>
          </div>
          <div className="space-y-2">
            {data?.lowStockFilaments && data.lowStockFilaments.length > 0 ? (
              data.lowStockFilaments.map((f: any) => (
                <div key={f.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/20" style={{ backgroundColor: f.colorHex }} />
                    <div className="truncate">
                      <div className="font-semibold text-slate-200 truncate">{f.colorName}</div>
                      <div className="text-[10px] text-slate-400">{f.brand} • {f.materialType}</div>
                    </div>
                  </div>
                  <div className="text-right font-bold text-rose-400">
                    {Math.round(f.availableGrams)}g
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">Stock de filamentos en niveles óptimos</div>
            )}
          </div>
        </div>

        {/* Upcoming Purchases */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-sky-400" />
              Próximas Compras
            </h3>
            <Link href="/purchases" className="text-[11px] text-brand-400 hover:underline">
              Ver lista
            </Link>
          </div>
          <div className="space-y-2">
            {data?.upcomingPurchases && data.upcomingPurchases.length > 0 ? (
              data.upcomingPurchases.map((p: any) => (
                <div key={p.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-200 truncate">{p.itemTitle}</div>
                    <div className="text-[10px] text-slate-400">{p.supplier || 'Sin proveedor'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-200">{formatCurrency(p.estimatedPrice)}</div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                      {p.priority}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">No hay compras pendientes registradas</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
