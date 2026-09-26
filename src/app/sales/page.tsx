'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageCircle,
  CreditCard,
  Trash2,
  Edit2,
  Eye,
  X,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { formatCurrency, calculateSaleBalance } from '@/lib/calculations';

const SALE_STATUSES = [
  'Pendiente',
  'En producción',
  'Listo',
  'Entregado',
  'Cancelado',
];

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Create Sale Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [saleItems, setSaleItems] = useState<
    Array<{
      productId?: string;
      packageId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      unitCost: number;
      grams?: number;
      hours?: number;
    }>
  >([]);
  const [discount, setDiscount] = useState<number>(0);
  const [initialPayment, setInitialPayment] = useState<number>(0);
  const [initialPaymentMethod, setInitialPaymentMethod] = useState('Efectivo');
  const [notes, setNotes] = useState('');

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeSaleForPayment, setActiveSaleForPayment] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Sale Detail Modal
  const [viewingSale, setViewingSale] = useState<any | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [salesRes, custRes, prodRes, pkgRes] = await Promise.all([
        fetch('/api/sales').then((r) => r.json()),
        fetch('/api/customers').then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/packages').then((r) => r.json()),
      ]);

      if (Array.isArray(salesRes)) setSales(salesRes);
      if (Array.isArray(custRes)) setCustomers(custRes);
      if (Array.isArray(prodRes)) setProducts(prodRes);
      if (Array.isArray(pkgRes)) setPackages(pkgRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedCustomerId(customers[0]?.id || '');
    setSaleDate(new Date().toISOString().split('T')[0]);
    setSaleItems([]);
    setDiscount(0);
    setInitialPayment(0);
    setInitialPaymentMethod('Efectivo');
    setNotes('');
    setIsCreateModalOpen(true);
  };

  const addProductToSale = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    setSaleItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        description: prod.name,
        quantity: 1,
        unitPrice: prod.salePrice,
        unitCost: prod.realCost,
        grams: prod.weightGrams,
        hours: (prod.printTimeMinutes || 0) / 60,
      },
    ]);
  };

  const addPackageToSale = (pkgId: string) => {
    const pkg = packages.find((p) => p.id === pkgId);
    if (!pkg) return;

    setSaleItems((prev) => [
      ...prev,
      {
        packageId: pkg.id,
        description: `Combo: ${pkg.name}`,
        quantity: 1,
        unitPrice: pkg.packagePrice,
        unitCost: pkg.totalCost,
      },
    ]);
  };

  const updateItemQty = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setSaleItems((prev) => prev.filter((_, idx) => idx !== index));
    } else {
      setSaleItems((prev) =>
        prev.map((it, idx) => (idx === index ? { ...it, quantity } : it))
      );
    }
  };

  const saleSubtotal = saleItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  const saleTotal = Math.max(0, saleSubtotal - discount);

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleItems.length === 0) {
      alert('Debes agregar al menos un producto o paquete a la venta');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);

    const payload = {
      customerId: selectedCustomerId || null,
      customerName: customer?.name || 'Público General',
      date: saleDate,
      items: saleItems,
      discount: Number(discount),
      initialPaymentAmount: Number(initialPayment),
      initialPaymentMethod,
      notes,
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      setIsCreateModalOpen(false);
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Payment Recording
  const openPaymentModal = (sale: any) => {
    setActiveSaleForPayment(sale);
    setPaymentAmount(sale.pendingAmount);
    setPaymentMethod('Efectivo');
    setPaymentRef('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSaleForPayment) return;

    if (paymentAmount <= 0) {
      alert('Introduce un monto válido mayor a 0');
      return;
    }

    try {
      const res = await fetch(`/api/sales/${activeSaleForPayment.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          method: paymentMethod,
          reference: paymentRef,
          notes: paymentNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      setIsPaymentModalOpen(false);
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Status Update
  const handleStatusChange = async (saleId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: saleId, status: newStatus }),
      });
      if (!res.ok) throw new Error('Error al actualizar estado');
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.saleNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-brand-400" />
            Ventas & Pagos Parciales
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Control de pedidos, estados de producción, abonos múltiples y snapshots históricos de costos
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" /> Registrar Nueva Venta
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número o cliente..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="all">Todos los Estados</option>
            {SALE_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sales List (Responsive Cards) */}
      <div className="space-y-3">
        {filteredSales.map((sale) => {
          const isPendingPayment = sale.pendingAmount > 0;
          const customerPhone = (sale.customer?.whatsapp || sale.customer?.phone || '').replace(/\D/g, '');

          const waSaleMessage = encodeURIComponent(
            `¡Hola ${sale.customerName}! Te escribo con respecto a tu pedido *${sale.saleNumber}*.\n\n` +
              `Total: ${formatCurrency(sale.total)}\n` +
              `Pagado: ${formatCurrency(sale.paidAmount)}\n` +
              `Saldo pendiente: ${formatCurrency(sale.pendingAmount)}\n` +
              `Estado actual: ${sale.status}\n\n` +
              `¡Cualquier duda quedamos a tus órdenes!`
          );

          return (
            <div
              key={sale.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              {/* Left Column: Number, Customer & Status */}
              <div className="space-y-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-brand-400">{sale.saleNumber}</span>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-xs text-slate-400">
                    {new Date(sale.date).toLocaleDateString('es-MX')}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{sale.customerName}</h3>

                {/* Status Dropdown */}
                <div className="pt-1">
                  <select
                    value={sale.status}
                    onChange={(e) => handleStatusChange(sale.id, e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    {SALE_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Middle: Items overview */}
              <div className="flex-1 min-w-[200px] text-xs text-slate-400 space-y-0.5">
                <span className="font-semibold text-slate-300 block text-[11px]">Artículos:</span>
                {sale.items?.slice(0, 2).map((it: any) => (
                  <div key={it.id} className="truncate">
                    {it.quantity} × {it.description}
                  </div>
                ))}
                {sale.items?.length > 2 && (
                  <span className="text-[10px] text-brand-400">
                    +{sale.items.length - 2} productos más...
                  </span>
                )}
              </div>

              {/* Financial Box: TOTAL, PAGADO, PENDIENTE */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">TOTAL</span>
                  <span className="font-bold text-white">{formatCurrency(sale.total)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">PAGADO</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(sale.paidAmount)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">PENDIENTE</span>
                  <span
                    className={`font-bold ${
                      isPendingPayment ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    {formatCurrency(sale.pendingAmount)}
                  </span>
                </div>
              </div>

              {/* Actions: Abono, WhatsApp, Ver */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {isPendingPayment && (
                  <button
                    onClick={() => openPaymentModal(sale)}
                    className="px-3 py-1.5 rounded-xl bg-brand-500/15 border border-brand-500/30 hover:bg-brand-500 hover:text-slate-950 text-brand-400 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Registrar Abono
                  </button>
                )}

                {customerPhone && (
                  <a
                    href={`https://wa.me/52${customerPhone}?text=${waSaleMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-950 text-emerald-400 transition-colors"
                    title="Enviar estado de cuenta por WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}

                <button
                  onClick={() => setViewingSale(sale)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Ver detalle de venta"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSales.length === 0 && !loading && (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
          <ShoppingBag className="w-10 h-10 mx-auto text-slate-600 mb-2 stroke-[1.5]" />
          <p className="text-sm font-semibold">No se encontraron ventas registradas</p>
          <button
            onClick={openCreateModal}
            className="mt-3 px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Registrar Venta
          </button>
        </div>
      )}

      {/* CREATE SALE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-400" />
                Nueva Venta
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cliente</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Público General</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Venta</label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Add Product or Combo Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">+ Agregar Producto</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addProductToSale(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="" disabled>
                      Seleccionar producto...
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.salePrice)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">+ Agregar Paquete / Combo</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addPackageToSale(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="" disabled>
                      Seleccionar paquete combo...
                    </option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({formatCurrency(pkg.packagePrice)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 block">Artículos de la Venta:</span>
                {saleItems.length > 0 ? (
                  <div className="divide-y divide-slate-800/60">
                    {saleItems.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="font-semibold text-white truncate">{item.description}</div>
                          <div className="text-[10px] text-slate-400">
                            Unitario: {formatCurrency(item.unitPrice)}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => updateItemQty(idx, item.quantity - 1)}
                              className="px-2 py-0.5 text-xs text-slate-400 hover:text-white"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-mono font-bold text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateItemQty(idx, item.quantity + 1)}
                              className="px-2 py-0.5 text-xs text-slate-400 hover:text-white"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-mono font-bold text-slate-200 w-16 text-right">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateItemQty(idx, 0)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-500">
                    Selecciona productos o paquetes arriba para agregarlos a la venta.
                  </div>
                )}
              </div>

              {/* Discount & Totals */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Descuento ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-right">
                  <span className="text-[10px] text-slate-400 block">TOTAL DE LA VENTA</span>
                  <span className="text-xl font-black text-brand-400 font-mono">
                    {formatCurrency(saleTotal)}
                  </span>
                </div>
              </div>

              {/* Initial Payment / Anticipo */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-emerald-400 block">
                  Registrar Anticipo / Pago Inicial (Opcional):
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Monto Pagado ($)</label>
                    <input
                      type="number"
                      min="0"
                      max={saleTotal}
                      step="0.5"
                      value={initialPayment}
                      onChange={(e) => setInitialPayment(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Método de Pago</label>
                    <select
                      value={initialPaymentMethod}
                      onChange={(e) => setInitialPaymentMethod(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Mercado Pago">Mercado Pago</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notas de Entrega o Producción</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre colores, fecha pactada, etc..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs"
                >
                  Registrar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PARTIAL PAYMENT MODAL */}
      {isPaymentModalOpen && activeSaleForPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand-400" />
                Registrar Pago: {activeSaleForPayment.saleNumber}
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Balance Overview */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">Total</span>
                <span className="font-bold text-white">{formatCurrency(activeSaleForPayment.total)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Pagado</span>
                <span className="font-bold text-emerald-400">{formatCurrency(activeSaleForPayment.paidAmount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Pendiente</span>
                <span className="font-bold text-amber-400">{formatCurrency(activeSaleForPayment.pendingAmount)}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Monto del Pago ($)</label>
                <input
                  type="number"
                  required
                  min="0.5"
                  max={activeSaleForPayment.pendingAmount}
                  step="0.5"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold text-brand-400"
                />
              </div>

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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Referencia / Comprobante</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Ej: BBVA-1234, Efectivo en mano..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW SALE DETAIL MODAL */}
      {viewingSale && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Detalle de Venta: {viewingSale.saleNumber}</h3>
              <button onClick={() => setViewingSale(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Cliente:</span>
                <span className="font-bold text-white">{viewingSale.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Fecha:</span>
                <span>{new Date(viewingSale.date).toLocaleDateString('es-MX')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Estado:</span>
                <span className="font-bold text-brand-400">{viewingSale.status}</span>
              </div>

              {/* Items */}
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <span className="font-semibold text-slate-400 block">Artículos:</span>
                {viewingSale.items?.map((it: any) => (
                  <div key={it.id} className="flex justify-between py-0.5">
                    <span>{it.quantity} × {it.description}</span>
                    <span className="font-mono">{formatCurrency(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Payments History */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <span className="font-semibold text-slate-400 block">Historial de Pagos Recibidos:</span>
                {viewingSale.payments?.length > 0 ? (
                  viewingSale.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between text-[11px] p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div>
                        <span className="font-bold text-emerald-400">{formatCurrency(p.amount)}</span> ({p.method})
                        <div className="text-[10px] text-slate-500">{p.reference || 'Sin ref.'}</div>
                      </div>
                      <span className="text-slate-400">{new Date(p.date).toLocaleDateString('es-MX')}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500">Sin pagos registrados aún.</span>
                )}
              </div>

              {/* Totals */}
              <div className="pt-3 border-t border-slate-800 flex justify-between font-mono font-bold text-sm">
                <span>Saldo Pendiente:</span>
                <span className={viewingSale.pendingAmount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                  {formatCurrency(viewingSale.pendingAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
