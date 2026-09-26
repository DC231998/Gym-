'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calculator,
  Box,
  BookOpen,
  Layers,
  Disc,
  Users,
  ShoppingBag,
  FileText,
  DollarSign,
  ShoppingCart,
  Boxes,
  Printer,
  BarChart3,
  Settings,
  Database,
  Cpu,
} from 'lucide-react';

interface SidebarProps {
  businessName?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pricing', label: 'Fijador de Precios', icon: Calculator, highlight: true },
  { href: '/products', label: 'Productos', icon: Box },
  { href: '/catalog', label: 'Catálogo PDF', icon: BookOpen },
  { href: '/packages', label: 'Paquetes / Combos', icon: Layers },
  { href: '/filaments', label: 'Filamentos', icon: Disc },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/sales', label: 'Ventas y Pagos', icon: ShoppingBag },
  { href: '/quotes', label: 'Cotizaciones', icon: FileText },
  { href: '/expenses', label: 'Gastos y Ganancias', icon: DollarSign },
  { href: '/inventory', label: 'Inventario', icon: Boxes },
  { href: '/purchases', label: 'Próximas Compras', icon: ShoppingCart },
  { href: '/printers', label: 'Bambu Lab P1S', icon: Printer },
  { href: '/seasons-categories', label: 'Temporadas y Cat.', icon: Layers },
  { href: '/settings', label: 'Configuración', icon: Settings },
  { href: '/backup', label: 'Respaldos JSON', icon: Database },
];

export default function Sidebar({ businessName = '3D Business Manager', isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight truncate max-w-[150px]">
                {businessName}
              </h1>
              <span className="text-[10px] font-medium text-brand-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                Sistema 3D Pro
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links List */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm'
                    : item.highlight
                    ? 'text-brand-300 hover:bg-slate-900 border border-brand-500/20 bg-brand-950/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="ml-auto text-[9px] bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded font-mono">
                    PRO
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Hardware Status Footer: Bambu Lab P1S Combo */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
          <Link
            href="/printers"
            className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-slate-200 truncate">Bambu Lab P1S Combo</div>
              <div className="text-[10px] text-slate-400 truncate">CFE Tarímbaro • $2.15/kWh</div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
