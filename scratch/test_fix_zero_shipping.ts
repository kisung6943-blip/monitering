import { OrderItem, SettlementSettings } from '../src/dailyCalculatorTypes';

function recalculateTest(
  order: Partial<OrderItem>,
  settings: SettlementSettings,
  isBundleSubItem: boolean = false,
  overrideActualShippingToZero?: boolean,
  overrideBuyerShippingToZero?: boolean
) {
  let actualShippingCost = 0;
  if (overrideActualShippingToZero === true || (overrideActualShippingToZero === undefined && isBundleSubItem)) {
    actualShippingCost = 0;
  } else if (overrideActualShippingToZero === false) {
    actualShippingCost = (order.actualShippingCost && Number(order.actualShippingCost) > 0)
      ? Number(order.actualShippingCost)
      : settings.defaultActualShippingCost;
  } else {
    actualShippingCost = order.actualShippingCost !== undefined
      ? Number(order.actualShippingCost)
      : settings.defaultActualShippingCost;
  }
  return actualShippingCost;
}

const settings: SettlementSettings = {
  defaultPackagingCost: 500,
  defaultActualShippingCost: 1900,
  defaultIncomeTaxRate: 10,
  vatCalculationMethod: 'simple10',
  autoBundleShipping: true,
  bundleOnlyFirstPackageCost: false,
  coupangDefaultFee: 13,
  coupangRiceFee: 6,
  homepageFee: 3.85,
  smartstoreBaseFee: 3.74,
  smartstoreKnowledgeFee: 2.0,
  ohouseDefaultFee: 16,
  elevenstDefaultFee: 13,
  gmarketDefaultFee: 13,
  auctionDefaultFee: 13,
};

const ord1 = { actualShippingCost: 0, buyerShippingFee: 3000 };
const ord2 = { actualShippingCost: 0, buyerShippingFee: 0 };

console.log('Representative item shipping cost:', recalculateTest(ord1, settings, false, false, false));
console.log('Sub item shipping cost:', recalculateTest(ord2, settings, true, true, false));
