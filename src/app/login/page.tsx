'use client';

import React, { useState } from 'react';
import { Cpu, Eye, EyeOff, LogIn, UserPlus, AlertCircle } from 'lucide-react';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyMode, setCompanyMode] = useState<'create' | 'join'>('create');
  const [companyName, setCompanyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const body: Record<string, string> = { action: mode, email, password };
      if (mode === 'register') {
        body.name = name;
        body.companyMode = companyMode;
        if (companyMode === 'create') body.companyName = companyName;
        if (companyMode === 'join') body.inviteCode = inviteCode;
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Error al autenticar');
        setLoading(false);
        return;
      }

      // Full page navigation so the browser sends the session cookie on the
      // next HTTP request — avoids the race condition where router.push()
      // navigates client-side before the Edge middleware sees the new cookie.
      window.location.href = '/';
    } catch (err: any) {
      setError('Error de conexión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-2xl shadow-brand-500/30 mb-4">
            <Cpu className="w-8 h-8 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">3D Business Manager</h1>
          <p className="text-sm text-slate-400 mt-1">Sistema de gestión para impresión 3D</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Mode toggle */}
          <div className="flex rounded-xl bg-slate-950 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'login'
                  ? 'bg-brand-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 inline mr-1.5" />
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'register'
                  ? 'bg-brand-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 inline mr-1.5" />
              Crear Cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (register only) */}
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ¿Qué deseas hacer?
                  </label>
                  <div className="flex gap-2 mb-3">
                    <label className={`flex-1 border rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors ${companyMode === 'create' ? 'bg-brand-950/30 border-brand-500 text-brand-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                      <input type="radio" className="sr-only" checked={companyMode === 'create'} onChange={() => setCompanyMode('create')} />
                      <span className="text-xs font-bold text-center">Crear Empresa</span>
                    </label>
                    <label className={`flex-1 border rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors ${companyMode === 'join' ? 'bg-brand-950/30 border-brand-500 text-brand-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                      <input type="radio" className="sr-only" checked={companyMode === 'join'} onChange={() => setCompanyMode('join')} />
                      <span className="text-xs font-bold text-center">Unirme con Código</span>
                    </label>
                  </div>

                  {companyMode === 'create' ? (
                    <div>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Nombre de tu empresa (ej. 3D Print Mx)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        required
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Código de invitación (ej. clm...)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña {mode === 'register' && <span className="text-slate-500">(mín. 8 caracteres)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm shadow-lg shadow-brand-500/20 transition-all mt-2"
            >
              {loading
                ? 'Procesando...'
                : mode === 'login'
                ? 'Iniciar Sesión'
                : 'Crear Cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Acceso protegido · Solo usuarios autorizados
        </p>
      </div>
    </div>
  );
}
