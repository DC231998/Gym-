'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box,
  Plus,
  Search,
  Filter,
  Image as ImageIcon,
  Star,
  Trash2,
  Edit2,
  Clock,
  Disc,
  Tag,
  Calendar,
  X,
  Check,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import VisualColorPicker from '@/components/VisualColorPicker';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [filaments, setFilaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeason, setSelectedSeason] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [filamentId, setFilamentId] = useState('');
  const [colorHex, setColorHex] = useState('#1A1A1A');
  const [colorName, setColorName] = useState('Negro');
  const [weightGrams, setWeightGrams] = useState(0);
  const [printTimeMinutes, setPrintTimeMinutes] = useState(0);
  const [realCost, setRealCost] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(2);
  const [status, setStatus] = useState('activo');
  const [images, setImages] = useState<Array<{ url: string; isPrimary: boolean }>>([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, seaRes, filRes] = await Promise.all([
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
        fetch('/api/seasons').then((r) => r.json()),
        fetch('/api/filaments').then((r) => r.json()),
      ]);

      if (Array.isArray(prodRes)) setProducts(prodRes);
      if (Array.isArray(catRes)) setCategories(catRes);
      if (Array.isArray(seaRes)) setSeasons(seaRes);
      if (Array.isArray(filRes)) setFilaments(filRes);
    } catch (e) {
      console.error('Error loading products page data:', e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`PRD-${Date.now().toString(36).toUpperCase()}`);
    setDescription('');
    setCategoryId(categories[0]?.id || '');
    setSeasonId(seasons[0]?.id || '');
    setFilamentId(filaments[0]?.id || '');
    setColorHex(filaments[0]?.colorHex || '#1A1A1A');
    setColorName(filaments[0]?.colorName || 'Negro');
    setWeightGrams(50);
    setPrintTimeMinutes(90);
    setRealCost(25);
    setSalePrice(60);
    setStock(5);
    setMinStock(2);
    setStatus('activo');
    setImages([]);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: any) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSku(prod.sku);
    setDescription(prod.description || '');
    setCategoryId(prod.categoryId);
    setSeasonId(prod.seasonId);
    setFilamentId(prod.primaryFilamentId || '');
    setColorHex(prod.defaultColorHex || '#1A1A1A');
    setColorName(prod.defaultColorName || 'Negro');
    setWeightGrams(prod.weightGrams || 0);
    setPrintTimeMinutes(prod.printTimeMinutes || 0);
    setRealCost(prod.realCost || 0);
    setSalePrice(prod.salePrice || 0);
    setStock(prod.stock || 0);
    setMinStock(prod.minStock || 2);
    setStatus(prod.status || 'activo');
    setImages(
      (prod.images || []).map((img: any) => ({
        url: img.url,
        isPrimary: Boolean(img.isPrimary),
      }))
    );
    setIsModalOpen(true);
  };

  // Image Upload handler to Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => [
            ...prev,
            { url: reader.result as string, isPrimary: prev.length === 0 },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        isPrimary: idx === index,
      }))
    );
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || !seasonId) {
      alert('Nombre, categoría y temporada son obligatorios');
      return;
    }

    const payload = {
      name,
      sku,
      description,
      categoryId,
      seasonId,
      primaryFilamentId: filamentId || null,
      defaultColorHex: colorHex,
      defaultColorName: colorName,
      weightGrams: Number(weightGrams),
      printTimeMinutes: Number(printTimeMinutes),
      realCost: Number(realCost),
      salePrice: Number(salePrice),
      stock: Number(stock),
      minStock: Number(minStock),
      status,
      images,
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProduct.id, ...payload }),
        });
      } else {
        res = await fetch('/api/products', {
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
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (!confirm(`¿Eliminar definitivamente el producto "${prodName}"?`)) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      loadAll();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSeason = selectedSeason === 'all' || p.seasonId === selectedSeason;
    return matchesSearch && matchesCategory && matchesSeason;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Box className="w-6 h-6 text-brand-400" />
            Catálogo de Productos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Administra tus modelos 3D, fotografías, costos, inventario y variantes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Fijador de Precios
          </Link>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
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
            placeholder="Buscar por nombre o SKU..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="all">Todas las Temporadas</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid (Mobile Friendly Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((prod) => {
          const primaryImg = prod.images?.find((img: any) => img.isPrimary) || prod.images?.[0];
          const isLowStock = prod.stock <= prod.minStock;

          return (
            <div
              key={prod.id}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden flex flex-col group hover:border-slate-700 transition-all shadow-sm"
            >
              {/* Product Image / Primary Photo */}
              <div className="aspect-square bg-slate-950 relative overflow-hidden flex items-center justify-center">
                {primaryImg?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={primaryImg.url}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
                    <ImageIcon className="w-10 h-10 stroke-[1.5]" />
                    <span className="text-[11px]">Sin fotografía</span>
                  </div>
                )}

                {/* Stock badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md ${
                      isLowStock
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {prod.stock} en stock
                  </span>
                </div>

                {/* Season & Category Pills */}
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] font-medium text-slate-300 border border-slate-800">
                    {prod.category?.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-brand-950/80 backdrop-blur-md text-[10px] font-medium text-brand-400 border border-brand-500/30">
                    {prod.season?.name}
                  </span>
                </div>
              </div>

              {/* Product Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">{prod.sku}</div>
                  <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1">{prod.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{prod.description || 'Sin descripción'}</p>
                </div>

                {/* Specs row */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Disc className="w-3.5 h-3.5 text-slate-500" /> {prod.weightGrams}g
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> {Math.round(prod.printTimeMinutes / 60 * 10) / 10}h
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/20"
                      style={{ backgroundColor: prod.defaultColorHex }}
                    />
                    <span className="text-[10px] truncate max-w-[60px]">{prod.defaultColorName}</span>
                  </div>
                </div>

                {/* Price & Action Row */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Precio Venta</span>
                    <span className="text-base font-black text-brand-400">
                      {formatCurrency(prod.salePrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(prod)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Editar producto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id, prod.name)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
          <Box className="w-10 h-10 mx-auto text-slate-600 mb-2 stroke-[1.5]" />
          <p className="text-sm font-semibold">No se encontraron productos con estos filtros</p>
          <button
            onClick={openCreateModal}
            className="mt-3 px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Crear Nuevo Producto
          </button>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Box className="w-5 h-5 text-brand-400" />
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Maceta Geométrica"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoría</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    {seasons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Estado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="activo">Activo</option>
                    <option value="borrador">Borrador</option>
                    <option value="archivado">Archivado</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción comercial para catálogo y cotizaciones..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Photographs / Multiple Images */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-brand-400" />
                    Fotografías del Producto (Múltiples)
                  </label>
                  <label className="cursor-pointer px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" /> Subir foto
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Images list with Primary Selector */}
                {images.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`aspect-square rounded-xl overflow-hidden relative border group ${
                          img.isPrimary ? 'border-brand-500 ring-2 ring-brand-500/40' : 'border-slate-800'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="Producto" className="w-full h-full object-cover" />

                        {/* Primary Badge or Selector */}
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(idx)}
                          className={`absolute top-1 left-1 p-1 rounded-md text-[10px] font-bold flex items-center gap-0.5 shadow-md ${
                            img.isPrimary
                              ? 'bg-brand-500 text-slate-950'
                              : 'bg-black/60 text-slate-400 hover:text-white'
                          }`}
                          title={img.isPrimary ? 'Foto principal' : 'Establecer como principal'}
                        >
                          <Star className="w-3 h-3 fill-current" />
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-rose-400 hover:bg-rose-950/80"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No has agregado fotografías. La foto principal se incluirá en el catálogo PDF.
                  </div>
                )}
              </div>

              {/* Physical Specs & Pricing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Gramos (g)</label>
                  <input
                    type="number"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Minutos Impr.</label>
                  <input
                    type="number"
                    value={printTimeMinutes}
                    onChange={(e) => setPrintTimeMinutes(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Precio Venta ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={salePrice}
                    onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-brand-400 font-bold font-mono"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
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
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
