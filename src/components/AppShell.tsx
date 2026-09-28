'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [businessName, setBusinessName] = useState('3D Business Manager');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState('4431234567');

  useEffect(() => {
    const fetchSettings = () => {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.businessName) {
            setBusinessName(data.businessName);
            setCompanyLogo(data.companyLogo || null); // handle null explicitly
            if (data.whatsapp) setWhatsapp(data.whatsapp);
          }
        })
        .catch((err) => console.error('Error fetching settings in AppShell:', err));
    };

    fetchSettings();

    window.addEventListener('settingsUpdated', fetchSettings);
    return () => window.removeEventListener('settingsUpdated', fetchSettings);
  }, []);

  const isAuthRoute = ['/login', '/forgot-password', '/reset-password'].includes(pathname);
  if (isAuthRoute) {
    return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-brand-500/30 selection:text-brand-200">
      <Sidebar
        businessName={businessName}
        companyLogo={companyLogo}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area with Desktop Sidebar margin */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header
          businessName={businessName}
          companyLogo={companyLogo}
          whatsappNumber={whatsapp}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          {children}
        </main>

        <MobileBottomNav onOpenSidebar={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
}
