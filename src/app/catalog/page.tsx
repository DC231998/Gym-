'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Download,
  Share2,
  Sparkles,
  Filter,
  CheckSquare,
  Square,
  Printer,
  Eye,
  MessageCircle,
  Layers,
  Box,
  Tag,
  Phone,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency } from '@/lib/calculations';

export default function CatalogGeneratorPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Configuration State
  const [selectedSeasonIds, setSelectedSeasonIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState<number>(4); // 1, 2, 4, 6, 8
  const [includeCover, setIncludeCover] = useState<boolean>(true);
  const [includeDividers, setIncludeDividers] = useState<boolean>(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');

  const catalogPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [prodRes, seaRes, catRes, setRes] = await Promise.all([
          fetch('/api/products').then((r) => r.json()),
          fetch('/api/seasons').then((r) => r.json()),
          fetch('/api/categories').then((r) => r.json()),
          fetch('/api/settings').then((r) => r.json()),
        ]);

        if (Array.isArray(prodRes)) {
          setProducts(prodRes);
          setSelectedProductIds(prodRes.map((p) => p.id));
        }
        if (Array.isArray(seaRes)) {
          setSeasons(seaRes);
          setSelectedSeasonIds(seaRes.map((s) => s.id));
        }
        if (Array.isArray(catRes)) setCategories(catRes);
        if (setRes) setSettings(setRes);
      } catch (e) {
        console.error('Error loading catalog data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleSelectAllProducts = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map((p) => p.id));
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleSeason = (id: string) => {
    setSelectedSeasonIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Group selected products by Season, then Category
  const activeProducts = products.filter(
    (p) => selectedProductIds.includes(p.id) && selectedSeasonIds.includes(p.seasonId)
  );

  const activeSeasons = seasons.filter((s) => selectedSeasonIds.includes(s.id));

  // Structure: Season -> Category -> Products[]
  const groupedData = activeSeasons
    .map((season) => {
      const seasonProducts = activeProducts.filter((p) => p.seasonId === season.id);
      const categoryMap = new Map<string, { category: any; products: any[] }>();

      seasonProducts.forEach((prod) => {
        const catId = prod.categoryId;
        if (!categoryMap.has(catId)) {
          categoryMap.set(catId, { category: prod.category, products: [] });
        }
        categoryMap.get(catId)!.products.push(prod);
      });

      return {
        season,
        categories: Array.from(categoryMap.values()),
        totalProducts: seasonProducts.length,
      };
    })
    .filter((group) => group.totalProducts > 0);

  // Generate and Download PDF using jsPDF + html2canvas
  const handleGeneratePdf = async () => {
    if (!catalogPrintRef.current) return;
    setIsGeneratingPdf(true);
    setGenerationProgress('Preparando páginas y renderizando imágenes de alta fidelidad...');

    try {
      const container = catalogPrintRef.current;
      const pages = container.querySelectorAll<HTMLElement>('.pdf-page');

      if (pages.length === 0) {
        alert('No hay productos seleccionados para generar el catálogo.');
        setIsGeneratingPdf(false);
        return;
      }

      // Create PDF in A4 Portrait mode (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      for (let i = 0; i < pages.length; i++) {
        setGenerationProgress(`Procesando página ${i + 1} de ${pages.length}...`);
        const pageEl = pages[i];

        const canvas = await html2canvas(pageEl, {
          scale: 2, // 2x resolution for crisp commercial print
          useCORS: true,
          logging: false,
          backgroundColor: '#090d16',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      setGenerationProgress('Finalizando archivo PDF...');
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Catalogo_${settings?.businessName?.replace(/\s+/g, '_') || '3D_Manager'}_${dateStr}.pdf`;
      pdf.save(filename);
      setGenerationProgress('');
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Ocurrió un error al compilar el PDF. Revisa las imágenes e intenta de nuevo.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // WhatsApp share link
  const whatsappCatalogMessage = encodeURIComponent(
    `¡Hola! Te comparto nuestro Catálogo Oficial de Impresiones 3D de ${
      settings?.businessName || '3D Business Manager'
    }.\n\nContamos con modelos personalizados, figuras, macetas y artículos de temporada.\n¿Qué producto te gustaría cotizar?`
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-400" />
            Generador de Catálogos PDF Comerciales
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Portadas profesionales, temas de temporada, agrupaciones automáticas y exportación de alta calidad
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/52${settings?.whatsapp?.replace(/\D/g, '') || ''}?text=${whatsappCatalogMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Compartir por WhatsApp
          </a>

          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf || activeProducts.length === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Compilando PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Descargar Catálogo PDF
              </>
            )}
          </button>
        </div>
      </div>

      {generationProgress && (
        <div className="p-3 rounded-xl bg-brand-950/50 border border-brand-500/40 text-brand-300 text-xs flex items-center gap-2 animate-pulse">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>{generationProgress}</span>
        </div>
      )}

      {/* Configuration & Filter Controls Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-400" /> Configuración de Plantilla & Contenido
          </span>
          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCover}
                onChange={(e) => setIncludeCover(e.target.checked)}
                className="rounded border-slate-700 text-brand-500"
              />
              Incluir Portada Comercial
            </label>
            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDividers}
                onChange={(e) => setIncludeDividers(e.target.checked)}
                className="rounded border-slate-700 text-brand-500"
              />
              Separadores Temáticos
            </label>
          </div>
        </div>

        {/* Template Layout Options */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { value: 1, label: '1 Producto Gigante' },
            { value: 2, label: '2 Productos' },
            { value: 4, label: '4 Productos (Cuadrícula 2x2)' },
            { value: 6, label: '6 Productos' },
            { value: 8, label: '8 Productos' },
          ].map((tpl) => (
            <button
              key={tpl.value}
              type="button"
              onClick={() => setItemsPerPage(tpl.value)}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center ${
                itemsPerPage === tpl.value
                  ? 'border-brand-500 bg-brand-950/40 text-brand-400 shadow-md ring-1 ring-brand-500/30'
                  : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tpl.label}
            </button>
          ))}
        </div>

        {/* Season Checkboxes */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-400">Temporadas a Incluir:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {seasons.map((sea) => {
              const isSelected = selectedSeasonIds.includes(sea.id);
              return (
                <button
                  key={sea.id}
                  onClick={() => toggleSeason(sea.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/15 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: sea.primaryColorHex }}
                  />
                  <span>{sea.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Quick Select Summary */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
          <span>
            {activeProducts.length} de {products.length} productos seleccionados para el catálogo
          </span>
          <button
            onClick={toggleSelectAllProducts}
            className="text-brand-400 hover:text-brand-300 font-semibold"
          >
            {selectedProductIds.length === products.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </button>
        </div>
      </div>

      {/* CATALOG PREVIEW CANVAS (A4 Format) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-brand-400" />
            Vista Previa en Vivo del Catálogo
          </h2>
          <span className="text-xs text-slate-400">
            Formato A4 optimizado para impresión y distribución digital
          </span>
        </div>

        {/* The hidden/rendered printable catalog pages */}
        <div
          ref={catalogPrintRef}
          className="space-y-8 flex flex-col items-center mx-auto"
        >
          {/* PAGE 1: COMMERCIAL COVER (PORTADA) */}
          {includeCover && (
            <div className="pdf-page w-[210mm] min-h-[297mm] h-[297mm] p-12 bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden border border-slate-800 shadow-2xl">
              {/* Background Geometric Accent */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Cover Header */}
              <div className="space-y-3 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold uppercase tracking-widest">
                  Catálogo Oficial • Impresión 3D Profesional
                </div>
                <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
                  {settings?.businessName || '3D Business Manager'}
                </h1>
                <p className="text-sm text-slate-400 max-w-lg">
                  {settings?.catalogHeaderNotes ||
                    'Diseño, modelado y manufactura aditiva con tecnología de alta resolución Bambu Lab.'}
                </p>
              </div>

              {/* Cover Center Hero Visual */}
              <div className="my-auto py-8 text-center space-y-4 z-10">
                <div className="w-48 h-48 mx-auto rounded-3xl bg-gradient-to-tr from-brand-600 via-brand-500 to-emerald-400 p-1 shadow-2xl shadow-brand-500/30 flex items-center justify-center">
                  <div className="w-full h-full rounded-[22px] bg-slate-950 flex flex-col items-center justify-center p-4">
                    <Box className="w-16 h-16 text-brand-400 mb-2 stroke-[1.5]" />
                    <span className="text-xs font-black uppercase text-white tracking-widest">
                      EDICIÓN {new Date().getFullYear()}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Colecciones Exclusivas</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 text-xs text-slate-300 font-semibold pt-2">
                  <span>• Llaveros</span>
                  <span>• Figuras</span>
                  <span>• Macetas</span>
                  <span>• Temporadas</span>
                  <span>• Personalizados</span>
                </div>
              </div>

              {/* Cover Footer / Contact Info */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs text-slate-400 z-10">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  <span className="truncate">{settings?.whatsapp || '443 123 4567'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  <span className="truncate">{settings?.city || 'Tarímbaro'}, {settings?.state || 'Michoacán'}</span>
                </div>
                <div className="text-right font-medium text-slate-400 truncate">
                  {settings?.email || 'ventas@3dbusiness.com'}
                </div>
              </div>
            </div>
          )}

          {/* SEASON SECTIONS & PRODUCT PAGES */}
          {groupedData.map((group) => {
            const season = group.season;
            // Chunk products into pages based on itemsPerPage
            const allSeasonProducts = group.categories.flatMap((cat) => cat.products);
            const productChunks: any[][] = [];
            for (let i = 0; i < allSeasonProducts.length; i += itemsPerPage) {
              productChunks.push(allSeasonProducts.slice(i, i + itemsPerPage));
            }

            return (
              <React.Fragment key={season.id}>
                {/* SEASON DIVIDER PAGE (SEPARADOR TEMÁTICO) */}
                {includeDividers && (
                  <div
                    className="pdf-page w-[210mm] min-h-[297mm] h-[297mm] p-12 text-white flex flex-col justify-between relative overflow-hidden border border-slate-800 shadow-2xl"
                    style={{
                      background: `linear-gradient(135deg, #090d16 0%, #0f172a 50%, #090d16 100%)`,
                    }}
                  >
                    {/* Themed Accent Glow */}
                    <div
                      className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
                      style={{ backgroundColor: season.primaryColorHex }}
                    />

                    {/* Season Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {settings?.businessName || '3D Business Manager'} • Catálogo
                      </span>
                      <span className="text-xs font-mono text-brand-400 font-bold">
                        Colección de Temporada
                      </span>
                    </div>

                    {/* Season Hero Content */}
                    <div className="my-auto space-y-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-block border"
                        style={{
                          backgroundColor: `${season.primaryColorHex}20`,
                          color: season.primaryColorHex,
                          borderColor: `${season.primaryColorHex}40`,
                        }}
                      >
                        Temporada Oficial
                      </span>
                      <h2 className="text-5xl font-black text-white tracking-tight">
                        {season.name}
                      </h2>
                      <p className="text-base text-slate-300 max-w-lg leading-relaxed">
                        {season.description ||
                          'Descubre nuestros modelos y diseños exclusivos listos para entrega o personalización.'}
                      </p>

                      <div className="pt-4 flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          {allSeasonProducts.length} productos en esta sección
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500">
                      <span>Pedidos y cotizaciones vía WhatsApp</span>
                      <span>Página de Separador</span>
                    </div>
                  </div>
                )}

                {/* PRODUCT PAGES */}
                {productChunks.map((chunk, pageIndex) => (
                  <div
                    key={`${season.id}-page-${pageIndex}`}
                    className="pdf-page w-[210mm] min-h-[297mm] h-[297mm] p-10 bg-slate-950 text-white flex flex-col justify-between border border-slate-800 shadow-2xl relative"
                  >
                    {/* Page Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: season.primaryColorHex }}
                        />
                        <span className="font-bold text-white uppercase">{season.name}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">Catálogo Comercial</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {settings?.whatsapp ? `WhatsApp: ${settings.whatsapp}` : ''}
                      </span>
                    </div>

                    {/* Products Dynamic Grid according to itemsPerPage */}
                    <div
                      className={`grid gap-5 my-auto ${
                        itemsPerPage === 1
                          ? 'grid-cols-1'
                          : itemsPerPage === 2
                          ? 'grid-cols-2'
                          : itemsPerPage === 4
                          ? 'grid-cols-2 grid-rows-2'
                          : itemsPerPage === 6
                          ? 'grid-cols-3 grid-rows-2'
                          : 'grid-cols-4 grid-rows-2'
                      }`}
                    >
                      {chunk.map((prod) => {
                        const primaryImg =
                          prod.images?.find((img: any) => img.isPrimary) || prod.images?.[0];

                        return (
                          <div
                            key={prod.id}
                            className="rounded-2xl bg-slate-900/90 border border-slate-800/90 overflow-hidden flex flex-col justify-between shadow-md p-3.5"
                          >
                            {/* Product Photo */}
                            <div className="aspect-square w-full rounded-xl bg-slate-950 overflow-hidden relative flex items-center justify-center mb-3">
                              {primaryImg?.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={primaryImg.url}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Box className="w-12 h-12 text-slate-700" />
                              )}

                              {/* Price Badge on Photo */}
                              <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-xl bg-slate-950/90 backdrop-blur-md text-brand-400 font-black text-sm border border-brand-500/40 shadow-lg font-mono">
                                {formatCurrency(prod.salePrice)}
                              </div>

                              {/* Category tag */}
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-[10px] font-semibold text-slate-300 border border-slate-700">
                                {prod.category?.name}
                              </div>
                            </div>

                            {/* Product Details */}
                            <div className="space-y-1">
                              <h3 className="text-xs font-bold text-white line-clamp-1 leading-snug">
                                {prod.name}
                              </h3>
                              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                {prod.description || 'Impresión en alta definición.'}
                              </p>
                            </div>

                            {/* Specs row */}
                            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                              <span className="font-mono">SKU: {prod.sku}</span>
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: prod.defaultColorHex }}
                                />
                                <span>{prod.defaultColorName}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Page Footer */}
                    <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>{settings?.catalogFooterNotes || 'Precios sujetos a cambio sin previo aviso.'}</span>
                      <span>
                        Pág. {pageIndex + 1} de {productChunks.length}
                      </span>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
