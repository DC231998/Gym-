import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the company to get the definitive name and logo
    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      select: { name: true, logoUrl: true },
    });

    let settings = await prisma.businessSettings.findFirst({
      where: { companyId: session.companyId },
    });

    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: { companyId: session.companyId },
      });
    }

    return NextResponse.json({
      ...settings,
      // Priority goes to Company.name, fallback to settings.businessName if empty, fallback to fixed text
      businessName: company?.name || settings.businessName || '3D Business Manager',
      companyLogo: company?.logoUrl || null,
      currentUserRole: session.companyRole,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener configuración' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Server-side validation for logoUrl length (>100KB is approx 137000 base64 chars)
    if (data.companyLogo && typeof data.companyLogo === 'string') {
      if (data.companyLogo.length > 150000) { // 150,000 characters limit
        return NextResponse.json({ error: 'El logo es demasiado pesado. La imagen debe ser menor a 100 KB.' }, { status: 400 });
      }
      
      const isPng = data.companyLogo.startsWith('data:image/png;base64,');
      const isJpeg = data.companyLogo.startsWith('data:image/jpeg;base64,');
      const isWebp = data.companyLogo.startsWith('data:image/webp;base64,');
      
      if (!isPng && !isJpeg && !isWebp) {
        return NextResponse.json({ error: 'Formato de imagen no permitido. Usa PNG, JPG o WEBP.' }, { status: 400 });
      }
    }

    // Only owners can update the company name and logo
    if (session.companyRole === 'owner') {
      if (data.businessName || data.companyLogo !== undefined) {
        await prisma.company.update({
          where: { id: session.companyId },
          data: {
            ...(data.businessName ? { name: data.businessName } : {}),
            ...(data.companyLogo !== undefined ? { logoUrl: data.companyLogo } : {}),
          },
        });
      }
    }

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

    const updateData = {
      businessName: data.businessName, // Keep it in sync for legacy compatibility
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
    };

    let existingSettings = await prisma.businessSettings.findFirst({
      where: { companyId: session.companyId },
    });

    let updated;
    if (existingSettings) {
      await prisma.businessSettings.updateMany({
        where: { id: existingSettings.id, companyId: session.companyId },
        data: updateData,
      });
      updated = await prisma.businessSettings.findFirst({
        where: { id: existingSettings.id, companyId: session.companyId },
      });
    } else {
      updated = await prisma.businessSettings.create({
        data: {
          companyId: session.companyId,
          businessName: data.businessName || '3D Business Manager',
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar configuración' }, { status: 500 });
  }
}
