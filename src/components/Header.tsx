'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Menu,
  MessageCircle,
  AlertTriangle,
  ArrowRight,
  X,
  Box,
  Users,
  ShoppingBag,
  Disc,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  businessName?: string;
  whatsappNumber?: string;
}

export default function Header({
  onToggleSidebar,
  businessName = '3D Business Manager',
  whatsappNumber = '4431234567',
}: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  // Load quick alerts on mount
  useEffect(() => {
    async function loadAlerts() {
      try {
        const [invRes, salesRes] = await Promise.all([
          fetch('/api/inventory').then((r) => r.json()),
          fetch('/api/sales?status=Pendiente').then((r) => r.json()),
        ]);

        const newAlerts: any[] = [];

        if (Array.isArray(invRes.lowStockFilaments)) {
          invRes.lowStockFilaments.forEach((f: any) => {
            newAlerts.push({
              id: `fil-${f.id}`,
              type: 'filament',
              title: `Stock bajo de filamento: ${f.colorName} (${f.materialType})`,
              subtitle: `Quedan ${Math.round(f.availableGrams)}g (Mínimo: ${f.minStockGrams}g)`,
              href: '/filaments',
              severity: 'warning',
            });
          });
        }

        if (Array.isArray(invRes.lowStockProducts)) {
          invRes.lowStockProducts.forEach((p: any) => {
            newAlerts.push({
              id: `prod-${p.id}`,
              type: 'product',
              title: `Poco stock de producto: ${p.name}`,
              subtitle: `Quedan ${p.stock} piezas`,
              href: '/products',
              severity: 'info',
            });
          });
        }

        if (Array.isArray(salesRes)) {
          const pendingBalanceSales = salesRes.filter((s: any) => s.pendingAmount > 0);
          if (pendingBalanceSales.length > 0) {
            newAlerts.push({
              id: 'sales-pending',
              type: 'sales',
              title: `${pendingBalanceSales.length} ventas con saldo pendiente de pago`,
              subtitle: 'Revisa y registra los pagos parciales recibidos',
              href: '/sales',
              severity: 'warning',
            });
          }
        }

        setAlerts(newAlerts);
      } catch (err) {
        console.error('Error fetching header alerts:', err);
      }
    }

    loadAlerts();
  }, []);

  // Handle global search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [prodRes, custRes, saleRes] = await Promise.all([
          fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`).then((r) => r.json()),
          fetch('/api/customers').then((r) => r.json()),
          fetch('/api/sales').then((r) => r.json()),
        ]);

        const filteredCusts = Array.isArray(custRes)
          ? custRes.filter(
              (c: any) =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.phone && c.phone.includes(searchQuery))
            )
          : [];

        const filteredSales = Array.isArray(saleRes)
          ? saleRes.filter(
              (s: any) =>
                s.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.customerName && s.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
            )
          : [];

        const combined: any[] = [];

        if (Array.isArray(prodRes)) {
          prodRes.slice(0, 3).forEach((p: any) => {
            combined.push({
              type: 'product',
              title: p.name,
              subtitle: `SKU: ${p.sku} • Stock: ${p.stock} pzas`,
              href: '/products',
            });
          });
        }

        filteredCusts.slice(0, 3).forEach((c: any) => {
          combined.push({
            type: 'customer',
            title: c.name,
            subtitle: `Tel: ${c.phone || 'S/N'} • ${c.city}`,
            href: '/customers',
          });
        });

        filteredSales.slice(0, 3).forEach((s: any) => {
          combined.push({
            type: 'sale',
            title: `${s.saleNumber} - ${s.customerName}`,
            subtitle: `Total: $${s.total} • Estado: ${s.status}`,
            href: '/sales',
          });
        });

        setSearchResults(combined);
        setShowSearchResults(true);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (alertRef.current && !alertRef.current.contains(event.target as Node)) {
        setShowAlerts(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between gap-4">
      {/* Mobile Menu Button + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="lg:hidden text-xs font-bold text-slate-200 truncate max-w-[120px]">
          {businessName}
        </span>
      </div>

      {/* Global Search Bar */}
      <div ref={searchRef} className="flex-1 max-w-lg relative">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
            placeholder="Buscar productos, clientes, ventas, filamentos..."
            className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/60 animate-in fade-in slide-in-from-top-1 duration-150">
            {isSearching ? (
              <div className="p-3 text-center text-xs text-slate-400">Buscando en catálogo y base de datos...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setShowSearchResults(false)}
                  className="flex items-center gap-3 p-3 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-brand-400 flex-shrink-0">
                    {item.type === 'product' && <Box className="w-4 h-4" />}
                    {item.type === 'customer' && <Users className="w-4 h-4" />}
                    {item.type === 'sale' && <ShoppingBag className="w-4 h-4" />}
                    {item.type === 'filament' && <Disc className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{item.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </Link>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                No se encontraron resultados para &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions: WhatsApp & Notifications */}
      <div className="flex items-center gap-2">
        {/* Quick WhatsApp Action */}
        <a
          href={`https://wa.me/52${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
            'Hola, me comunico desde el sistema 3D Business Manager.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40 text-xs font-semibold transition-colors"
          title="Abrir WhatsApp del negocio"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </a>

        {/* Alerts Bell */}
        <div ref={alertRef} className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 relative transition-colors"
            aria-label="Alertas del sistema"
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Alerts Dropdown */}
          {showAlerts && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Alertas Operativas ({alerts.length})</span>
                </div>
                <button
                  onClick={() => setShowAlerts(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-1">
                {alerts.length > 0 ? (
                  alerts.map((al) => (
                    <Link
                      key={al.id}
                      href={al.href}
                      onClick={() => setShowAlerts(false)}
                      className="flex items-start gap-2.5 p-2.5 hover:bg-slate-800/60 rounded-xl transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-200">{al.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{al.subtitle}</div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No hay alertas pendientes. Todo el inventario y producción están en orden.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
