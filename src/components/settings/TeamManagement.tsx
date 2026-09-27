'use client';

import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, RefreshCw, Key, ShieldAlert } from 'lucide-react';

export default function TeamManagement() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/team');
      if (!res.ok) throw new Error('Error al cargar el equipo');
      const data = await res.json();
      setMembers(data.members || []);
      setInviteCode(data.inviteCode || '');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!confirm('¿Estás seguro? El código anterior dejará de funcionar inmediatamente y cualquier persona que lo intente usar no podrá entrar.')) {
      return;
    }
    
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/settings/team', { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al regenerar el código');
      setInviteCode(data.inviteCode);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-slate-400 animate-pulse">Cargando equipo...</div>;
  }

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <Users className="w-5 h-5 text-brand-400" />
        <h2 className="text-sm font-bold text-white">Equipo y Seguridad</h2>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Invite Code Card */}
      <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800/80">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5" />
          Código de Invitación
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Comparte este código con tus empleados para que puedan unirse a tu empresa directamente desde la pantalla de registro.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="font-mono text-sm text-brand-300 font-semibold tracking-wide select-all">
              {inviteCode}
            </span>
            <button 
              onClick={handleCopy}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              title="Copiar código"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerar
          </button>
        </div>
      </div>

      {/* Member List */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Miembros Actuales ({members.length})</h3>
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/50">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">{member.name}</span>
                <span className="text-xs text-slate-500">{member.email}</span>
              </div>
              <div>
                {member.companyRole === 'owner' ? (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase border border-amber-500/20">
                    Propietario
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase border border-slate-700">
                    Miembro
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
