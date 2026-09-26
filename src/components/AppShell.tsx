'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [businessName, setBusinessName] = useState('3D Business Manager');
  const [whatsapp, setWhatsapp] = useState('4431234567');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.businessName) {
          setBusinessName(data.businessName);
          if (data.whatsapp) setWhatsapp(data.whatsapp);
        }
      })
      .catch((err) => console.error('Error fetching settings in AppShell:', err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-brand-500/30 selection:text-brand-200">
      <Sidebar
        businessName={businessName}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area with Desktop Sidebar margin */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header
          businessName={businessName}
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
