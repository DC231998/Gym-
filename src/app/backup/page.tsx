'use client';

import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

export default function BackupPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupPreview, setBackupPreview] = useState<any | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Export JSON Backup
  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) throw new Error('Error al generar respaldo');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `3D_Business_Manager_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: '¡Respaldo descargado exitosamente!' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.backupVersion || !json.data) {
          throw new Error('Estructura inválida. Debe contener backupVersion y objeto data.');
        }
        setBackupPreview(json);
      } catch (err: any) {
        setMessage({
          type: 'error',
          text: `El archivo seleccionado no es un JSON de respaldo válido: ${err.message}`,
        });
        setBackupPreview(null);
      }
    };
    reader.readAsText(file);
  };

  // Import JSON Backup
  const handleImport = async () => {
    if (!backupPreview) return;

    if (
      importMode === 'replace' &&
      !confirm(
        '¡ADVERTENCIA CRÍTICA!\n\nHas seleccionado el modo "Reemplazar Todo". Toda la información existente en la base de datos será borrada y reemplazada por el archivo de respaldo.\n\n¿Deseas continuar?'
      )
    ) {
      return;
    }

    setIsImporting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: importMode, backup: backupPreview }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setMessage({ type: 'success', text: result.message || 'Respaldo restaurado con éxito.' });
      setBackupPreview(null);
      setSelectedFile(null);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6 text-brand-400" />
          Respaldos & Migración de Base de Datos
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Exporta e importa toda la información en formato JSON estándar versionado (backupVersion 1.0.0)
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EXPORT PANEL */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Exportar Respaldo Completo</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Descarga un archivo JSON estructurado que incluye: productos, filamentos, clientes, ventas, pagos,
                gastos, cotizaciones, inventario y configuración de la impresora Bambu Lab P1S Combo.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Versión del Esquema:</span>
                <span className="font-mono text-white">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Formato de Almacenamiento:</span>
                <span className="font-mono text-brand-400">JSON Portable UTF-8</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Generando archivo...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Descargar Archivo JSON de Respaldo
              </>
            )}
          </button>
        </div>

        {/* IMPORT PANEL */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Importar y Restaurar Respaldo</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Restaura la información desde un archivo de respaldo previo. Puedes elegir fusionar con los datos actuales
                o reemplazar toda la base de datos limpiamente.
              </p>
            </div>

            {/* File Upload Selector */}
            <div className="border border-dashed border-slate-700 rounded-2xl p-4 text-center space-y-2 bg-slate-950/40">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="backup-file-input"
              />
              <label
                htmlFor="backup-file-input"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <FileCheck className="w-4 h-4 text-brand-400" />
                {selectedFile ? selectedFile.name : 'Seleccionar Archivo .JSON'}
              </label>
              {selectedFile && (
                <div className="text-[11px] text-slate-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB seleccionado
                </div>
              )}
            </div>

            {/* Mode Selector */}
            {backupPreview && (
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 block">Modo de Importación:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('merge')}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-left ${
                      importMode === 'merge'
                        ? 'border-brand-500 bg-brand-950/40 text-brand-400'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div>Fusionar Datos</div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                      Actualiza e inserta sin borrar registros existentes
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-left ${
                      importMode === 'replace'
                        ? 'border-rose-500 bg-rose-950/40 text-rose-400'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Reemplazar Todo
                    </div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                      Limpia la base y restaura exactamente el respaldo
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={isImporting || !backupPreview}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${
              importMode === 'replace'
                ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-lg shadow-rose-500/20'
                : 'bg-brand-500 hover:bg-brand-400 text-slate-950 shadow-lg shadow-brand-500/20'
            }`}
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Restaurando datos...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Confirmar e Importar Respaldo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
