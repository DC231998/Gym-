import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.businessSettings.findUnique({
      where: { id: 'default' },
    });
    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: { id: 'default' },
      });
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener configuración' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    // Validate profit percentages sum to 100%
    if (
      data.profitReinvestmentPercent !== undefined &&
      data.profitMaintenancePercent !== undefined &&
      data.profitOwnerPercent !== undefined
    ) {
      const sum =
        Number(data.profitReinvestmentPercent) +
        Number(data.profitMaintenancePercent) +
        Number(data.profitOwnerPercent);
      if (Math.abs(sum - 100) > 0.5) {
        return NextResponse.json(
          { error: `Los porcentajes de distribución de ganancia deben sumar 100% (actual: ${sum.toFixed(1)}%)` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.businessSettings.upsert({
      where: { id: 'default' },
      update: {
        businessName: data.businessName,
        phone: data.phone,
        whatsapp: data.whatsapp,
        email: data.email,
        address: data.address,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        country: data.country,
        currency: data.currency,
        currencySymbol: data.currencySymbol,
        defaultElectricityRate: data.defaultElectricityRate ? Number(data.defaultElectricityRate) : undefined,
        electricityTariffType: data.electricityTariffType,
        electricityRateSource: data.electricityRateSource,
        electricityRateLastUpdated: data.electricityRateLastUpdated ? new Date(data.electricityRateLastUpdated) : new Date(),
        defaultLaborRatePerHour: data.defaultLaborRatePerHour ? Number(data.defaultLaborRatePerHour) : undefined,
        defaultFailureRatePercent: data.defaultFailureRatePercent ? Number(data.defaultFailureRatePercent) : undefined,
        defaultMarginPercent: data.defaultMarginPercent ? Number(data.defaultMarginPercent) : undefined,
        defaultRoundPrices: data.defaultRoundPrices !== undefined ? Boolean(data.defaultRoundPrices) : undefined,
        profitReinvestmentPercent: data.profitReinvestmentPercent ? Number(data.profitReinvestmentPercent) : undefined,
        profitMaintenancePercent: data.profitMaintenancePercent ? Number(data.profitMaintenancePercent) : undefined,
        profitOwnerPercent: data.profitOwnerPercent ? Number(data.profitOwnerPercent) : undefined,
        catalogHeaderNotes: data.catalogHeaderNotes,
        catalogFooterNotes: data.catalogFooterNotes,
        logoUrl: data.logoUrl,
      },
      create: {
        id: 'default',
        businessName: data.businessName || '3D Business Manager',
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar configuración' }, { status: 500 });
  }
}
