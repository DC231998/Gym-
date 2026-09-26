'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  X,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Tarímbaro');
  const [state, setState] = useState('Michoacán');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setAddress('');
    setNeighborhood('El Trébol');
    setCity('Tarímbaro');
    setState('Michoacán');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: any) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone || '');
    setWhatsapp(c.whatsapp || '');
    setEmail(c.email || '');
    setAddress(c.address || '');
    setNeighborhood(c.neighborhood || '');
    setCity(c.city || 'Tarímbaro');
    setState(c.state || 'Michoacán');
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name,
      phone,
      whatsapp: whatsapp || phone,
      email,
      address,
      neighborhood,
      city,
      state,
      notes,
    };

    try {
      let res;
      if (editingCustomer) {
        res = await fetch('/api/customers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCustomer.id, ...payload }),
        });
      } else {
        res = await fetch('/api/customers', {
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
      loadCustomers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string, custName: string) => {
    if (!confirm(`¿Eliminar al cliente "${custName}"?`)) return;
    try {
      const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      loadCustomers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            Directorio de Clientes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Historial de compras, pedidos activos, saldos pendientes y contacto por WhatsApp
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" /> Registrar Cliente
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono o ciudad..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const waPhone = (c.whatsapp || c.phone || '').replace(/\D/g, '');
          const waUrl = waPhone
            ? `https://wa.me/52${waPhone}?text=${encodeURIComponent(
                `Hola ${c.name}, te escribo del taller de impresión 3D.`
              )}`
            : null;

          return (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{c.name}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-400" />
                      <span>
                        {c.neighborhood ? `${c.neighborhood}, ` : ''}
                        {c.city || 'Tarímbaro'}
                      </span>
                    </div>
                  </div>

                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/60 transition-colors"
                      title="Chatear por WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Contact details */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 text-xs text-slate-400">
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial metrics for this customer */}
              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Pedidos</span>
                    <span className="font-bold text-white">{c.orderCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Comprado</span>
                    <span className="font-bold text-emerald-400">
                      {formatCurrency(c.totalSpent || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Saldo Pend.</span>
                    <span
                      className={`font-bold ${
                        (c.totalPending || 0) > 0 ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      {formatCurrency(c.totalPending || 0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
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
          <Users className="w-10 h-10 mx-auto text-slate-600 mb-2 stroke-[1.5]" />
          <p className="text-sm font-semibold">No se encontraron clientes registrados</p>
          <button
            onClick={openCreateModal}
            className="mt-3 px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Registrar Cliente
          </button>
        </div>
      )}

      {/* CREATE / EDIT CUSTOMER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                {editingCustomer ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Laura Gómez"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="443 123 4567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="443 123 4567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Colonia / Fracc.</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="El Trébol"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Tarímbaro / Morelia"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notas del Cliente</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferencias de color, entregas frecuentes..."
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
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
