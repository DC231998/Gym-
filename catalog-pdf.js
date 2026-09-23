import { data } from "./app.js";

const THEMES={
 "Todo el año":{key:"neutral",emoji:"✦",title:"Todo el año",accent:"#173b5e",bg:"#f2f6f9",intro:"Productos que siempre son una buena idea.",footer:"Diseños para todos los días."},
 "Navidad":{key:"christmas",emoji:"🎄",title:"Navidad",accent:"#9f1d2d",bg:"#fff4f1",intro:"Decora, regala y comparte la magia.",footer:"Haz que esta Navidad sea especial."},
 "Halloween":{key:"halloween",emoji:"🎃",title:"Halloween",accent:"#54266d",bg:"#f5eef8",intro:"Detalles que dan vida a la noche.",footer:"Prepárate para una noche increíble."},
 "Primavera":{key:"spring",emoji:"🌸",title:"Primavera",accent:"#2d7d4f",bg:"#f2fbf4",intro:"Colores, vida y nuevos comienzos.",footer:"La primavera también se imprime en 3D."},
 "Verano":{key:"summer",emoji:"☀️",title:"Verano",accent:"#0088b8",bg:"#eefaff",intro:"Lleva la diversión a otro nivel.",footer:"Disfruta el verano en cada detalle."},
 "Otoño":{key:"autumn",emoji:"🍂",title:"Otoño",accent:"#a14b16",bg:"#fff6ed",intro:"Colores cálidos para grandes momentos.",footer:"La calidez del otoño también se imprime."},
 "San Valentín":{key:"valentine",emoji:"💗",title:"San Valentín",accent:"#b4235a",bg:"#fff0f5",intro:"Detalles para compartir.",footer:"Un detalle hecho especialmente para alguien especial."},
 "Día de Muertos":{key:"dead",emoji:"💀",title:"Día de Muertos",accent:"#6a2b72",bg:"#f6eff8",intro:"Tradición, color y diseño.",footer:"Tradición y creatividad en cada pieza."},
 "Día de la Madre":{key:"spring",emoji:"🌷",title:"Día de la Madre",accent:"#b23d72",bg:"#fff1f7",intro:"Un detalle hecho especialmente para ella.",footer:"Regala un detalle que se queda."},
 "Día del Padre":{key:"summer",emoji:"🎁",title:"Día del Padre",accent:"#254f73",bg:"#eef5fa",intro:"Regalos útiles, originales y personalizados.",footer:"Diseñado para sorprender."},
 "Regreso a clases":{key:"neutral",emoji:"📚",title:"Regreso a clases",accent:"#315f87",bg:"#f1f6fb",intro:"Organiza, crea y vuelve a clases.",footer:"Funcionalidad que también se ve bien."},
 "Personalizados":{key:"custom",emoji:"✨",title:"Personalizados",accent:"#31577d",bg:"#f4f7fa",intro:"Tú lo imaginas, nosotros lo imprimimos.",footer:"Diseños hechos para ti."}
};

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
let initialized=false;

function theme(s){return THEMES[s]||THEMES["Todo el año"];}
function products(){
  const filter=$("catalogSeasonFilter")?.value||"all";
  let p=(data.products||[]).filter(x=>x.name);
  return filter==="all"?p:p.filter(x=>(x.season||"Todo el año")===filter);
}
function image(p){
  if(p.imageUrl) return `<img src="${esc(p.imageUrl)}" crossorigin="anonymous" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" alt="${esc(p.name)}"><div class="fallback">${theme(p.season).emoji}</div>`;
  return `<div class="fallback">${theme(p.season).emoji}</div>`;
}
function card(p){
  const showPrice=$("showPrices")?.checked??true, showCat=$("showCategory")?.checked??true, showColors=$("showColors")?.checked??true, showDesc=$("showDescription")?.checked??true;
  return `<article class="pdf-product-card"><div class="pdf-product-image">${image(p)}</div><div class="pdf-product-info">
    <h4>${esc(p.name)}</h4>
    ${showCat&&p.category?`<div class="pdf-product-cat">${esc(p.category)}</div>`:""}
    ${showDesc&&p.description?`<p>${esc(p.description)}</p>`:""}
    ${showColors&&p.colors?`<div class="pdf-colors"><b>Colores:</b> ${esc(p.colors)}</div>`:""}
    ${showPrice?`<div class="pdf-price">$${Number(p.salePrice||0).toFixed(2)}</div>`:""}
  </div></article>`;
}
function groups(ps){
  const order=["Todo el año","Navidad","Halloween","Primavera","Verano","Otoño","San Valentín","Día de Muertos","Día de la Madre","Día del Padre","Regreso a clases","Personalizados"];
  const m=new Map();
  ps.forEach(p=>{const s=p.season||"Todo el año";if(!m.has(s))m.set(s,[]);m.get(s).push(p)});
  return [...m.entries()].sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0]));
}
function cover(){
  return `<div class="pdf-page pdf-cover"><div class="cover-stripe"></div><div class="cover-logo">◈</div><div class="cover-brand">${esc(data.settings?.businessName||"Mi Negocio 3D")}</div><h1>${esc($("catalogTitle")?.value||"Catálogo de productos")}</h1><p>${esc($("catalogSubtitle")?.value||"Impresión 3D • Personalizados • Para cada ocasión")}</p><div class="cover-pills"><span>Impresión 3D</span><span>Personalizados</span><span>Para cada ocasión</span></div><div class="cover-wave"></div><small>Catálogo para clientes</small></div>`;
}
function seasonPages(s,ps,perPage){
  const t=theme(s), pages=[];
  for(let i=0;i<ps.length;i+=perPage){
    const b=ps.slice(i,i+perPage);
    pages.push(`<div class="pdf-page seasonal-page" style="--accent:${t.accent};--pagebg:${t.bg}">
      <header class="pdf-season-header"><b>${esc(data.settings?.businessName||"Mi Negocio 3D")}</b><strong>${t.emoji} ${esc(t.title)}</strong></header>
      <div class="pdf-season-intro">${esc(t.intro)}</div>
      <div class="pdf-product-grid">${b.map(card).join("")}</div>
      <footer class="pdf-season-footer"><span>${esc(t.footer)}</span><span>${i+1}-${Math.min(i+perPage,ps.length)} / ${ps.length}</span></footer>
    </div>`);
  }
  return pages.join("");
}
function render(){
  const host=$("pdfCatalogApp"); if(!host)return;
  const ps=products(), per=Number($("catalogProductsPerPage")?.value||6);
  $("catalogPreviewCount").textContent=`${ps.length} producto${ps.length===1?"":"s"}`;
  if(!ps.length){$("catalogPreview").innerHTML=`<div class="empty-state">No hay productos. Ve a <b>Catálogo</b>, crea productos y asígnales una temporada.</div>`;return;}
  $("catalogPreview").innerHTML=cover()+groups(ps).map(([s,p])=>seasonPages(s,p,per)).join("");
}
function mount(){
  if(initialized && $("pdfCatalogApp")) {render();return;}
  const host=$("pdfCatalogApp");if(!host)return;
  initialized=true;
  host.innerHTML=`<div class="catalog-builder-grid">
    <div class="card"><h3>Configuración del catálogo</h3><div class="formgrid">
      <div class="field"><label>Nombre del catálogo</label><input id="catalogTitle" value="Catálogo de productos"></div>
      <div class="field"><label>Subtítulo</label><input id="catalogSubtitle" value="Impresión 3D • Personalizados • Para cada ocasión"></div>
      <div class="field"><label>Temporadas</label><select id="catalogSeasonFilter"><option value="all">Todas las temporadas</option>${Object.keys(THEMES).map(s=>`<option>${esc(s)}</option>`).join("")}</select></div>
      <div class="field"><label>Productos por página</label><select id="catalogProductsPerPage"><option>6</option><option>4</option><option>8</option></select></div>
    </div><div class="catalog-checks">
      <label><input id="showPrices" type="checkbox" checked> Precios</label>
      <label><input id="showCategory" type="checkbox" checked> Categorías</label>
      <label><input id="showColors" type="checkbox" checked> Colores</label>
      <label><input id="showDescription" type="checkbox" checked> Descripción</label>
    </div>
    <div class="catalog-tip"><b>Automático:</b> puedes mezclar productos de cualquier temporada. El PDF los agrupa y cada página usa el diseño correspondiente.</div></div>
    <div class="card"><h3>Temas incluidos</h3><div class="season-theme-list">${Object.entries(THEMES).map(([s,t])=>`<span class="season-chip theme-${t.key}">${t.emoji} ${esc(s)}</span>`).join("")}</div></div>
  </div>
  <div class="card"><div class="preview-toolbar"><h3>Vista previa</h3><div><span id="catalogPreviewCount">0 productos</span> <button id="refreshCatalogPreview" class="secondary">Actualizar</button> <button id="generatePdfCatalog" class="primary">📄 Generar PDF</button></div></div><div id="catalogPreview" class="catalog-preview"></div></div>`;
  ["catalogTitle","catalogSubtitle","catalogSeasonFilter","catalogProductsPerPage","showPrices","showCategory","showColors","showDescription"].forEach(id=>{const e=$(id);e.addEventListener("input",render);e.addEventListener("change",render)});
  $("refreshCatalogPreview").onclick=render;
  $("generatePdfCatalog").onclick=generatePDF;
  render();
}
async function generatePDF(){
  const {jsPDF}=window.jspdf||{};
  if(!jsPDF||!window.html2canvas){alert("No se pudo cargar el generador PDF. Revisa tu conexión a internet.");return;}
  render();
  const pages=[...document.querySelectorAll("#catalogPreview .pdf-page")];
  if(!pages.length)return;
  const btn=$("generatePdfCatalog");btn.disabled=true;btn.textContent="Generando PDF...";
  try{
    const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
    for(let i=0;i<pages.length;i++){
      const canvas=await html2canvas(pages[i],{scale:2,useCORS:true,backgroundColor:"#fff",logging:false});
      if(i)pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg",.88),"JPEG",0,0,210,297,undefined,"FAST");
    }
    const name=(data.settings?.businessName||"mi-negocio-3d").replace(/[^a-z0-9áéíóúñ]+/gi,"-").replace(/^-|-$/g,"").toLowerCase();
    pdf.save(`${name||"mi-negocio-3d"}-catalogo.pdf`);
  }finally{btn.disabled=false;btn.textContent="📄 Generar PDF";}
}
window.addEventListener("catalog-view-ready",mount);
window.addEventListener("negocio3d:data-changed",()=>{if($("pdfCatalogApp"))render()});
if(document.readyState!=="loading" && $("pdfCatalogApp"))mount();
