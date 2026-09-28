'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Building,
  Zap,
  DollarSign,
  BookOpen,
  Trash2,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
} from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import TeamManagement from '@/components/settings/TeamManagement';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Business Form State
  const [businessName, setBusinessName] = useState('3D Business Manager');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [phone, setPhone] = useState('443 123 4567');
  const [whatsapp, setWhatsapp] = useState('4431234567');
  const [email, setEmail] = useState('contacto@3dbusiness.com');
  const [address, setAddress] = useState('Circuito Los Olivos #142');
  const [neighborhood, setNeighborhood] = useState('El Trébol');
  const [city, setCity] = useState('Tarímbaro');
  const [state, setState] = useState('Michoacán');
  const [country, setCountry] = useState('México');

  // Electricity
  const [defaultElectricityRate, setDefaultElectricityRate] = useState<number | string>(2.15);
  const [electricityTariffType, setElectricityTariffType] = useState('1B / Doméstica Ordinaria (CFE)');
  const [electricityRateSource, setElectricityRateSource] = useState('CFE Tarifa Doméstica Tarímbaro Michoacán');

  // Pricing Defaults
  const [defaultLaborRatePerHour, setDefaultLaborRatePerHour] = useState<number | string>(60);
  const [defaultFailureRatePercent, setDefaultFailureRatePercent] = useState<number | string>(5);
  const [defaultMarginPercent, setDefaultMarginPercent] = useState<number | string>(50);
  const [defaultRoundPrices, setDefaultRoundPrices] = useState<boolean>(true);

  // Profit Distribution
  const [profitReinvestmentPercent, setProfitReinvestmentPercent] = useState<number>(40);
  const [profitMaintenancePercent, setProfitMaintenancePercent] = useState<number>(20);
  const [profitOwnerPercent, setProfitOwnerPercent] = useState<number>(40);

  // Catalog
  const [catalogHeaderNotes, setCatalogHeaderNotes] = useState('');
  const [catalogFooterNotes, setCatalogFooterNotes] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data) {
        setSettings(data);
        setBusinessName(data.businessName || '3D Business Manager');
        setCompanyLogo(data.companyLogo || null);
        setCurrentUserRole(data.currentUserRole || '');
        setPhone(data.phone || '');
        setWhatsapp(data.whatsapp || '');
        setEmail(data.email || '');
        setAddress(data.address || '');
        setNeighborhood(data.neighborhood || 'El Trébol');
        setCity(data.city || 'Tarímbaro');
        setState(data.state || 'Michoacán');
        setCountry(data.country || 'México');

        setDefaultElectricityRate(data.defaultElectricityRate ?? 2.15);
        setElectricityTariffType(data.electricityTariffType || '1B / Doméstica Ordinaria (CFE)');
        setElectricityRateSource(data.electricityRateSource || 'CFE Tarifa Doméstica Tarímbaro Michoacán');

        setDefaultLaborRatePerHour(data.defaultLaborRatePerHour ?? 60);
        setDefaultFailureRatePercent(data.defaultFailureRatePercent ?? 5);
        setDefaultMarginPercent(data.defaultMarginPercent ?? 50);
        setDefaultRoundPrices(data.defaultRoundPrices ?? true);

        setProfitReinvestmentPercent(data.profitReinvestmentPercent ?? 40);
        setProfitMaintenancePercent(data.profitMaintenancePercent ?? 20);
        setProfitOwnerPercent(data.profitOwnerPercent ?? 40);

        setCatalogHeaderNotes(data.catalogHeaderNotes || '');
        setCatalogFooterNotes(data.catalogFooterNotes || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    const payload = {
      businessName,
      companyLogo,
      phone,
      whatsapp,
      email,
      address,
      neighborhood,
      city,
      state,
      country,
      defaultElectricityRate: Number(defaultElectricityRate) || 0,
      electricityTariffType,
      electricityRateSource,
      defaultLaborRatePerHour: Number(defaultLaborRatePerHour) || 0,
      defaultFailureRatePercent: Number(defaultFailureRatePercent) || 0,
      defaultMarginPercent: Number(defaultMarginPercent) || 0,
      defaultRoundPrices,
      profitReinvestmentPercent: Number(profitReinvestmentPercent),
      profitMaintenancePercent: Number(profitMaintenancePercent),
      profitOwnerPercent: Number(profitOwnerPercent),
      catalogHeaderNotes,
      catalogFooterNotes,
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al guardar');

      setSuccessMessage('¡Configuración del negocio guardada exitosamente!');
      setTimeout(() => setSuccessMessage(null), 3000);
      loadSettings();
      window.dispatchEvent(new Event('settingsUpdated'));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen inicial no debe superar los 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max dimensions
        const MAX_SIZE = 256;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/webp', 0.8);
          setCompanyLogo(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Demo Data Deletion
  const handleDeleteDemoData = async () => {
    if (
      !confirm(
        'ADVERTENCIA: ¿Estás seguro de que deseas eliminar todos los datos demo de prueba? Esto reiniciará transacciones, ventas y productos de muestra.'
      )
    )
      return;

    try {
      const res = await fetch('/api/demo', { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      alert(json.message);
      window.location.reload();
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
            <Settings className="w-6 h-6 text-brand-400" />
            Configuración del Negocio
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Personaliza el nombre de la empresa, tarifas oficiales de luz CFE, margen y catálogos
          </p>
        </div>

        {successMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      <TeamManagement />

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. INFORMACIÓN DEL NEGOCIO */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Building className="w-5 h-5 text-brand-400" />
            <h2 className="text-sm font-bold text-white">Identidad del Negocio</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Comercial de la Aplicación</label>
              <input
                type="text"
                required
                disabled={currentUserRole !== 'owner'}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="3D Business Manager"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-bold disabled:opacity-50"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Este nombre reemplaza el provisional en la barra lateral, catálogos PDF y cotizaciones.
              </span>
            </div>

            <div className="sm:col-span-2 border-t border-slate-800 pt-4 mt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-3">Logo de la Empresa</label>
              <div className="flex items-center gap-6">
                {companyLogo ? (
                  <div className="relative group">
                    <img src={companyLogo} alt="Logo" className="w-20 h-20 rounded-2xl object-cover bg-white shadow-lg border border-slate-700" />
                    {currentUserRole === 'owner' && (
                      <button
                        type="button"
                        onClick={() => setCompanyLogo(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                        title="Eliminar logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                    <Building className="w-6 h-6 mb-1 opacity-50" />
                    <span className="text-[9px] uppercase tracking-wider font-bold">Sin logo</span>
                  </div>
                )}

                {currentUserRole === 'owner' && (
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleLogoChange}
                      className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-500/10 file:text-brand-400 hover:file:bg-brand-500/20 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500 mt-2">
                      Sube un archivo PNG, JPG o WEBP. La imagen será redimensionada y optimizada automáticamente.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono Principal</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp para Clientes</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Dirección / Taller</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Colonia / Fraccionamiento</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="El Trébol"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Municipio y Estado</label>
              <input
                type="text"
                value={`${city}, ${state}, ${country}`}
                onChange={(e) => {
                  const parts = e.target.value.split(',');
                  if (parts[0]) setCity(parts[0].trim());
                  if (parts[1]) setState(parts[1].trim());
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* 2. ELECTRICIDAD CFE & UBICACIÓN TARÍMBARO */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Tarifa Eléctrica CFE (Tarímbaro, Michoacán)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Precio por kWh ($/kWh)</label>
              <input
                type="number"
                step="0.01"
                required
                value={defaultElectricityRate}
                onChange={(e) => setDefaultElectricityRate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Tarifa CFE Doméstica Ordinaria 1B para la región.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Tarifa</label>
              <input
                type="text"
                value={electricityTariffType}
                onChange={(e) => setElectricityTariffType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fuente Oficial / Región</label>
              <input
                type="text"
                value={electricityRateSource}
                onChange={(e) => setElectricityRateSource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* 3. PARÁMETROS DE COSTEO Y CATÁLOGO */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <DollarSign className="w-5 h-5 text-brand-400" />
            <h2 className="text-sm font-bold text-white">Costeo Predeterminado & Catálogos</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mano de Obra por Hora ($)</label>
              <input
                type="number"
                value={defaultLaborRatePerHour}
                onChange={(e) => setDefaultLaborRatePerHour(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Merma Predeterminada (%)</label>
              <input
                type="number"
                value={defaultFailureRatePercent}
                onChange={(e) => setDefaultFailureRatePercent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Margen Sugerido (%)</label>
              <input
                type="number"
                value={defaultMarginPercent}
                onChange={(e) => setDefaultMarginPercent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Encabezado de Catálogo</label>
              <textarea
                rows={2}
                value={catalogHeaderNotes}
                onChange={(e) => setCatalogHeaderNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Pie de Página de Catálogo</label>
              <textarea
                rows={2}
                value={catalogFooterNotes}
                onChange={(e) => setCatalogFooterNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleDeleteDemoData}
            className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-400 hover:bg-rose-900/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Eliminar Datos Demo
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
          >
            <Save className="w-4 h-4" /> Guardar Configuración
          </button>
        </div>
      </form>
    </div>
  );
}
