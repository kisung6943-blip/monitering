import { recalculateOrder } from '../src/dailyCalculatorUtils/calculator';
import { DEFAULT_SETTINGS } from '../src/dailyCalculatorData/initialData';
import { OrderItem } from '../src/dailyCalculatorTypes';

// Case 1: Gmarket order with no shipping fee, fee column missing
const order1: Partial<OrderItem> = {
  id: 'test-1',
  platform: 'gmarket',
  orderDate: '2026-08-18',
  orderNumber: 'ORD-1',
  productName: 'NHB 스텐 핸드드립 커피필터 커피드리퍼 (대만산)',
  optionName: '기본',
  quantity: 1,
  recipient: '고객',
  unitPrice: 17900,
  totalPrice: 17900,
  buyerShippingFee: 0,
  settlementAmount: 15573,
  feeAmount: undefined,
};

const res1 = recalculateOrder(order1 as OrderItem, DEFAULT_SETTINGS, false);
console.log('Case 1 (No Shipping):', {
  totalPrice: res1.totalPrice,
  settlementAmount: res1.settlementAmount,
  feeAmount: res1.feeAmount,
});

// Case 2: Gmarket order with shipping fee, raw settlement includes shipping
const order2: Partial<OrderItem> = {
  id: 'test-2',
  platform: 'gmarket',
  orderDate: '2026-08-18',
  orderNumber: 'ORD-2',
  productName: 'Test Product',
  optionName: '기본',
  quantity: 1,
  recipient: '고객',
  unitPrice: 10000,
  totalPrice: 10000,
  buyerShippingFee: 3000,
  settlementAmount: 11500, // 10000 (price) + 3000 (ship) - 1500 (fee)
  feeAmount: undefined,
};

const res2 = recalculateOrder(order2 as OrderItem, DEFAULT_SETTINGS, false);
console.log('Case 2 (With Shipping, settlement includes shipping):', {
  totalPrice: res2.totalPrice,
  settlementAmount: res2.settlementAmount,
  feeAmount: res2.feeAmount,
});
