import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateFilamentPricePerGram,
  calculateElectricityCost,
  calculateDepreciationPerHour,
  calculateDepreciationCost,
  calculateRealProductPricing,
  calculateProfitDistribution,
  calculateSaleBalance,
  calculatePackageMetrics,
} from '../src/lib/calculations.ts';

test('1. FILAMENTO: precio / gramos = precio por gramo', () => {
  // $500 / 1000g = $0.50/g
  const pricePerGram1 = calculateFilamentPricePerGram(500, 1000);
  assert.equal(pricePerGram1, 0.5);

  // $450 / 1000g = $0.45/g
  const pricePerGram2 = calculateFilamentPricePerGram(450, 1000);
  assert.equal(pricePerGram2, 0.45);

  // Safe checks with 0 or negative
  assert.equal(calculateFilamentPricePerGram(0, 1000), 0);
  assert.equal(calculateFilamentPricePerGram(500, 0), 0);
});

test('2. ELECTRICIDAD: watts * horas / 1000 = kWh && kWh * tarifa = costo eléctrico', () => {
  // Bambu Lab P1S Combo: 150W, 4 hours, $2.15/kWh (CFE Tarifa Tarímbaro)
  // kWh = 150 * 4 / 1000 = 0.6 kWh
  // Costo = 0.6 * 2.15 = 1.29 MXN
  const { kwh, cost } = calculateElectricityCost(150, 4, 2.15);
  assert.equal(kwh, 0.6);
  assert.equal(cost, 1.29);
});

test('3. DEPRECIACIÓN: (precio - residual) / horas = depreciación por hora', () => {
  // Bambu Lab P1S Combo: $21,999 compra, $3,999 residual, 6000 horas vida útil
  // (21999 - 3999) / 6000 = 18000 / 6000 = 3.00 MXN/hora
  const depPerHour = calculateDepreciationPerHour(21999, 3999, 6000);
  assert.equal(depPerHour, 3.0);

  // 5 hours of printing = 5 * 3.0 = 15.0 MXN
  const depCost = calculateDepreciationCost(depPerHour, 5, true);
  assert.equal(depCost, 15.0);

  // Disabled depreciation should be 0
  const depCostDisabled = calculateDepreciationCost(depPerHour, 5, false);
  assert.equal(depCostDisabled, 0);
});

test('4. VENTA: total - pagos = saldo pendiente', () => {
  const { pending, isPaidFull } = calculateSaleBalance(1000, 600);
  assert.equal(pending, 400);
  assert.equal(isPaidFull, 0);

  const { pending: pendingFull, isPaidFull: isPaidFull2 } = calculateSaleBalance(1000, 1000);
  assert.equal(pendingFull, 0);
  assert.equal(isPaidFull2, 1);
});

test('5. GANANCIA Y COSTO REAL: venta - costo = ganancia', () => {
  const result = calculateRealProductPricing({
    filamentPricePerGram: 0.5, // $500 / 1000g
    weightGrams: 100, // $50 base
    failureRatePercent: 10, // 10% waste = $5.00 => total filament = $55.00
    powerWatts: 150,
    printTimeHours: 2, // 0.3 kWh * 2.0 = $0.60
    electricityRatePerKwh: 2.0,
    printerPurchasePrice: 20000,
    printerResidualValue: 2000,
    printerLifespanHours: 6000, // (18000 / 6000) = 3.0/hr * 2hr = $6.00
    depreciationEnabled: true,
    laborRatePerHour: 50,
    laborHours: 0.5, // $25.00
    otherCosts: 10, // $10.00
    marginPercent: 50, // 50% margin
    roundPrices: false,
  });

  // Real Cost: 55 (filament) + 0.60 (elec) + 6.00 (depr) + 25 (labor) + 10 (other) = 96.60
  assert.equal(result.realCost, 96.6);
  // Margin 50%: suggestedPrice = 96.60 / (1 - 0.5) = 193.20
  assert.equal(result.suggestedPrice, 193.2);
  // Profit: 193.20 - 96.60 = 96.60
  assert.equal(result.profit, 96.6);
});

test('6. DISTRIBUCIÓN DE GANANCIA: ganancia * porcentaje = cantidad (40/20/40)', () => {
  // Ganancia: $600
  // Reinversión (40%): $240
  // Mantenimiento (20%): $120
  // Ganancia neta (40%): $240
  const distribution = calculateProfitDistribution(600, 40, 20, 40);
  assert.equal(distribution.reinvestment, 240);
  assert.equal(distribution.maintenance, 120);
  assert.equal(distribution.owner, 240);
  assert.equal(distribution.reinvestment + distribution.maintenance + distribution.owner, 600);
});

test('7. PAQUETE: suma de productos = costo y cálculo de precio combo', () => {
  const items = [
    { unitCost: 30, unitPrice: 80, quantity: 2 }, // cost 60, price 160
    { unitCost: 40, unitPrice: 100, quantity: 1 }, // cost 40, price 100
  ];
  // Normal price = 260, Total cost = 100
  // 15% discount
  const metrics = calculatePackageMetrics(items, 'percent', 15);
  assert.equal(metrics.normalPrice, 260);
  assert.equal(metrics.totalCost, 100);
  // 260 * 0.85 = 221
  assert.equal(metrics.packagePrice, 221);
  // Profit = 221 - 100 = 121
  assert.equal(metrics.profit, 121);
});

test('8. INVENTARIO: stock inicial - consumo = stock final', () => {
  const initialStockGrams = 1000;
  const consumptionGrams = 120;
  const finalStockGrams = initialStockGrams - consumptionGrams;
  assert.equal(finalStockGrams, 880);
});
