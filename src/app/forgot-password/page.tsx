'use client';

import React, { useState } from 'react';
import { Mail, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al solicitar el enlace');

      setSuccess(true);
      setMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          Recuperar Contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-800">
          
          {error && (
            <div className="mb-6 bg-red-900/30 border border-red-500/50 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 mb-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Revisa tu bandeja de entrada</h3>
              <p className="text-sm text-slate-400">{message}</p>
              <div className="mt-6 pt-4">
                <Link href="/login" className="text-sm font-medium text-brand-400 hover:text-brand-300">
                  Volver al Login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={loading}
                    className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-700 rounded-xl bg-slate-950 shadow-sm placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all"
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white flex items-center justify-center gap-1">
                <ArrowRight className="w-4 h-4" /> Volver al Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
