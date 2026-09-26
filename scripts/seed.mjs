import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Limpiando e inicializando datos de configuración y demo ---');

  // 1. Business Settings
  await prisma.businessSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      businessName: '3D Business Manager',
      phone: '443 123 4567',
      whatsapp: '4431234567',
      email: 'ventas@3dbusinessmanager.com',
      address: 'Circuito Los Olivos #142',
      neighborhood: 'El Trébol',
      city: 'Tarímbaro',
      state: 'Michoacán',
      country: 'México',
      currency: 'MXN',
      currencySymbol: '$',
      defaultElectricityRate: 2.15,
      electricityTariffType: '1B / Doméstica Ordinaria (CFE)',
      electricityRateSource: 'CFE Suministrador de Servicios Básicos - Zona Morelia / Tarímbaro',
      electricityRateLastUpdated: new Date('2026-09-01'),
      defaultLaborRatePerHour: 60.0,
      defaultFailureRatePercent: 5.0,
      defaultMarginPercent: 50.0,
      defaultRoundPrices: true,
      profitReinvestmentPercent: 40.0,
      profitMaintenancePercent: 20.0,
      profitOwnerPercent: 40.0,
      catalogHeaderNotes: 'Catálogo de impresiones 3D personalizadas y de temporada. Alta calidad y precisión.',
      catalogFooterNotes: 'Cotizaciones y pedidos por WhatsApp al 4431234567. Entregas en Tarímbaro, Morelia y envíos a todo México.',
    },
  });

  // 2. Impresora principal: Bambu Lab P1S Combo
  const existingPrinter = await prisma.printer.findFirst({
    where: { model: 'P1S Combo' },
  });

  let printerId;
  if (!existingPrinter) {
    const printer = await prisma.printer.create({
      data: {
        brand: 'Bambu Lab',
        model: 'P1S Combo',
        name: 'Bambu Lab P1S Combo Principal',
        purchasePrice: 21999.0,
        purchaseDate: new Date('2025-10-15'),
        powerWatts: 150.0, // Watts consumo promedio
        accumulatedHours: 342.5,
        lifespanHours: 6000.0,
        residualValue: 4000.0,
        depreciationEnabled: true,
        status: 'activo',
        notes: 'Impresora cerrada con AMS 4 colores, boquilla de acero endurecido de 0.4mm instalada.',
      },
    });
    printerId = printer.id;
    console.log('✓ Impresora Bambu Lab P1S Combo creada:', printer.id);

    // Mantenimiento inicial
    await prisma.printerMaintenance.create({
      data: {
        printerId: printer.id,
        date: new Date('2026-08-10'),
        type: 'Lubricación varillas y limpieza de extrusor',
        cost: 150.0,
        printerHoursAtMaintenance: 250.0,
        description: 'Aplicación de grasa lubricante en husillos Z y alcohol isopropílico en varillas de carbono.',
        nextDueHours: 500.0,
        status: 'completado',
      },
    });
  } else {
    printerId = existingPrinter.id;
  }

  // 3. Temporadas
  const seasonsData = [
    {
      name: 'Todo el Año',
      slug: 'todo-el-ano',
      description: 'Productos estándar, regalos permanentes y organizadores para uso cotidiano.',
      primaryColorHex: '#2563EB',
      accentColorHex: '#1D4ED8',
      themeStyle: 'standard',
    },
    {
      name: 'Navidad',
      slug: 'navidad',
      description: 'Adornos de pino, litofanías navideñas, esferas personalizadas y figuras festivas.',
      primaryColorHex: '#DC2626',
      accentColorHex: '#16A34A',
      themeStyle: 'christmas',
    },
    {
      name: 'Halloween',
      slug: 'halloween',
      description: 'Calabazas articuladas, dulceros de terror, fantasmas glow y calaveras.',
      primaryColorHex: '#EA580C',
      accentColorHex: '#7C3AED',
      themeStyle: 'halloween',
    },
    {
      name: 'San Valentín',
      slug: 'san-valentin',
      description: 'Cajas con corazón secreto, rosas eternas articuladas y llaveros en pareja.',
      primaryColorHex: '#E11D48',
      accentColorHex: '#FB7185',
      themeStyle: 'romantic',
    },
    {
      name: 'Día de las Madres',
      slug: 'dia-de-las-madres',
      description: 'Macetas geométricas, floreros modernos y placas conmemorativas.',
      primaryColorHex: '#D946EF',
      accentColorHex: '#A21CAF',
      themeStyle: 'spring',
    },
    {
      name: 'Día del Niño',
      slug: 'dia-del-nino',
      description: 'Dragones articulados, juguetes fidget giratorios y figuras de colección.',
      primaryColorHex: '#06B6D4',
      accentColorHex: '#0891B2',
      themeStyle: 'standard',
    },
  ];

  const seasonMap = {};
  for (const s of seasonsData) {
    const season = await prisma.season.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    });
    seasonMap[s.slug] = season.id;
  }
  console.log('✓ Temporadas creadas/verificadas');

  // 4. Categorías
  const categoriesData = [
    { name: 'Decoración', slug: 'decoracion', icon: 'sparkles' },
    { name: 'Llaveros', slug: 'llaveros', icon: 'key' },
    { name: 'Figuras', slug: 'figuras', icon: 'trophy' },
    { name: 'Organizadores', slug: 'organizadores', icon: 'layers' },
    { name: 'Macetas y Hogar', slug: 'macetas-hogar', icon: 'home' },
    { name: 'Juguetes y Articulados', slug: 'juguetes', icon: 'gamepad' },
    { name: 'Accesorios', slug: 'accesorios', icon: 'watch' },
    { name: 'Personalizados', slug: 'personalizados', icon: 'user-check' },
  ];

  const categoryMap = {};
  for (const c of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    categoryMap[c.slug] = category.id;
  }
  console.log('✓ Categorías creadas/verificadas');

  // 5. Filamentos Demo requeridos:
  // PLA Negro, PLA Blanco, PLA Rojo, PLA Azul, PETG Transparente
  const filamentsData = [
    {
      brand: 'Bambu Lab',
      materialType: 'PLA',
      name: 'Bambu PLA Basic',
      colorName: 'Negro Carbón',
      colorHex: '#1A1A1A',
      purchasePrice: 460.0,
      purchaseWeightGrams: 1000.0,
      availableGrams: 750.0,
      pricePerGram: 0.46,
      supplier: 'Bambu Lab Store México',
      minStockGrams: 200.0,
      density: 1.24,
      printTemp: 220,
      bedTemp: 55,
      notes: 'Filamento con chip RFID para AMS.',
    },
    {
      brand: 'Bambu Lab',
      materialType: 'PLA',
      name: 'Bambu PLA Basic',
      colorName: 'Blanco Jade',
      colorHex: '#F8FAFC',
      purchasePrice: 460.0,
      purchaseWeightGrams: 1000.0,
      availableGrams: 820.0,
      pricePerGram: 0.46,
      supplier: 'Bambu Lab Store México',
      minStockGrams: 200.0,
      density: 1.24,
      printTemp: 220,
      bedTemp: 55,
      notes: 'Excelente acabado superficial para litofanías.',
    },
    {
      brand: 'eSUN',
      materialType: 'PLA+',
      name: 'eSUN PLA+ Fire',
      colorName: 'Rojo Fuego',
      colorHex: '#DC2626',
      purchasePrice: 420.0,
      purchaseWeightGrams: 1000.0,
      availableGrams: 450.0,
      pricePerGram: 0.42,
      supplier: 'Amazon México',
      minStockGrams: 200.0,
      density: 1.24,
      printTemp: 215,
      bedTemp: 60,
      notes: 'Alta tenacidad y adhesión entre capas.',
    },
    {
      brand: 'Sunlu',
      materialType: 'PLA',
      name: 'Sunlu PLA Silk',
      colorName: 'Azul Real',
      colorHex: '#2563EB',
      purchasePrice: 440.0,
      purchaseWeightGrams: 1000.0,
      availableGrams: 610.0,
      pricePerGram: 0.44,
      supplier: '3D Market Morelia',
      minStockGrams: 150.0,
      density: 1.24,
      printTemp: 210,
      bedTemp: 50,
      notes: 'Brillo satinado sedoso.',
    },
    {
      brand: 'Polymaker',
      materialType: 'PETG',
      name: 'PolyLite PETG',
      colorName: 'Cristal Transparente',
      colorHex: '#94A3B8',
      purchasePrice: 520.0,
      purchaseWeightGrams: 1000.0,
      availableGrams: 300.0,
      pricePerGram: 0.52,
      supplier: 'Mercado Libre',
      minStockGrams: 250.0,
      density: 1.27,
      printTemp: 240,
      bedTemp: 80,
      notes: 'Resistente a la intemperie y rayos UV.',
    },
  ];

  const filamentRecords = [];
  for (const f of filamentsData) {
    const existing = await prisma.filament.findFirst({
      where: { brand: f.brand, colorName: f.colorName, materialType: f.materialType },
    });
    if (!existing) {
      const rec = await prisma.filament.create({ data: f });
      filamentRecords.push(rec);
    } else {
      filamentRecords.push(existing);
    }
  }
  console.log('✓ Filamentos demo registrados:', filamentRecords.length);

  // 6. Clientes Demo: Cliente Demo 1, Cliente Demo 2
  const customer1 = await prisma.customer.upsert({
    where: { id: 'cust-demo-1' },
    update: {},
    create: {
      id: 'cust-demo-1',
      name: 'Alejandro Morales (Cliente Demo 1)',
      phone: '443 987 6543',
      whatsapp: '4439876543',
      email: 'alejandro.m@gmail.com',
      address: 'Calle Cedro #45',
      neighborhood: 'El Trébol',
      city: 'Tarímbaro',
      state: 'Michoacán',
      notes: 'Cliente frecuente de llaveros corporativos y macetas.',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 'cust-demo-2' },
    update: {},
    create: {
      id: 'cust-demo-2',
      name: 'Sofía Valenzuela (Cliente Demo 2)',
      phone: '443 555 1234',
      whatsapp: '4435551234',
      email: 'sofia.valenzuela@hotmail.com',
      address: 'Av. Las Palmas #210',
      neighborhood: 'Campestre',
      city: 'Morelia',
      state: 'Michoacán',
      notes: 'Interesada en catálogo navideño y figuras decorativas.',
    },
  });
  console.log('✓ Clientes demo creados');

  // SVG Data URL images for demo products to ensure they render beautifully in web & PDF!
  const createSvgDataUrl = (title, colorHex, iconType = 'box') => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${colorHex}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${colorHex}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="600" height="600" fill="url(#bg)"/>
      <circle cx="300" cy="270" r="180" fill="url(#glow)"/>
      <rect x="180" y="150" width="240" height="240" rx="36" fill="${colorHex}" fill-opacity="0.15" stroke="${colorHex}" stroke-width="4"/>
      <circle cx="300" cy="270" r="65" fill="${colorHex}" fill-opacity="0.85"/>
      <path d="M 270 270 L 300 240 L 330 270 L 300 300 Z" fill="#ffffff" fill-opacity="0.9"/>
      <text x="300" y="450" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
      <text x="300" y="490" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#94a3b8" text-anchor="middle">Impresión 3D de Precisión • Bambu Lab P1S</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  // 7. Productos Demo requeridos:
  // Llavero personalizado, Figura decorativa, Maceta, Organizador, Figura temática
  const demoProducts = [
    {
      sku: 'PRD-LLAV-01',
      name: 'Llavero Personalizado con Nombre y Relieve',
      description: 'Llavero rígido impreso en dos colores contrastantes con argolla reforzada.',
      categorySlug: 'llaveros',
      seasonSlug: 'todo-el-ano',
      weightGrams: 18.0,
      printTimeMinutes: 28,
      filamentId: filamentRecords[0].id,
      colorHex: filamentRecords[0].colorHex,
      colorName: filamentRecords[0].colorName,
      filamentCost: 8.28,
      electricityCost: 0.15,
      depreciationCost: 1.4,
      laborCost: 10.0,
      otherCosts: 5.0, // argolla de metal
      realCost: 24.83,
      marginPercent: 55.0,
      salePrice: 55.0,
      stock: 25,
      minStock: 5,
    },
    {
      sku: 'PRD-FIG-02',
      name: 'Figura Decorativa Poligonal Zorro Geométrico',
      description: 'Elegante figura de arte bajo en polígonos, ideal para escritorios y repisas modernas.',
      categorySlug: 'figuras',
      seasonSlug: 'todo-el-ano',
      weightGrams: 75.0,
      printTimeMinutes: 135,
      filamentId: filamentRecords[2].id,
      colorHex: filamentRecords[2].colorHex,
      colorName: filamentRecords[2].colorName,
      filamentCost: 31.5,
      electricityCost: 0.73,
      depreciationCost: 6.75,
      laborCost: 15.0,
      otherCosts: 0.0,
      realCost: 53.98,
      marginPercent: 60.0,
      salePrice: 140.0,
      stock: 8,
      minStock: 2,
    },
    {
      sku: 'PRD-MAC-03',
      name: 'Maceta Geométrica con Drenaje para Suculentas',
      description: 'Maceta moderna con bandeja recolectora de agua oculta, diseño en espiral.',
      categorySlug: 'macetas-hogar',
      seasonSlug: 'dia-de-las-madres',
      weightGrams: 120.0,
      printTimeMinutes: 210,
      filamentId: filamentRecords[1].id,
      colorHex: filamentRecords[1].colorHex,
      colorName: filamentRecords[1].colorName,
      filamentCost: 55.2,
      electricityCost: 1.13,
      depreciationCost: 10.5,
      laborCost: 15.0,
      otherCosts: 0.0,
      realCost: 81.83,
      marginPercent: 55.0,
      salePrice: 185.0,
      stock: 6,
      minStock: 2,
    },
    {
      sku: 'PRD-ORG-04',
      name: 'Organizador Modular de Escritorio y Herramientas',
      description: 'Soporte con divisiones ajustables para bolígrafos, pinzas y tarjetas SD.',
      categorySlug: 'organizadores',
      seasonSlug: 'todo-el-ano',
      weightGrams: 145.0,
      printTimeMinutes: 260,
      filamentId: filamentRecords[3].id,
      colorHex: filamentRecords[3].colorHex,
      colorName: filamentRecords[3].colorName,
      filamentCost: 63.8,
      electricityCost: 1.4,
      depreciationCost: 13.0,
      laborCost: 20.0,
      otherCosts: 4.0, // topes antideslizantes
      realCost: 102.2,
      marginPercent: 50.0,
      salePrice: 210.0,
      stock: 5,
      minStock: 2,
    },
    {
      sku: 'PRD-TEM-05',
      name: 'Figura Temática Calavera Articulada con Ojos Glow',
      description: 'Figura flexible articulada en un solo cuerpo, mandíbula móvil para Halloween.',
      categorySlug: 'decoracion',
      seasonSlug: 'halloween',
      weightGrams: 88.0,
      printTimeMinutes: 160,
      filamentId: filamentRecords[1].id,
      colorHex: filamentRecords[1].colorHex,
      colorName: filamentRecords[1].colorName,
      filamentCost: 40.48,
      electricityCost: 0.86,
      depreciationCost: 8.0,
      laborCost: 15.0,
      otherCosts: 0.0,
      realCost: 64.34,
      marginPercent: 60.0,
      salePrice: 165.0,
      stock: 12,
      minStock: 3,
    },
    {
      sku: 'PRD-NAV-06',
      name: 'Esfera Navideña Personalizada con Relieve Copo de Nieve',
      description: 'Esfera calada para árbol de Navidad con nombre personalizado grabado en arco.',
      categorySlug: 'decoracion',
      seasonSlug: 'navidad',
      weightGrams: 32.0,
      printTimeMinutes: 52,
      filamentId: filamentRecords[2].id,
      colorHex: filamentRecords[2].colorHex,
      colorName: filamentRecords[2].colorName,
      filamentCost: 13.44,
      electricityCost: 0.28,
      depreciationCost: 2.6,
      laborCost: 10.0,
      otherCosts: 2.0, // listón dorado
      realCost: 28.32,
      marginPercent: 65.0,
      salePrice: 85.0,
      stock: 30,
      minStock: 5,
    },
  ];

  const productRecords = [];
  for (const p of demoProducts) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (!existing) {
      const created = await prisma.product.create({
        data: {
          sku: p.sku,
          name: p.name,
          description: p.description,
          categoryId: categoryMap[p.categorySlug],
          seasonId: seasonMap[p.seasonSlug],
          primaryFilamentId: p.filamentId,
          defaultColorHex: p.colorHex,
          defaultColorName: p.colorName,
          weightGrams: p.weightGrams,
          printTimeMinutes: p.printTimeMinutes,
          failureRatePercent: 5.0,
          filamentCost: p.filamentCost,
          electricityCost: p.electricityCost,
          depreciationCost: p.depreciationCost,
          laborCost: p.laborCost,
          otherCosts: p.otherCosts,
          realCost: p.realCost,
          marginPercent: p.marginPercent,
          salePrice: p.salePrice,
          stock: p.stock,
          minStock: p.minStock,
          status: 'activo',
        },
      });

      // Crear imagen principal
      await prisma.productImage.create({
        data: {
          productId: created.id,
          url: createSvgDataUrl(p.name.split(' ')[0] + ' ' + (p.name.split(' ')[1] || ''), p.colorHex),
          isPrimary: true,
          displayOrder: 0,
        },
      });

      productRecords.push(created);
    } else {
      productRecords.push(existing);
    }
  }
  console.log('✓ Productos demo registrados:', productRecords.length);

  // 8. Paquete / Combo de ejemplo
  const existingPkg = await prisma.package.findUnique({ where: { sku: 'PKG-HOGAR-01' } });
  if (!existingPkg && productRecords.length >= 3) {
    const pkg = await prisma.package.create({
      data: {
        sku: 'PKG-HOGAR-01',
        name: 'Combo Deco Escritorio (Maceta + Organizador + Llavero)',
        description: 'Set completo moderno para ambientar tu estación de trabajo u oficina.',
        discountType: 'percent',
        discountValue: 15.0,
        normalPrice: 450.0,
        packagePrice: 380.0,
        totalCost: 208.86,
        profit: 171.14,
        marginPercent: 45.0,
        isActive: true,
      },
    });

    await prisma.packageItem.createMany({
      data: [
        { packageId: pkg.id, productId: productRecords[0].id, quantity: 1, unitCost: 24.83, unitPrice: 55.0 },
        { packageId: pkg.id, productId: productRecords[2].id, quantity: 1, unitCost: 81.83, unitPrice: 185.0 },
        { packageId: pkg.id, productId: productRecords[3].id, quantity: 1, unitCost: 102.2, unitPrice: 210.0 },
      ],
    });
    console.log('✓ Paquete / Combo creado:', pkg.name);
  }

  // 9. Ventas de ejemplo con pagos parciales y snapshots históricos
  const existingSale = await prisma.sale.findUnique({ where: { saleNumber: 'VEN-2026-0001' } });
  if (!existingSale && productRecords.length >= 2) {
    const sale1 = await prisma.sale.create({
      data: {
        saleNumber: 'VEN-2026-0001',
        date: new Date('2026-09-20'),
        customerId: customer1.id,
        customerName: customer1.name,
        subtotal: 1000.0,
        discount: 0.0,
        total: 1000.0,
        totalCost: 400.0,
        totalProfit: 600.0,
        paidAmount: 600.0,
        pendingAmount: 400.0,
        status: 'En producción',
        notes: 'Anticipo recibido. Entrega programada para fin de semana.',
        reinvestmentAmount: 240.0, // 40% de 600
        maintenanceAmount: 120.0,   // 20% de 600
        ownerProfitAmount: 240.0,   // 40% de 600
      },
    });

    // Items con snapshot histórico
    await prisma.saleItem.create({
      data: {
        saleId: sale1.id,
        productId: productRecords[0].id,
        description: 'Llavero Personalizado con Nombre y Relieve x 10',
        quantity: 10,
        unitPrice: 55.0,
        unitCost: 24.83,
        subtotal: 550.0,
        filamentCostSnapshot: 8.28,
        electricityCostSnapshot: 0.15,
        depreciationSnapshot: 1.4,
        laborSnapshot: 10.0,
        gramsSnapshot: 18.0,
        hoursSnapshot: 0.46,
        electricityRateSnapshot: 2.15,
      },
    });

    await prisma.saleItem.create({
      data: {
        saleId: sale1.id,
        productId: productRecords[1].id,
        description: 'Figura Decorativa Poligonal Zorro Geométrico x 3',
        quantity: 3,
        unitPrice: 150.0,
        unitCost: 53.98,
        subtotal: 450.0,
        filamentCostSnapshot: 31.5,
        electricityCostSnapshot: 0.73,
        depreciationSnapshot: 6.75,
        laborSnapshot: 15.0,
        gramsSnapshot: 75.0,
        hoursSnapshot: 2.25,
        electricityRateSnapshot: 2.15,
      },
    });

    // Pagos parciales: Pago 1 = 300, Pago 2 = 300
    await prisma.payment.create({
      data: {
        saleId: sale1.id,
        date: new Date('2026-09-20'),
        amount: 300.0,
        method: 'Transferencia',
        reference: 'BBVA-908123',
        notes: 'Anticipo inicial para compra de filamento',
      },
    });

    await prisma.payment.create({
      data: {
        saleId: sale1.id,
        date: new Date('2026-09-22'),
        amount: 300.0,
        method: 'Efectivo',
        notes: 'Segundo pago contra avance de producción',
      },
    });
    console.log('✓ Venta demo VEN-2026-0001 con pagos parciales registrada');
  }

  // 10. Gastos de ejemplo
  const existingExpense = await prisma.expense.findFirst();
  if (!existingExpense) {
    await prisma.expense.createMany({
      data: [
        {
          date: new Date('2026-09-15'),
          category: 'Filamento',
          description: 'Bobina Bambu PLA Basic Negro 1kg',
          amount: 460.0,
          paymentMethod: 'Tarjeta',
          supplier: 'Bambu Lab Store México',
          notes: 'Factura F-8910',
        },
        {
          date: new Date('2026-09-18'),
          category: 'Mantenimiento',
          description: 'Grasa sintética Super Lube y toallitas isopropílicas',
          amount: 180.0,
          paymentMethod: 'Efectivo',
          supplier: 'Ferretería Central',
        },
        {
          date: new Date('2026-09-21'),
          category: 'Electricidad',
          description: 'Recibo bimestral CFE Tarifa 1B Tarímbaro (parte proporcional taller)',
          amount: 340.0,
          paymentMethod: 'Transferencia',
          supplier: 'CFE Suministrador de Servicios Básicos',
        },
      ],
    });
    console.log('✓ Gastos demo registrados');
  }

  // 11. Próximas compras
  const existingPO = await prisma.purchaseOrder.findFirst();
  if (!existingPO) {
    await prisma.purchaseOrder.createMany({
      data: [
        {
          itemTitle: 'Filamento PETG Negro 1kg (Stock bajo)',
          supplier: 'Polymaker / Amazon',
          quantity: 2,
          estimatedPrice: 900.0,
          priority: 'Alta',
          category: 'Filamento',
          status: 'Pendiente',
          notes: 'Requerido para producción exterior.',
        },
        {
          itemTitle: 'Boquilla de repuesto Bambu Hardened Steel 0.4mm',
          supplier: 'Bambu Lab Store',
          quantity: 1,
          estimatedPrice: 420.0,
          priority: 'Media',
          category: 'Herramientas',
          status: 'Pendiente',
        },
      ],
    });
    console.log('✓ Próximas compras registradas');
  }

  // 12. Cotización demo
  const existingQuote = await prisma.quote.findUnique({ where: { quoteNumber: 'COT-2026-0001' } });
  if (!existingQuote && productRecords.length >= 2) {
    const quote = await prisma.quote.create({
      data: {
        quoteNumber: 'COT-2026-0001',
        customerId: customer2.id,
        customerName: customer2.name,
        customerPhone: customer2.phone,
        date: new Date('2026-09-23'),
        validityDays: 15,
        subtotal: 510.0,
        discount: 30.0,
        total: 480.0,
        status: 'vigente',
        notes: 'Cotización para 6 esferas navideñas personalizadas. Vigente por 15 días.',
      },
    });

    await prisma.quoteItem.create({
      data: {
        quoteId: quote.id,
        productId: productRecords[5].id,
        description: 'Esfera Navideña Personalizada con Relieve Copo de Nieve x 6',
        quantity: 6,
        unitPrice: 85.0,
        subtotal: 510.0,
      },
    });
    console.log('✓ Cotización demo registrada:', quote.quoteNumber);
  }

  console.log('=== Base de datos inicializada exitosamente ===');
}

main()
  .catch((e) => {
    console.error('Error al inicializar base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
