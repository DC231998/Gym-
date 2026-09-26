/**
 * 3D Business Manager - Precision Calculation Engine
 * 
 * Rules:
 * - Never return NaN, Infinity, or null/undefined.
 * - Always safe-check zero divisions.
 * - Round currency values to 2 decimal places or nearest integer depending on settings.
 */

export interface PricingInput {
  filamentPricePerGram: number; // in MXN
  weightGrams: number;
  failureRatePercent?: number; // e.g. 5% = 5
  powerWatts?: number; // Printer wattage, e.g. 150W
  printTimeHours: number; // e.g. 2.5 hours
  electricityRatePerKwh: number; // CFE tariff MXN per kWh
  printerPurchasePrice?: number;
  printerResidualValue?: number;
  printerLifespanHours?: number;
  depreciationEnabled?: boolean;
  laborRatePerHour?: number; // e.g. $50/hr
  laborHours?: number; // post-processing or prep hours
  otherCosts?: number; // magnets, screws, packaging, etc.
  marginPercent: number; // e.g. 50% = 50
  roundPrices?: boolean;
}

export interface PricingResult {
  filamentBaseCost: number;
  wasteCost: number;
  totalFilamentCost: number;
  kwhConsumed: number;
  electricityCost: number;
  depreciationPerHour: number;
  depreciationCost: number;
  laborCost: number;
  otherCosts: number;
  realCost: number;
  suggestedPrice: number;
  roundedPrice: number;
  finalPrice: number;
  profit: number;
  effectiveMarginPercent: number;
}

/**
 * Calculates filament price per gram safely
 */
export function calculateFilamentPricePerGram(purchasePrice: number, weightGrams: number): number {
  if (!purchasePrice || purchasePrice <= 0 || !weightGrams || weightGrams <= 0) return 0;
  return Number((purchasePrice / weightGrams).toFixed(4));
}

/**
 * Calculates electricity consumption and cost
 * Watts × hours / 1000 = kWh
 * kWh × tarifa = costo eléctrico
 */
export function calculateElectricityCost(powerWatts: number, hours: number, ratePerKwh: number): { kwh: number; cost: number } {
  const safeWatts = Math.max(0, powerWatts || 0);
  const safeHours = Math.max(0, hours || 0);
  const safeRate = Math.max(0, ratePerKwh || 0);

  const kwh = Number(((safeWatts * safeHours) / 1000).toFixed(4));
  const cost = Number((kwh * safeRate).toFixed(2));
  return { kwh, cost };
}

/**
 * Calculates hourly depreciation
 * (purchasePrice - residualValue) / lifespanHours
 */
export function calculateDepreciationPerHour(purchasePrice: number, residualValue: number, lifespanHours: number): number {
  if (!lifespanHours || lifespanHours <= 0) return 0;
  const netValue = Math.max(0, (purchasePrice || 0) - (residualValue || 0));
  return Number((netValue / lifespanHours).toFixed(4));
}

/**
 * Calculates total depreciation for a print job
 */
export function calculateDepreciationCost(depreciationPerHour: number, printHours: number, isEnabled = true): number {
  if (!isEnabled) return 0;
  const safeRate = Math.max(0, depreciationPerHour || 0);
  const safeHours = Math.max(0, printHours || 0);
  return Number((safeRate * safeHours).toFixed(2));
}

/**
 * Complete Real Cost and Price Calculator
 */
export function calculateRealProductPricing(input: PricingInput): PricingResult {
  const weightGrams = Math.max(0, input.weightGrams || 0);
  const pricePerGram = Math.max(0, input.filamentPricePerGram || 0);
  const failurePercent = Math.max(0, input.failureRatePercent ?? 5);

  // 1. Filament Base & Waste
  const filamentBaseCost = Number((weightGrams * pricePerGram).toFixed(2));
  const wasteCost = Number((filamentBaseCost * (failurePercent / 100)).toFixed(2));
  const totalFilamentCost = Number((filamentBaseCost + wasteCost).toFixed(2));

  // 2. Electricity
  const { kwh: kwhConsumed, cost: electricityCost } = calculateElectricityCost(
    input.powerWatts ?? 150,
    input.printTimeHours || 0,
    input.electricityRatePerKwh || 0
  );

  // 3. Depreciation
  let depreciationPerHour = 0;
  let depreciationCost = 0;
  if (input.depreciationEnabled) {
    depreciationPerHour = calculateDepreciationPerHour(
      input.printerPurchasePrice ?? 21999,
      input.printerResidualValue ?? 4000,
      input.printerLifespanHours ?? 6000
    );
    depreciationCost = calculateDepreciationCost(depreciationPerHour, input.printTimeHours || 0, true);
  }

  // 4. Labor
  const laborRate = Math.max(0, input.laborRatePerHour || 0);
  const laborHours = Math.max(0, input.laborHours || 0);
  const laborCost = Number((laborRate * laborHours).toFixed(2));

  // 5. Other costs
  const otherCosts = Number(Math.max(0, input.otherCosts || 0).toFixed(2));

  // REAL COST
  const realCost = Number((totalFilamentCost + electricityCost + depreciationCost + laborCost + otherCosts).toFixed(2));

  // Price & Margin
  // Profit Margin calculation: Price = Cost / (1 - Margin%/100) OR Markup: Price = Cost * (1 + Margin%/100)
  // In retail/manufacturing standard: Margin = (Price - Cost) / Price => Price = Cost / (1 - Margin)
  // However if margin >= 100, we fallback safely to markup
  const margin = Math.max(0, input.marginPercent || 0);
  let suggestedPrice = 0;
  if (margin >= 95) {
    suggestedPrice = Number((realCost * (1 + margin / 100)).toFixed(2));
  } else if (margin > 0) {
    suggestedPrice = Number((realCost / (1 - margin / 100)).toFixed(2));
  } else {
    suggestedPrice = realCost;
  }

  // Rounding options (e.g. 147.32 -> 150, 153.20 -> 155, or integer rounding)
  let roundedPrice = suggestedPrice;
  if (input.roundPrices) {
    // Round to nearest 5 MXN if over 20, or nearest integer
    if (suggestedPrice >= 20) {
      roundedPrice = Math.ceil(suggestedPrice / 5) * 5;
    } else {
      roundedPrice = Math.ceil(suggestedPrice);
    }
  }

  const finalPrice = input.roundPrices ? roundedPrice : suggestedPrice;
  const profit = Number(Math.max(0, finalPrice - realCost).toFixed(2));
  const effectiveMarginPercent = finalPrice > 0 ? Number(((profit / finalPrice) * 100).toFixed(1)) : 0;

  return {
    filamentBaseCost,
    wasteCost,
    totalFilamentCost,
    kwhConsumed,
    electricityCost,
    depreciationPerHour,
    depreciationCost,
    laborCost,
    otherCosts,
    realCost,
    suggestedPrice,
    roundedPrice,
    finalPrice,
    profit,
    effectiveMarginPercent,
  };
}

/**
 * Calculates profit distribution between Reinvestment, Maintenance, and Owner Profit
 * Sum of percentages should be 100
 */
export function calculateProfitDistribution(
  netProfit: number,
  reinvestmentPercent = 40,
  maintenancePercent = 20,
  ownerPercent = 40
): { reinvestment: number; maintenance: number; owner: number } {
  const safeProfit = Math.max(0, netProfit || 0);
  const totalPercent = reinvestmentPercent + maintenancePercent + ownerPercent;
  const factor = totalPercent > 0 ? 100 / totalPercent : 1;

  const adjReinvestment = reinvestmentPercent * factor;
  const adjMaintenance = maintenancePercent * factor;
  const adjOwner = ownerPercent * factor;

  const reinvestment = Number(((safeProfit * adjReinvestment) / 100).toFixed(2));
  const maintenance = Number(((safeProfit * adjMaintenance) / 100).toFixed(2));
  // Keep balance strictly accurate
  const owner = Number(Math.max(0, safeProfit - reinvestment - maintenance).toFixed(2));

  return {
    reinvestment,
    maintenance,
    owner,
  };
}

/**
 * Calculate Sale pending balance
 */
export function calculateSaleBalance(total: number, paidAmount: number): { pending: number; isPaidFull: number } {
  const safeTotal = Math.max(0, total || 0);
  const safePaid = Math.max(0, paidAmount || 0);
  const pending = Number(Math.max(0, safeTotal - safePaid).toFixed(2));
  return {
    pending,
    isPaidFull: pending <= 0 ? 1 : 0,
  };
}

/**
 * Calculate Package Price, Cost, and Profit
 */
export function calculatePackageMetrics(
  items: Array<{ unitCost: number; unitPrice: number; quantity: number }>,
  discountType: 'percent' | 'fixed',
  discountValue: number
) {
  let normalPrice = 0;
  let totalCost = 0;

  for (const item of items) {
    const q = Math.max(0, item.quantity || 1);
    normalPrice += (item.unitPrice || 0) * q;
    totalCost += (item.unitCost || 0) * q;
  }

  normalPrice = Number(normalPrice.toFixed(2));
  totalCost = Number(totalCost.toFixed(2));

  let packagePrice = normalPrice;
  if (discountType === 'percent') {
    const disc = Math.min(100, Math.max(0, discountValue || 0));
    packagePrice = Number((normalPrice * (1 - disc / 100)).toFixed(2));
  } else {
    packagePrice = Number(Math.max(totalCost, normalPrice - Math.max(0, discountValue || 0)).toFixed(2));
  }

  const profit = Number((packagePrice - totalCost).toFixed(2));
  const marginPercent = packagePrice > 0 ? Number(((profit / packagePrice) * 100).toFixed(1)) : 0;

  return {
    normalPrice,
    totalCost,
    packagePrice,
    profit,
    marginPercent,
  };
}

/**
 * Format currency in MXN format: $1,250.00
 */
export function formatCurrency(amount: number, symbol = '$'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `${symbol}0.00`;
  return `${symbol}${Number(amount).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
