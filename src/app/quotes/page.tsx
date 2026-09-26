'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  X,
  MessageCircle,
  ArrowRight,
  Printer,
  ShoppingBag,
} from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [validityDays, setValidityDays] = useState<number>(15);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [quoteItems, setQuoteItems] = useState<
    Array<{
      productId?: string;
      packageId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }>
  >([]);

  // Detail Modal
  const [viewingQuote, setViewingQuote] = useState<any | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [qRes, cRes, pRes, pkgRes] = await Promise.all([
        fetch('/api/quotes').then((r) => r.json()),
        fetch('/api/customers').then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/packages').then((r) => r.json()),
      ]);

      if (Array.isArray(qRes)) setQuotes(qRes);
      if (Array.isArray(cRes)) setCustomers(cRes);
      if (Array.isArray(pRes)) setProducts(pRes);
      if (Array.isArray(pkgRes)) setPackages(pkgRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedCustomerId(customers[0]?.id || '');
    setQuoteDate(new Date().toISOString().split('T')[0]);
    setValidityDays(15);
    setDiscount(0);
    setNotes('');
    setQuoteItems([]);
    setIsModalOpen(true);
  };

  const addProductToQuote = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    setQuoteItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        description: prod.name,
        quantity: 1,
        unitPrice: prod.salePrice,
      },
    ]);
  };

  const addPackageToQuote = (pkgId: string) => {
    const pkg = packages.find((p) => p.id === pkgId);
    if (!pkg) return;

    setQuoteItems((prev) => [
      ...prev,
      {
        packageId: pkg.id,
        description: `Combo: ${pkg.name}`,
        quantity: 1,
        unitPrice: pkg.packagePrice,
      },
    ]);
  };

  const updateItemQty = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setQuoteItems((prev) => prev.filter((_, idx) => idx !== index));
    } else {
      setQuoteItems((prev) =>
        prev.map((it, idx) => (idx === index ? { ...it, quantity } : it))
      );
    }
  };

  const quoteSubtotal = quoteItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  const quoteTotal = Math.max(0, quoteSubtotal - discount);

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteItems.length === 0) {
      alert('Agrega al menos un producto a la cotización');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);

    const payload = {
      customerId: selectedCustomerId || null,
      customerName: customer?.name || 'Público General',
      customerPhone: customer?.phone || customer?.whatsapp || '',
      date: quoteDate,
      validityDays: Number(validityDays),
      discount: Number(discount),
      items: quoteItems,
      notes,
    };

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      setIsModalOpen(false);
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Convert Quote into Sale
  const handleConvertToSale = async (quoteId: string) => {
    if (!confirm('¿Convertir esta cotización en una Venta confirmada?')) return;

    try {
      const res = await fetch(`/api/quotes/${quoteId}/convert`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al convertir');

      alert(`¡Cotización convertida con éxito en la venta ${json.sale.saleNumber}!`);
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta cotización?')) return;
    try {
      const res = await fetch(`/api/quotes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      loadAll();
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
            <FileText className="w-6 h-6 text-brand-400" />
            Cotizaciones & Presupuestos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Crea presupuestos formales con vigencia y conviértelos directamente en órdenes de venta
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" /> Nueva Cotización
        </button>
      </div>

      {/* Quotes List */}
      <div className="space-y-3">
        {quotes.map((q) => {
          const isConverted = q.status === 'convertida';
          const waPhone = (q.customerPhone || '').replace(/\D/g, '');

          const waQuoteMsg = encodeURIComponent(
            `¡Hola ${q.customerName}! Te adjunto el resumen de tu cotización *${q.quoteNumber}*:\n\n` +
              `Total: ${formatCurrency(q.total)}\n` +
              `Vigencia: ${q.validityDays} días\n\n` +
              `Artículos:\n` +
              q.items?.map((it: any) => `• ${it.quantity}x ${it.description} - ${formatCurrency(it.subtotal)}`).join('\n') +
              `\n\n¿Deseas confirmar tu pedido para iniciar producción?`
          );

          return (
            <div
              key={q.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-brand-400">{q.quoteNumber}</span>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-xs text-slate-400">
                    {new Date(q.date).toLocaleDateString('es-MX')}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isConverted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {isConverted ? 'Convertida en Venta' : 'Vigente (15 días)'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{q.customerName}</h3>
                <div className="text-xs text-slate-400">
                  {q.items?.length || 0} artículos incluidos
                </div>
              </div>

              {/* Total & Action Box */}
              <div className="flex items-center gap-4 self-end md:self-center">
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-500 block">TOTAL COTIZADO</span>
                  <span className="text-lg font-black text-white">{formatCurrency(q.total)}</span>
                </div>

                {!isConverted && (
                  <button
                    onClick={() => handleConvertToSale(q.id)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Convertir en Venta
                  </button>
                )}

                {waPhone && (
                  <a
                    href={`https://wa.me/52${waPhone}?text=${waQuoteMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-950 text-emerald-400 transition-colors"
                    title="Enviar cotización por WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}

                <button
                  onClick={() => setViewingQuote(q)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(q.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {quotes.length === 0 && !loading && (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
          <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2 stroke-[1.5]" />
          <p className="text-sm font-semibold">No hay cotizaciones registradas</p>
          <button
            onClick={openCreateModal}
            className="mt-3 px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Crear Cotización
          </button>
        </div>
      )}

      {/* CREATE QUOTE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-400" />
                Nueva Cotización Comercial
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cliente</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="">Público General</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone || c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Vigencia (Días)</label>
                  <input
                    type="number"
                    min="1"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value) || 15)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Add item dropdowns */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">+ Agregar Producto</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addProductToQuote(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="" disabled>Seleccionar producto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.salePrice)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">+ Agregar Combo</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addPackageToQuote(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="" disabled>Seleccionar combo...</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name} ({formatCurrency(pkg.packagePrice)})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 block">Artículos de la Cotización:</span>
                {quoteItems.length > 0 ? (
                  <div className="divide-y divide-slate-800/60">
                    {quoteItems.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="font-semibold text-white truncate">{item.description}</div>
                          <div className="text-[10px] text-slate-400">Unit: {formatCurrency(item.unitPrice)}</div>
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
                            <span className="px-2 text-xs font-mono font-bold text-white">{item.quantity}</span>
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
                    Agrega productos o paquetes a la cotización.
                  </div>
                )}
              </div>

              {/* Total & Discount */}
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
                  <span className="text-[10px] text-slate-400 block">TOTAL COTIZADO</span>
                  <span className="text-xl font-black text-brand-400 font-mono">
                    {formatCurrency(quoteTotal)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notas y Condiciones</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anticipo del 50% requerido para iniciar producción..."
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
                  Crear Cotización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {viewingQuote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Cotización: {viewingQuote.quoteNumber}</h3>
              <button onClick={() => setViewingQuote(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Cliente:</span>
                <span className="font-bold text-white">{viewingQuote.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Fecha:</span>
                <span>{new Date(viewingQuote.date).toLocaleDateString('es-MX')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Vigencia:</span>
                <span>{viewingQuote.validityDays} días</span>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1">
                <span className="font-semibold text-slate-400 block">Artículos:</span>
                {viewingQuote.items?.map((it: any) => (
                  <div key={it.id} className="flex justify-between py-0.5">
                    <span>{it.quantity} × {it.description}</span>
                    <span className="font-mono">{formatCurrency(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between font-mono font-bold text-sm">
                <span>Total:</span>
                <span className="text-brand-400">{formatCurrency(viewingQuote.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
