'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Palette,
  X,
  Tag,
  Check,
  FolderTree,
} from 'lucide-react';

export default function SeasonsCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab State: 'seasons' | 'categories'
  const [activeTab, setActiveTab] = useState<'seasons' | 'categories'>('seasons');

  // Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('tag');

  // Season Modal
  const [isSeaModalOpen, setIsSeaModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<any | null>(null);
  const [seaName, setSeaName] = useState('');
  const [seaDesc, setSeaDesc] = useState('');
  const [seaPrimaryColor, setSeaPrimaryColor] = useState('#DC2626');
  const [seaAccentColor, setSeaAccentColor] = useState('#16A34A');
  const [seaThemeStyle, setSeaThemeStyle] = useState('christmas');
  const [seaStartDate, setSeaStartDate] = useState('');
  const [seaEndDate, setSeaEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, seaRes] = await Promise.all([
        fetch('/api/categories').then((r) => r.json()),
        fetch('/api/seasons').then((r) => r.json()),
      ]);
      if (Array.isArray(catRes)) setCategories(catRes);
      if (Array.isArray(seaRes)) setSeasons(seaRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Category Actions
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setCatIcon('tag');
    setIsCatModalOpen(true);
  };

  const openEditCategory = (c: any) => {
    setEditingCategory(c);
    setCatName(c.name);
    setCatDesc(c.description || '');
    setCatIcon(c.icon || 'tag');
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      const payload = { name: catName, description: catDesc, icon: catIcon };
      let res;
      if (editingCategory) {
        res = await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCategory.id, ...payload }),
        });
      } else {
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setIsCatModalOpen(false);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Season Actions
  const openCreateSeason = () => {
    setEditingSeason(null);
    setSeaName('');
    setSeaDesc('');
    setSeaPrimaryColor('#DC2626');
    setSeaAccentColor('#16A34A');
    setSeaThemeStyle('standard');
    setSeaStartDate('');
    setSeaEndDate('');
    setIsSeaModalOpen(true);
  };

  const openEditSeason = (s: any) => {
    setEditingSeason(s);
    setSeaName(s.name);
    setSeaDesc(s.description || '');
    setSeaPrimaryColor(s.primaryColorHex || '#DC2626');
    setSeaAccentColor(s.accentColorHex || '#16A34A');
    setSeaThemeStyle(s.themeStyle || 'standard');
    setSeaStartDate(s.startDate ? s.startDate.split('T')[0] : '');
    setSeaEndDate(s.endDate ? s.endDate.split('T')[0] : '');
    setIsSeaModalOpen(true);
  };

  const handleSaveSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seaName.trim()) return;

    try {
      const payload = {
        name: seaName,
        description: seaDesc,
        primaryColorHex: seaPrimaryColor,
        accentColorHex: seaAccentColor,
        themeStyle: seaThemeStyle,
        startDate: seaStartDate || null,
        endDate: seaEndDate || null,
      };

      let res;
      if (editingSeason) {
        res = await fetch('/api/seasons', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSeason.id, ...payload }),
        });
      } else {
        res = await fetch('/api/seasons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      setIsSeaModalOpen(false);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteSeason = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la temporada "${name}"?`)) return;
    try {
      const res = await fetch(`/api/seasons?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      loadData();
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
            Temporadas & Categorías
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organiza tus productos y catálogos comerciales por eventos del año y familias de artículos
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('seasons')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'seasons'
                ? 'bg-brand-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Temporadas ({seasons.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'categories'
                ? 'bg-brand-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" /> Categorías ({categories.length})
          </button>
        </div>
      </div>

      {/* SEASONS TAB */}
      {activeTab === 'seasons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Cada temporada define la estética, portada y temas del catálogo PDF comercial.
            </span>
            <button
              onClick={openCreateSeason}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Temporada
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {seasons.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between shadow-sm relative group"
              >
                {/* Visual Banner Accent */}
                <div
                  className="h-3 w-full"
                  style={{
                    background: `linear-gradient(90deg, ${s.primaryColorHex} 0%, ${s.accentColorHex} 100%)`,
                  }}
                />

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: s.primaryColorHex }}
                        />
                        <h3 className="text-sm font-bold text-white">{s.name}</h3>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                        {s.themeStyle}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {s.description || 'Sin descripción especial'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-brand-400">
                      {s._count?.products || 0} productos
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditSeason(s)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSeason(s.id, s.name)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Categorías comerciales ilimitadas y editables para clasificar tus impresiones 3D.
            </span>
            <button
              onClick={openCreateCategory}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Categoría
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 shadow-sm hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h3 className="text-xs font-bold text-white truncate">{c.name}</h3>
                    <span className="text-[11px] text-slate-400">
                      {c._count?.products || 0} productos
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditCategory(c)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(c.id, c.name)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-400" />
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de la Categoría</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ej: Llaveros, Figuras, Macetas..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción (Opcional)</label>
                <textarea
                  rows={2}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEASON MODAL */}
      {isSeaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                {editingSeason ? 'Editar Temporada' : 'Nueva Temporada'}
              </h3>
              <button onClick={() => setIsSeaModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSeason} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de la Temporada</label>
                <input
                  type="text"
                  required
                  value={seaName}
                  onChange={(e) => setSeaName(e.target.value)}
                  placeholder="Navidad, Halloween, San Valentín..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Estilo Visual para Catálogo PDF</label>
                <select
                  value={seaThemeStyle}
                  onChange={(e) => setSeaThemeStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="standard">Estándar / Corporativo</option>
                  <option value="christmas">Navidad (Festivo, Rojo/Verde/Dorado)</option>
                  <option value="halloween">Halloween (Terror, Naranja/Púrpura/Negro)</option>
                  <option value="romantic">San Valentín (Romántico, Carmín/Rosa)</option>
                  <option value="spring">Primavera / Madres (Pasteles y Florales)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Color Primario</label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5">
                    <input
                      type="color"
                      value={seaPrimaryColor}
                      onChange={(e) => setSeaPrimaryColor(e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={seaPrimaryColor}
                      onChange={(e) => setSeaPrimaryColor(e.target.value)}
                      className="w-20 bg-transparent text-xs text-white font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Color Secundario / Acento</label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5">
                    <input
                      type="color"
                      value={seaAccentColor}
                      onChange={(e) => setSeaAccentColor(e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={seaAccentColor}
                      onChange={(e) => setSeaAccentColor(e.target.value)}
                      className="w-20 bg-transparent text-xs text-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={seaDesc}
                  onChange={(e) => setSeaDesc(e.target.value)}
                  placeholder="Detalles y fecha de inicio de preventa..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSeaModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs"
                >
                  Guardar Temporada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
