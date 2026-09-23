import {
  firebaseReady, db, storage, collection, getDocs, setDoc, doc,
  deleteDoc, ref, uploadBytes, getDownloadURL
} from "./firebase.js";

const KEY="negocio3d_v4";
const seasons=["Todo el año","Navidad","Halloween","Primavera","Verano","Otoño","San Valentín","Día de Muertos","Día de la Madre","Día del Padre","Regreso a clases","Personalizados"];
const base={
  filaments:[], products:[], sales:[], orders:[], production:[], expenses:[],
  settings:{businessName:"Mi Negocio 3D",powerW:100,electricityKwh:0,targetMargin:40}
};
let data=JSON.parse(localStorage.getItem(KEY)||"null") || structuredClone(base);
data={...base,...data,settings:{...base.settings,...(data.settings||{})}};
let current="dashboard", editing=null, materials=[];

const $=s=>document.querySelector(s);
const n=x=>Number(x||0);
const money=x=>`$${n(x).toFixed(2)}`;
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const newid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);
const today=()=>new Date().toISOString().slice(0,10);
const fil=id=>data.filaments.find(x=>x.id===id);
const prod=id=>data.products.find(x=>x.id===id);
const gramCost=f=>n(f?.rollPrice)/Math.max(n(f?.rollGrams),1);
const electricity=h=>n(data.settings.powerW)/1000*n(h)*n(data.settings.electricityKwh);
const productCost=p=>n((p?.materials||[]).reduce((s,m)=>s+n(m.grams)*gramCost(fil(m.filamentId)),0))+electricity(p?.printHours);

function save(){localStorage.setItem(KEY,JSON.stringify(data)); window.dispatchEvent(new Event("negocio3d:data-changed"));}
async function sync(){
  if(!firebaseReady) return;
  for(const name of ["filaments","products","sales","orders","production","expenses"]){
    for(const x of data[name]) await setDoc(doc(db,name,x.id),x);
  }
  await setDoc(doc(db,"settings","main"),data.settings);
  $("#connection").textContent="● Firebase";
  $("#connection").style.color="#86efac";
}
async function loadCloud(){
  if(!firebaseReady) return;
  for(const name of ["filaments","products","sales","orders","production","expenses"]){
    const snap=await getDocs(collection(db,name));
    data[name]=snap.docs.map(x=>x.data());
  }
  const s=await getDocs(collection(db,"settings"));
  const main=s.docs.find(x=>x.id==="main");
  if(main) data.settings=main.data();
  save(); render();
}
function toast(msg){const t=$("#toast");t.textContent=msg;t.className="show";setTimeout(()=>t.className="",1900);}

function nav(v){
  current=v;
  document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===v));
  const titles={
    dashboard:["Dashboard","Resumen de tu negocio"],
    filaments:["Filamentos","Costos e inventario"],
    catalog:["Catálogo","Productos, materiales, fotos y temporadas"],
    "pdf-catalog":["Catálogo PDF","Diseños por temporada para clientes"],
    sales:["Ventas","Historial con costos congelados"],
    orders:["Pedidos","Clientes y entregas"],
    production:["Producción","Impresiones y consumo"],
    expenses:["Gastos","Egresos"],
    stats:["Estadísticas","Resultados y consumo"],
    settings:["Configuración","P1S, electricidad, Firebase y datos"]
  };
  $("#title").textContent=titles[v][0];
  $("#subtitle").textContent=titles[v][1];
  render();
}

function dashboard(){
  const inc=data.sales.reduce((s,x)=>s+n(x.unitPrice)*n(x.quantity),0);
  const ex=data.expenses.reduce((s,x)=>s+n(x.amount),0);
  const u=data.sales.reduce((s,x)=>s+(n(x.unitPrice)-n(x.costSnapshot))*n(x.quantity),0)-ex;
  const h=data.production.reduce((s,x)=>s+n(x.machineHours)*n(x.quantity),0);
  const pending=data.orders.filter(x=>!["Entregado","Cancelado"].includes(x.status)).length;
  const sold={}; data.sales.forEach(s=>sold[s.productId]=(sold[s.productId]||0)+n(s.quantity));
  const top=Object.entries(sold).sort((a,b)=>b[1]-a[1])[0];
  return `<div class="grid">
    <div class="card metric"><small>Ventas</small><strong>${money(inc)}</strong></div>
    <div class="card metric"><small>Gastos</small><strong>${money(ex)}</strong></div>
    <div class="card metric"><small>Utilidad</small><strong class="${u>=0?"positive":"negative"}">${money(u)}</strong></div>
    <div class="card metric"><small>Pedidos pendientes</small><strong>${pending}</strong></div>
  </div>
  <div class="grid2">
    <div class="card"><h3>Producción</h3><p>Horas P1S: <b>${h.toFixed(2)} h</b></p><p>Filamento en inventario: <b>${data.filaments.reduce((s,f)=>s+n(f.stock),0).toFixed(0)} g</b></p></div>
    <div class="card"><h3>Producto más vendido</h3><p>${top?`<b>${esc(prod(top[0])?.name||"Eliminado")}</b> · ${top[1]} unidades`:"Todavía no hay ventas."}</p></div>
  </div>`;
}

function filamentsView(){
  return `<div class="toolbar"><span>El costo por gramo se calcula automáticamente.</span><button class="primary" data-add="filament">+ Nuevo filamento</button></div>
  <div class="card tablewrap"><table class="table"><tr><th>Filamento</th><th>Color</th><th>Rollo</th><th>$/g</th><th>Stock</th><th></th></tr>
  ${data.filaments.map(f=>`<tr><td><b>${esc(f.name)}</b><br><small>${esc(f.type)}</small></td><td>${esc(f.color)}</td><td>${f.rollGrams}g / ${money(f.rollPrice)}</td><td>${money(gramCost(f))}</td><td class="${n(f.stock)<=n(f.lowStock)?"negative":""}">${f.stock}g</td><td><button class="secondary" data-edit="filament" data-id="${f.id}">Editar</button> <button class="danger" data-del="filament" data-id="${f.id}">×</button></td></tr>`).join("") || `<tr><td colspan="6" class="empty">Sin filamentos.</td></tr>`}
  </table></div>`;
}

function catalogView(){
  return `<div class="toolbar"><span>La temporada controla el diseño del catálogo PDF.</span><button class="primary" data-add="product">+ Nuevo producto</button></div>
  <div class="grid2">${data.products.map(p=>{
    const c=productCost(p), m=n(p.salePrice)-c, mp=n(p.salePrice)?m/n(p.salePrice)*100:0;
    return `<div class="card product-admin">${p.imageUrl?`<img class="photo" src="${esc(p.imageUrl)}">`:""}
      <div class="row-between"><h3>${esc(p.name)}</h3><span class="season-badge">${esc(p.season||"Todo el año")}</span></div>
      <span class="badge">${esc(p.category)}</span>
      <p>${p.printHours} h · ${p.materials?.length||0} materiales</p>
      <p>Costo: <b>${money(c)}</b> · Margen: <b>${mp.toFixed(1)}%</b></p>
      ${p.description?`<p class="muted">${esc(p.description)}</p>`:""}
      <button class="secondary" data-edit="product" data-id="${p.id}">Editar</button>
      <button class="danger" data-del="product" data-id="${p.id}">Eliminar</button>
    </div>`;
  }).join("") || `<div class="card empty">Sin productos.</div>`}</div>`;
}

function salesView(){
  return `<div class="toolbar"><span>El costo histórico se congela al registrar la venta.</span><button class="primary" data-add="sale">+ Registrar venta</button></div>
  <div class="card tablewrap"><table class="table"><tr><th>Fecha</th><th>Producto</th><th>Cant.</th><th>Precio</th><th>Costo</th><th>Utilidad</th><th></th></tr>
  ${data.sales.slice().reverse().map(s=>`<tr><td>${s.date}</td><td>${esc(prod(s.productId)?.name||"Eliminado")}</td><td>${s.quantity}</td><td>${money(s.unitPrice)}</td><td>${money(s.costSnapshot)}</td><td class="${n(s.unitPrice)>=n(s.costSnapshot)?"positive":"negative"}">${money((n(s.unitPrice)-n(s.costSnapshot))*n(s.quantity))}</td><td><button class="danger" data-del="sale" data-id="${s.id}">×</button></td></tr>`).join("") || `<tr><td colspan="7" class="empty">Sin ventas.</td></tr>`}</table></div>`;
}

function ordersView(){
  return `<div class="toolbar"><span></span><button class="primary" data-add="order">+ Nuevo pedido</button></div>
  <div class="card tablewrap"><table class="table"><tr><th>Cliente</th><th>Producto</th><th>Cant.</th><th>Entrega</th><th>Total</th><th>Saldo</th><th>Estado</th><th></th></tr>
  ${data.orders.slice().reverse().map(o=>`<tr><td>${esc(o.client)}</td><td>${esc(prod(o.productId)?.name||"Eliminado")}</td><td>${o.quantity}</td><td>${o.deliveryDate||"-"}</td><td>${money(o.total)}</td><td>${money(n(o.total)-n(o.deposit))}</td><td><span class="badge">${esc(o.status)}</span></td><td><button class="secondary" data-edit="order" data-id="${o.id}">Editar</button></td></tr>`).join("") || `<tr><td colspan="8" class="empty">Sin pedidos.</td></tr>`}</table></div>`;
}

function productionView(){
  return `<div class="notice">Registrar producción descuenta automáticamente los gramos de cada filamento según la receta × cantidad.</div>
  <div class="toolbar"><span></span><button class="primary" data-add="production">+ Registrar producción</button></div>
  <div class="card tablewrap"><table class="table"><tr><th>Fecha</th><th>Producto</th><th>Cant.</th><th>Horas</th><th>Consumo</th></tr>
  ${data.production.slice().reverse().map(x=>`<tr><td>${x.date}</td><td>${esc(prod(x.productId)?.name||"Eliminado")}</td><td>${x.quantity}</td><td>${(n(x.machineHours)*n(x.quantity)).toFixed(2)}</td><td>${(x.snapshot||[]).map(m=>`${esc(m.name)} ${m.grams}g`).join("<br>")}</td></tr>`).join("") || `<tr><td colspan="5" class="empty">Sin producción.</td></tr>`}</table></div>`;
}

function expensesView(){
  return `<div class="toolbar"><span></span><button class="primary" data-add="expense">+ Nuevo gasto</button></div>
  <div class="card tablewrap"><table class="table"><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Monto</th><th></th></tr>
  ${data.expenses.slice().reverse().map(x=>`<tr><td>${x.date}</td><td>${esc(x.category)}</td><td>${esc(x.description)}</td><td>${money(x.amount)}</td><td><button class="danger" data-del="expense" data-id="${x.id}">×</button></td></tr>`).join("") || `<tr><td colspan="5" class="empty">Sin gastos.</td></tr>`}</table></div>`;
}

function statsView(){
  const inc=data.sales.reduce((s,x)=>s+n(x.unitPrice)*n(x.quantity),0);
  const cost=data.sales.reduce((s,x)=>s+n(x.costSnapshot)*n(x.quantity),0);
  const ex=data.expenses.reduce((s,x)=>s+n(x.amount),0);
  const u=inc-cost-ex;
  const g=data.production.reduce((s,x)=>s+(x.snapshot||[]).reduce((a,m)=>a+n(m.grams),0),0);
  const h=data.production.reduce((s,x)=>s+n(x.machineHours)*n(x.quantity),0);
  return `<div class="grid"><div class="card metric"><small>Ingresos</small><strong>${money(inc)}</strong></div><div class="card metric"><small>Costo vendido</small><strong>${money(cost)}</strong></div><div class="card metric"><small>Gastos</small><strong>${money(ex)}</strong></div><div class="card metric"><small>Utilidad</small><strong class="${u>=0?"positive":"negative"}">${money(u)}</strong></div></div>
  <div class="grid2"><div class="card"><h3>Consumo</h3><p>Filamento: <b>${g.toFixed(1)} g</b></p><p>Horas P1S: <b>${h.toFixed(2)} h</b></p></div><div class="card"><h3>Referencia de utilidad</h3><p>40% reinversión: ${money(u*.4)}</p><p>30% reserva: ${money(u*.3)}</p><p>30% libre: ${money(u*.3)}</p></div></div>`;
}

function settingsView(){
  return `<div class="card"><form id="settings" class="formgrid">
    <div class="field"><label>Nombre</label><input name="businessName" value="${esc(data.settings.businessName)}"></div>
    <div class="field"><label>Consumo P1S (W)</label><input name="powerW" type="number" value="${data.settings.powerW}"></div>
    <div class="field"><label>Electricidad ($/kWh)</label><input name="electricityKwh" type="number" step=".01" value="${data.settings.electricityKwh}"></div>
    <div class="field"><label>Margen objetivo (%)</label><input name="targetMargin" type="number" step=".1" value="${data.settings.targetMargin}"></div>
    <div class="full"><button class="primary">Guardar configuración</button></div>
  </form></div>
  <div class="card"><h3>Respaldo</h3><p>Guarda una copia JSON de todos tus datos o restaura una copia anterior.</p><button id="export" class="secondary">Exportar respaldo</button> <button id="import" class="secondary">Importar respaldo</button><input id="file" type="file" accept=".json" class="hidden"></div>
  <div class="card"><h3>Firebase</h3><p>${firebaseReady?"🟢 Firebase configurado.":"🟡 Modo local. Pega tu configuración en <code>js/firebase-config.js</code> para activar Firestore y Storage."}</p></div>`;
}

function render(){
  const views={dashboard:dashboard,filaments:filamentsView,catalog:catalogView,sales:salesView,orders:ordersView,production:productionView,expenses:expensesView,stats:statsView,settings:settingsView};
  if(current==="pdf-catalog"){
    $("#content").innerHTML=`<div id="pdfCatalogApp"></div>`;
    window.dispatchEvent(new Event("catalog-view-ready"));
  } else {
    $("#content").innerHTML=views[current]();
    bind();
  }
}

const productOptions=(selected="")=>data.products.map(p=>`<option value="${p.id}" ${p.id===selected?"selected":""}>${esc(p.name)}</option>`).join("");
const seasonOptions=(selected="Todo el año")=>seasons.map(s=>`<option ${s===selected?"selected":""}>${esc(s)}</option>`).join("");
const materialHTML=()=>materials.map((m,i)=>`<div class="material"><select data-mi="${i}">${data.filaments.map(f=>`<option value="${f.id}" ${f.id===m.filamentId?"selected":""}>${esc(f.name)} · ${esc(f.color)}</option>`).join("")}</select><input data-mg="${i}" type="number" step=".1" value="${m.grams}"><button type="button" class="danger" data-rm="${i}">×</button></div>`).join("") || `<p class="muted">Agrega filamentos y gramos por pieza.</p>`;

function openForm(type,id0=null){
  editing=id0;
  const x=id0?(type==="filament"?fil(id0):type==="product"?prod(id0):type==="order"?data.orders.find(o=>o.id===id0):null):null;
  let body="";
  if(type==="filament") body=`<div class="formgrid"><div class="field"><label>Nombre</label><input name="name" required value="${esc(x?.name||"PLA")}"></div><div class="field"><label>Tipo</label><input name="type" value="${esc(x?.type||"PLA")}"></div><div class="field"><label>Color</label><input name="color" value="${esc(x?.color||"")}"></div><div class="field"><label>Gramos rollo</label><input name="rollGrams" type="number" value="${x?.rollGrams||1000}"></div><div class="field"><label>Precio rollo</label><input name="rollPrice" type="number" step=".01" value="${x?.rollPrice||0}"></div><div class="field"><label>Stock (g)</label><input name="stock" type="number" step=".1" value="${x?.stock??1000}"></div><div class="field"><label>Alerta (g)</label><input name="lowStock" type="number" value="${x?.lowStock||100}"></div></div>`;
  if(type==="product"){
    materials=JSON.parse(JSON.stringify(x?.materials||[]));
    body=`<div class="formgrid">
      <div class="field"><label>Nombre</label><input name="name" required value="${esc(x?.name||"")}"></div>
      <div class="field"><label>Categoría</label><input name="category" value="${esc(x?.category||"")}"></div>
      <div class="field"><label>Precio venta</label><input name="salePrice" type="number" step=".01" value="${x?.salePrice||0}"></div>
      <div class="field"><label>Horas impresión</label><input name="printHours" type="number" step=".01" value="${x?.printHours||1}"></div>
      <div class="field"><label>Temporada para el catálogo</label><select name="season">${seasonOptions(x?.season||"Todo el año")}</select></div>
      <div class="field"><label>Colores disponibles</label><input name="colors" value="${esc(x?.colors||"")}" placeholder="Negro, blanco, rojo..."></div>
      <div class="field full"><label>Descripción para clientes</label><textarea name="description" rows="3" placeholder="Texto breve que aparecerá en el catálogo">${esc(x?.description||"")}</textarea></div>
      <div class="field full"><label>Foto del producto</label><input name="image" type="file" accept="image/*"><small>Se redimensiona y comprime a WebP.</small></div>
      <div class="full"><label>Filamentos por pieza</label><div id="materials">${materialHTML()}</div><button type="button" class="secondary" id="addmat">+ Agregar filamento</button></div>
      <div class="full"><div class="notice">Costo actual estimado: <b>${money(productCost({...x,materials}))}</b></div></div>
    </div>`;
  }
  if(type==="sale") body=`<div class="formgrid"><div class="field"><label>Producto</label><select name="productId">${productOptions()}</select></div><div class="field"><label>Cantidad</label><input name="quantity" type="number" min="1" value="1"></div><div class="field"><label>Precio unitario</label><input name="unitPrice" type="number" step=".01" required></div><div class="field"><label>Fecha</label><input name="date" type="date" value="${today()}"></div><div class="full"><label>Notas</label><textarea name="notes"></textarea></div></div>`;
  if(type==="order") body=`<div class="formgrid"><div class="field"><label>Cliente</label><input name="client" required value="${esc(x?.client||"")}"></div><div class="field"><label>Producto</label><select name="productId">${productOptions(x?.productId)}</select></div><div class="field"><label>Cantidad</label><input name="quantity" type="number" value="${x?.quantity||1}"></div><div class="field"><label>Total</label><input name="total" type="number" step=".01" value="${x?.total||0}"></div><div class="field"><label>Anticipo</label><input name="deposit" type="number" step=".01" value="${x?.deposit||0}"></div><div class="field"><label>Entrega</label><input name="deliveryDate" type="date" value="${x?.deliveryDate||""}"></div><div class="field"><label>Estado</label><select name="status">${["Pendiente","Confirmado","En producción","Terminado","Entregado","Cancelado"].map(s=>`<option ${s===(x?.status||"Pendiente")?"selected":""}>${s}</option>`).join("")}</select></div><div class="full"><label>Notas</label><textarea name="notes">${esc(x?.notes||"")}</textarea></div></div>`;
  if(type==="production") body=`<div class="formgrid"><div class="field"><label>Producto</label><select name="productId">${productOptions()}</select></div><div class="field"><label>Cantidad</label><input name="quantity" type="number" min="1" value="1"></div><div class="field"><label>Horas por unidad</label><input name="machineHours" type="number" step=".01" value="1"></div><div class="field"><label>Fecha</label><input name="date" type="date" value="${today()}"></div></div>`;
  if(type==="expense") body=`<div class="formgrid"><div class="field"><label>Categoría</label><select name="category">${["Filamento","Electricidad","Mantenimiento","Herramientas","Empaque","Envío","Otro"].map(s=>`<option>${s}</option>`).join("")}</select></div><div class="field"><label>Monto</label><input name="amount" type="number" step=".01" required></div><div class="field"><label>Fecha</label><input name="date" type="date" value="${today()}"></div><div class="full"><label>Descripción</label><input name="description"></div></div>`;
  $("#mtitle").textContent=(id0?"Editar ":"Nuevo ")+type;
  $("#mbody").innerHTML=`<form id="form">${body}<div class="formactions"><button type="button" class="secondary" id="cancel">Cancelar</button><button class="primary">Guardar</button></div></form>`;
  $("#modal").classList.remove("hidden");
  bind();
}

function bind(){
  document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>openForm(b.dataset.add));
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>openForm(b.dataset.edit,b.dataset.id));
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>removeItem(b.dataset.del,b.dataset.id));
  $("#cancel")?.addEventListener("click",()=>$("#modal").classList.add("hidden"));
  $("#form")?.addEventListener("submit",submitForm);
  $("#addmat")?.addEventListener("click",()=>{materials.push({filamentId:data.filaments[0]?.id||"",grams:0});$("#materials").innerHTML=materialHTML();bind();});
  document.querySelectorAll("[data-mi]").forEach(e=>e.onchange=()=>materials[+e.dataset.mi].filamentId=e.value);
  document.querySelectorAll("[data-mg]").forEach(e=>e.oninput=()=>materials[+e.dataset.mg].grams=n(e.value));
  document.querySelectorAll("[data-rm]").forEach(e=>e.onclick=()=>{materials.splice(+e.dataset.rm,1);$("#materials").innerHTML=materialHTML();bind();});
  $("#settings")?.addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.target);data.settings={businessName:f.get("businessName"),powerW:n(f.get("powerW")),electricityKwh:n(f.get("electricityKwh")),targetMargin:n(f.get("targetMargin"))};save();sync();toast("Configuración guardada");render();});
  $("#export")?.addEventListener("click",()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download="negocio3d-respaldo.json";a.click();});
  $("#import")?.addEventListener("click",()=>$("#file").click());
  $("#file")?.addEventListener("change",e=>{const r=new FileReader();r.onload=()=>{try{data=JSON.parse(r.result);data.settings={...base.settings,...(data.settings||{})};save();sync();render();toast("Respaldo importado")}catch{toast("Archivo inválido")}};r.readAsText(e.target.files[0]);});
}

async function compressImage(file){
  const img=new Image(), url=URL.createObjectURL(file);
  await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=url});
  const canvas=document.createElement("canvas"), max=1200, scale=Math.min(1,max/img.width);
  canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
  canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
  const blob=await new Promise(r=>canvas.toBlob(r,"image/webp",.78));
  URL.revokeObjectURL(url);
  if(!firebaseReady) return await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(blob)});
  const r=ref(storage,`products/${newid()}.webp`);
  await uploadBytes(r,blob,{contentType:"image/webp"});
  return await getDownloadURL(r);
}

async function submitForm(e){
  e.preventDefault();
  const f=new FormData(e.target), title=$("#mtitle").textContent.toLowerCase(), id=editing||newid();
  if(title.includes("filamento")){
    const o={id,name:f.get("name"),type:f.get("type"),color:f.get("color"),rollGrams:n(f.get("rollGrams")),rollPrice:n(f.get("rollPrice")),stock:n(f.get("stock")),lowStock:n(f.get("lowStock"))};
    const old=fil(editing); old?Object.assign(old,o):data.filaments.push(o);
  } else if(title.includes("producto")){
    let imageUrl=prod(editing)?.imageUrl||null;
    if(f.get("image")?.size) imageUrl=await compressImage(f.get("image"));
    const o={id,name:f.get("name"),category:f.get("category"),salePrice:n(f.get("salePrice")),printHours:n(f.get("printHours")),season:f.get("season"),colors:f.get("colors"),description:f.get("description"),materials:[...materials],imageUrl};
    const old=prod(editing); old?Object.assign(old,o):data.products.push(o);
  } else if(title.includes("venta")){
    const p=prod(f.get("productId"));
    data.sales.push({id,productId:f.get("productId"),quantity:n(f.get("quantity")),unitPrice:n(f.get("unitPrice")),costSnapshot:productCost(p),date:f.get("date"),notes:f.get("notes")});
  } else if(title.includes("pedido")){
    const o={id,client:f.get("client"),productId:f.get("productId"),quantity:n(f.get("quantity")),total:n(f.get("total")),deposit:n(f.get("deposit")),deliveryDate:f.get("deliveryDate"),status:f.get("status"),notes:f.get("notes")};
    const old=data.orders.find(x=>x.id===editing); old?Object.assign(old,o):data.orders.push(o);
  } else if(title.includes("producción")||title.includes("produccion")){
    const p=prod(f.get("productId")),q=n(f.get("quantity"));
    const snapshot=(p.materials||[]).map(m=>({filamentId:m.filamentId,name:fil(m.filamentId)?.name||"Eliminado",grams:n(m.grams)*q}));
    const bad=snapshot.find(m=>n(fil(m.filamentId)?.stock)<m.grams);
    if(bad){toast("Stock insuficiente: "+bad.name);return;}
    snapshot.forEach(m=>fil(m.filamentId).stock-=m.grams);
    data.production.push({id,productId:p.id,quantity:q,machineHours:n(f.get("machineHours")),date:f.get("date"),snapshot});
  } else if(title.includes("gasto")){
    data.expenses.push({id,category:f.get("category"),amount:n(f.get("amount")),date:f.get("date"),description:f.get("description")});
  }
  save(); if(firebaseReady) await sync();
  $("#modal").classList.add("hidden"); toast("Guardado"); render();
}

async function removeItem(type,id){
  if(!confirm("¿Eliminar este registro?")) return;
  const map={filament:"filaments",product:"products",sale:"sales",expense:"expenses"};
  if(map[type]) data[map[type]]=data[map[type]].filter(x=>x.id!==id);
  save(); if(firebaseReady) await sync(); render();
}

document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{nav(b.dataset.view);document.querySelector(".sidebar").classList.remove("open")});
$("#menu").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");
$("#theme").onclick=()=>document.documentElement.classList.toggle("dark");
$("#close").onclick=()=>$("#modal").classList.add("hidden");
$("#connection").textContent=firebaseReady?"● Firebase configurado":"● Modo local";
nav("dashboard");
loadCloud().catch(e=>{console.error(e);toast("Firebase no pudo cargar; se mantiene el modo local")});

export { data };
