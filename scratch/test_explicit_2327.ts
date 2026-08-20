import { recalculateOrder } from '../src/dailyCalculatorUtils/calculator';
import { SettlementSettings, OrderItem } from '../src/dailyCalculatorTypes';

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

const sampleOrder: Partial<OrderItem> = {
  platform: 'gmarket',
  productName: 'NHB 스텐 핸드드립 커피필터 커피드리퍼 (대만산)',
  quantity: 1,
  unitPrice: 17900,
  totalPrice: 17900,
  buyerShippingFee: 2500,
  settlementAmount: 15573,
  feeAmount: 2327,
};

const result = recalculateOrder(sampleOrder, settings, false);
console.log('Result:', JSON.stringify(result, null, 2));
