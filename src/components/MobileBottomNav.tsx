'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calculator,
  Box,
  ShoppingBag,
  BookOpen,
  Menu,
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenSidebar: () => void;
}

export default function MobileBottomNav({ onOpenSidebar }: MobileBottomNavProps) {
  const pathname = usePathname();

  const items = [
    { href: '/', label: 'Inicio', icon: LayoutDashboard },
    { href: '/pricing', label: 'Fijador', icon: Calculator },
    { href: '/products', label: 'Productos', icon: Box },
    { href: '/sales', label: 'Ventas', icon: ShoppingBag },
    { href: '/catalog', label: 'Catálogo', icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 lg:hidden flex items-center justify-around">
      {items.map((it) => {
        const isActive = pathname === it.href;
        const Icon = it.icon;

        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              isActive
                ? 'text-brand-400 font-semibold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">{it.label}</span>
          </Link>
        );
      })}

      {/* Button to open full sidebar on mobile */}
      <button
        onClick={onOpenSidebar}
        className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] tracking-tight">Más</span>
      </button>
    </nav>
  );
}
