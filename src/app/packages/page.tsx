'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Percent,
  Check,
  X,
  Box,
  Tag,
  ShoppingBag,
} from 'lucide-react';
import { calculatePackageMetrics, formatCurrency } from '@/lib/calculations';

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<
    Array<{ productId: string; quantity: number; unitCost: number; unitPrice: number; name: string }>
  >([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pkgRes, prodRes] = await Promise.all([
        fetch('/api/packages').then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
      ]);
      if (Array.isArray(pkgRes)) setPackages(pkgRes);
      if (Array.isArray(prodRes)) setProducts(prodRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPackage(null);
    setName('');
    setSku(`PKG-${Date.now().toString(36).toUpperCase()}`);
    setDescription('');
    setDiscountType('percent');
    setDiscountValue(10);
    setCustomPrice('');
    setSelectedItems([]);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: any) => {
    setEditingPackage(pkg);
    setName(pkg.name);
    setSku(pkg.sku);
    setDescription(pkg.description || '');
    setDiscountType(pkg.discountType);
    setDiscountValue(pkg.discountValue);
    setCustomPrice(pkg.packagePrice.toString());
    setSelectedItems(
      (pkg.items || []).map((it: any) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitCost: it.unitCost,
        unitPrice: it.unitPrice,
        name: it.product?.name || 'Producto',
      }))
    );
    setIsModalOpen(true);
  };

  const addItemToPackage = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    setSelectedItems((prev) => {
      const exists = prev.find((item) => item.productId === prodId);
      if (exists) {
        return prev.map((item) =>
          item.productId === prodId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          quantity: 1,
          unitCost: prod.realCost,
          unitPrice: prod.salePrice,
          name: prod.name,
        },
      ];
    });
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setSelectedItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
      );
    }
  };

  // Live metrics calculation
  const metrics = calculatePackageMetrics(
    selectedItems.map((i) => ({
      unitCost: i.unitCost,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
    })),
    discountType,
    discountValue
  );

  const finalPackagePrice = customPrice !== '' ? parseFloat(customPrice) || 0 : metrics.packagePrice;
  const finalProfit = Number((finalPackagePrice - metrics.totalCost).toFixed(2));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedItems.length === 0) {
      alert('Nombre y al menos un producto son obligatorios');
      return;
    }

    const payload = {
      name,
      sku,
      description,
      discountType,
      discountValue: Number(discountValue),
      customPrice: customPrice !== '' ? Number(customPrice) : undefined,
      items: selectedItems,
    };

    try {
      let res;
      if (editingPackage) {
        res = await fetch('/api/packages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPackage.id, ...payload }),
        });
      } else {
        res = await fetch('/api/packages', {
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
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string, pkgName: string) => {
    if (!confirm(`¿Eliminar el combo "${pkgName}"?`)) return;
    try {
      const res = await fetch(`/api/packages?id=${id}`, { method: 'DELETE' });
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
            <Layers className="w-6 h-6 text-brand-400" />
            Paquetes & Combos Comerciales
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Crea promociones agrupando múltiples productos con descuentos porcentuales o precio fijo
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" /> Crear Nuevo Combo
        </button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-brand-400 uppercase bg-brand-950/60 px-2 py-0.5 rounded border border-brand-500/30">
                  {pkg.sku}
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {pkg.discountType === 'percent'
                    ? `-${pkg.discountValue}% DESC`
                    : `-$${pkg.discountValue} DESC`}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mt-2">{pkg.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {pkg.description || 'Set combinado con precio promocional.'}
              </p>

              {/* Items included list */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 block">Artículos incluidos:</span>
                {pkg.items?.map((it: any) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between text-xs text-slate-300 py-0.5"
                  >
                    <span className="truncate">
                      {it.quantity} × {it.product?.name || 'Producto'}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {formatCurrency(it.unitPrice * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial summary */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 line-through block">
                    Precio Normal: {formatCurrency(pkg.normalPrice)}
                  </span>
                  <span className="text-lg font-black text-brand-400">
                    {formatCurrency(pkg.packagePrice)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Ganancia</span>
                  <span className="text-xs font-bold text-emerald-400">
                    +{formatCurrency(pkg.profit)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 pt-1">
                <button
                  onClick={() => openEditModal(pkg)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(pkg.id, pkg.name)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {packages.length === 0 && !loading && (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
          <Layers className="w-10 h-10 mx-auto text-slate-600 mb-2 stroke-[1.5]" />
          <p className="text-sm font-semibold">No hay combos registrados</p>
          <button
            onClick={openCreateModal}
            className="mt-3 px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Crear tu Primer Paquete
          </button>
        </div>
      )}

      {/* CREATE / EDIT COMBO MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-400" />
                {editingPackage ? 'Editar Combo' : 'Crear Paquete / Combo'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Combo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Kit Navideño 5x, Set Oficina Completo..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SKU</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Agregar Producto al Combo</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addItemToPackage(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="" disabled>
                      + Seleccionar producto...
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.salePrice)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Items List */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 block">Productos en este Combo:</span>
                {selectedItems.length > 0 ? (
                  <div className="divide-y divide-slate-800/60">
                    {selectedItems.map((item) => (
                      <div
                        key={item.productId}
                        className="py-2 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="font-semibold text-white truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-400">
                            Unit: {formatCurrency(item.unitPrice)} • Costo: {formatCurrency(item.unitCost)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                              className="px-2 py-0.5 text-xs text-slate-400 hover:text-white"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-mono font-bold text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                              className="px-2 py-0.5 text-xs text-slate-400 hover:text-white"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.productId, 0)}
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
                    Selecciona productos en el menú desplegable arriba para armar el combo.
                  </div>
                )}
              </div>

              {/* Discount & Price Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Descuento</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="percent">Porcentual (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor del Descuento ({discountType === 'percent' ? '%' : '$'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Precio Personalizado ($)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder={metrics.packagePrice.toString()}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-brand-400 font-bold font-mono"
                  />
                </div>
              </div>

              {/* Metrics Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Costo Total</span>
                  <span className="font-mono font-bold text-slate-200">{formatCurrency(metrics.totalCost)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Precio Sugerido</span>
                  <span className="font-mono font-bold text-brand-400">{formatCurrency(finalPackagePrice)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Ganancia Neta</span>
                  <span className="font-mono font-bold text-emerald-400">+{formatCurrency(finalProfit)}</span>
                </div>
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
                  Guardar Paquete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
