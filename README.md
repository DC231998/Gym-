# 3D Business Manager - Sistema Integral de Impresión 3D

Sistema web profesional de nivel SaaS full-stack para la gestión, costeo exacto, ventas, catálogos PDF y control de taller de impresión 3D (orientado inicialmente a **Bambu Lab P1S Combo**, extensible a cualquier parque de impresoras).

---

## 🚀 Características Principales

1. **Panel de Control (Dashboard)**:
   - Métricas en tiempo real: Ventas del mes, Dinero cobrado, Dinero pendiente, Costos de producción, Ganancia neta, Horas de impresión y Gramos de filamento consumidos.
   - Filtros de periodo: *Hoy*, *Esta Semana*, *Este Mes*, *Este Año*.
   - Gráficos interactivos de ventas vs gastos y ganancias con Recharts.
   - Ranking de productos más vendidos y alertas operativas automáticas.

2. **Panel Hardware Bambu Lab P1S Combo**:
   - Seguimiento de horas acumuladas, horas del mes, consumo eléctrico real en Watts y costo acumulado.
   - Cálculo de depreciación horaria y acumulada.
   - Bitácora de mantenimiento preventivo y alertas de próximas horas de servicio.

3. **Fijador de Precios & Costeo Real**:
   - Flujo de 13 pasos con cálculo matemático de precisión:
     - **Filamento**: $(Precio / Gramos) \times Gramos$ + Porcentaje de desperdicio/merma.
     - **Electricidad**: $(Watts \times Horas / 1000) \times Tarifa CFE$ (Configurada para **El Trébol, Tarímbaro, Michoacán** a $2.15/kWh).
     - **Depreciación**: $(Precio Compra - Valor Residual) / Vida Útil \times Horas$ (Opcional, activable/desactivable).
     - **Mano de Obra**: Tarifa por hora configurable (Opcional).
     - **Otros Costos**: Accesorios, empaques, argollas metálicas, etc.
     - **Márgenes**: 20%, 30%, 40%, 50%, 60% o personalizado.
     - **Redondeo comercial**: Opcional (ej. $147.32 → $150).
   - Selector visual de muestras reales de filamento y paleta de colores interactiva.

4. **Catálogo de Productos**:
   - Múltiples fotografías por producto con selección de foto principal.
   - Ficha técnica completa: SKU único, categoría, temporada, peso, tiempo de impresión, desglose de costos, stock y margen.
   - Diseño adaptable en tarjetas optimizadas para dispositivos móviles.

5. **Generador de Catálogos PDF Comerciales**:
   - Agrupación automática por **TEMPORADA** y luego por **CATEGORÍA**.
   - Portada comercial profesional con identidad del negocio, WhatsApp y redes.
   - Separadores visuales temáticos con paletas dedicadas para cada temporada (*Navidad*, *Halloween*, *San Valentín*, *Día de las Madres*, etc.).
   - Múltiples plantillas de maquetación: 1 producto gigante, 2 productos, cuadrícula 2x2 (4 productos), 6 productos y 8 productos.
   - Compilación PDF client-side de alta resolución (formato A4) con `jsPDF` y `html2canvas`.
   - Botón directo para compartir el catálogo por **WhatsApp**.

6. **Paquetes & Combos**:
   - Agrupación de productos existentes con cálculo automático de costo total, precio normal, descuento (% o fijo) y ganancia neta.

7. **Ventas & Pagos Parciales**:
   - Registro de órdenes de venta con estados (*Cotización*, *Pendiente*, *En producción*, *Listo*, *Entregado*, *Cancelado*).
   - **Snapshots históricos inmutables**: La venta almacena una instantánea de los costos, tarifas y gramos al momento de la venta, garantizando que cambios futuros de tarifas no alteren ventas pasadas.
   - Pagos parciales múltiples con validación estricta anti-sobrepago.
   - Cálculo dinámico de saldo pendiente y botón para enviar recordatorio de saldo por WhatsApp.

8. **Gastos & Distribución de Ganancias**:
   - Registro de egresos por categorías (*Filamento*, *Electricidad*, *Mantenimiento*, *Herramientas*, *Empaque*, *Envíos*, *Software*, *Otros*).
   - Distribución de ganancia configurable con validación matemática al 100% (*40% Reinversión*, *20% Mantenimiento*, *40% Ganancia Dueño*).

9. **Inventario & Kardex**:
   - Control de gramos en bobinas de filamento y unidades de productos.
   - Registro histórico de entradas, salidas y mermas.
   - Alertas visuales destacadas de stock bajo.

10. **Cotizaciones**:
    - Creación de cotizaciones con vigencia en días.
    - Botón para **Convertir Cotización en Venta** con un solo clic.

11. **Respaldos JSON**:
    - Exportación de la base de datos completa con `backupVersion: "1.0.0"`.
    - Importación con validación de estructura y opciones de **Fusionar datos** o **Reemplazar todo** (con advertencia de confirmación).

12. **PWA & Responsive Design**:
    - Manifest web PWA con iconos SVG para instalación en Android, iPhone, iPad y PC.
    - Diseño mobile-first con barra de navegación táctil inferior y sidebar para escritorio.

---

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React, Recharts.
- **Backend**: Next.js API Routes (Serverless Handlers).
- **Base de Datos**: SQLite nativo local vía Prisma ORM (portable y sin dependencias externas).
- **Preparación Nube**: Compatible al 100% con PostgreSQL / Supabase con solo cambiar la variable `DATABASE_URL` y el provider de Prisma.
- **Generación PDF**: `jsPDF` + `html2canvas`.

---

## 📦 Instalación y Desarrollo Local

### Requisitos Previos
- Node.js LTS (v20 o superior).
- npm (v10 o superior).

### Pasos de Instalación

1. Clona o ubícate en el directorio del proyecto:
   ```bash
   cd C:\Users\Pc\.gemini\antigravity\scratch\3d-business-manager
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicializa la base de datos con Prisma:
   ```bash
   npx prisma db push
   ```

4. Carga los datos de demostración iniciales (Filamentos, Bambu Lab P1S, temporadas, categorías, productos y ventas de prueba):
   ```bash
   node scripts/seed.mjs
   ```

5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🧪 Pruebas Automatizadas

El sistema incluye una suite de pruebas unitarias que valida matemáticamente todas las fórmulas clave del negocio:
1. Costo por gramo de filamento.
2. Consumo eléctrico en kWh y tarifa CFE.
3. Depreciación por hora de impresora.
4. Saldo y pagos parciales de ventas.
5. Costo real y margen de beneficio.
6. Distribución porcentual de ganancias al 100%.
7. Costos y descuentos de paquetes/combos.
8. Balance y deducción de inventario.

Para ejecutar las pruebas:
```bash
npm test
```

---

## ☁️ Conexión a Base de Datos en la Nube (PostgreSQL / Supabase)

El sistema está diseñado para migrar a PostgreSQL o Supabase en cualquier momento:

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Obtén la cadena de conexión de PostgreSQL en `Settings` -> `Database`.
3. Edita el archivo `prisma/schema.prisma` y cambia el datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. En tu archivo `.env`, configura tu `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
5. Sincroniza la base de datos en la nube:
   ```bash
   npx prisma db push
   ```

---

## 🖼️ Almacenamiento de Fotografías

- **Modo Actual (Offline/Local)**: Las fotografías se procesan y optimizan automáticamente en formato Base64 Data URL, permitiendo operar 100% desconectado, persistir en los respaldos JSON y renderizar sin latencia en los catálogos PDF.
- **Modo Nube (Supabase Storage / S3)**: Si deseas subir archivos pesados externamente, crea un bucket llamado `product-photos` en Supabase Storage y define las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env`.

---

## 🚢 Compilación y Ejecución en Producción

1. Compila el proyecto optimizado:
   ```bash
   npm run build
   ```

2. Inicia el servidor de producción:
   ```bash
   npm start
   ```

---

## ⚙️ Configuración Personalizada por el Usuario

Dentro de la aplicación en el módulo **Configuración** puedes ajustar:
- **Nombre comercial**: Puedes cambiar "3D Business Manager" por el nombre de tu marca en cualquier momento.
- **Ubicación y Tarifa CFE**: Configurado inicialmente en **El Trébol, Tarímbaro, Michoacán** a $2.15/kWh (modificable si cambia tu recibo CFE).
- **Márgenes y porcentajes de ganancia**: Ajusta los porcentajes de reinversión, mantenimiento y dueño.
- **Eliminar datos demo**: Existe un botón dedicado en Configuración para limpiar los datos de prueba y comenzar con tu catálogo real.
