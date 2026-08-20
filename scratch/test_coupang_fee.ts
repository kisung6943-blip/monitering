import { OrderItem, SettlementSettings } from '../src/dailyCalculatorTypes';
import { getPlatformFeeRate } from '../src/dailyCalculatorUtils/calculator';

function recalculateCoupang(order: Partial<OrderItem>, settings: SettlementSettings): OrderItem {
  const platform = 'coupang';
  const quantity = Math.max(1, Number(order.quantity) || 1);
  const unitPrice = Number(order.unitPrice) || 0;
  const totalPrice = order.totalPrice !== undefined ? Number(order.totalPrice) : unitPrice * quantity;
  const buyerShippingFee = Number(order.buyerShippingFee) || 0;

  let feeRate = getPlatformFeeRate(platform, order.productName || '', settings);
  let feeAmount = 0;
  let settlementAmount = 0;

  if (order.settlementAmount && Number(order.settlementAmount) > 0) {
    settlementAmount = Math.abs(Number(order.settlementAmount));
    feeAmount = Math.max(0, totalPrice - settlementAmount);
    feeRate = totalPrice > 0 ? Math.round((feeAmount / totalPrice) * 1000) / 10 : feeRate;
  } else if (order.feeAmount && Number(order.feeAmount) > 0) {
    feeAmount = Math.abs(Number(order.feeAmount));
    settlementAmount = Math.max(0, totalPrice - feeAmount);
    feeRate = totalPrice > 0 ? Math.round((feeAmount / totalPrice) * 1000) / 10 : feeRate;
  } else {
    feeRate = getPlatformFeeRate(platform, order.productName || '', settings);
    feeAmount = Math.round(totalPrice * (feeRate / 100));
    settlementAmount = totalPrice - feeAmount;
  }

  return {
    ...order,
    feeRate,
    feeAmount,
    settlementAmount,
  } as OrderItem;
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

const test1: Partial<OrderItem> = {
  platform: 'coupang',
  productName: '휘슬러 프리미엄 압력솥 호환용 22cm 국산 패킹 부품',
  totalPrice: 2000,
  unitPrice: 2000,
  feeAmount: 0,
  settlementAmount: 0,
};

const test2: Partial<OrderItem> = {
  platform: 'coupang',
  productName: '경기미 햅쌀 10kg',
  totalPrice: 20000,
  unitPrice: 20000,
  feeAmount: 0,
  settlementAmount: 0,
};

console.log('General item (zero fee input):', recalculateCoupang(test1, settings));
console.log('Rice item (zero fee input):', recalculateCoupang(test2, settings));
