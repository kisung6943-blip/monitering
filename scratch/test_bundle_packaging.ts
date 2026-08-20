import { recalculateOrder } from '../src/dailyCalculatorUtils/calculator';
import { DEFAULT_SETTINGS } from '../src/dailyCalculatorData/initialData';
import { OrderItem } from '../src/dailyCalculatorTypes';

const hp2: Partial<OrderItem> = {
  id: 'hp-2',
  platform: 'homepage',
  orderDate: '2026-08-12',
  orderNumber: 'HP20260812-001',
  productName: 'WMF 압력솥 계기 고무패킹(신형)',
  optionName: '신형',
  quantity: 1,
  recipient: '윤민정',
  unitPrice: 14000,
  totalPrice: 14000,
  buyerShippingFee: 0,
  feeRate: 3.85,
  feeAmount: 539,
  settlementAmount: 13461,
  unitCost: 7500,
  totalCost: 7500,
  packagingCost: 0,
  actualShippingCost: 0,
  isBundleShipping: true,
  bundleGroupId: 'HP-BUNDLE-윤민정',
};

const hp3: Partial<OrderItem> = {
  id: 'hp-3',
  platform: 'homepage',
  orderDate: '2026-08-12',
  orderNumber: 'HP20260812-001',
  productName: '호환 WMF압력밥솥패킹 부품 고무패킹 22cm',
  optionName: '22cm',
  quantity: 2,
  recipient: '윤민정',
  unitPrice: 4000,
  totalPrice: 8000,
  buyerShippingFee: 0,
  feeRate: 3.85,
  feeAmount: 308,
  settlementAmount: 7692,
  unitCost: 2000,
  totalCost: 4000,
  packagingCost: 0,
  actualShippingCost: 0,
  isBundleShipping: true,
  bundleGroupId: 'HP-BUNDLE-윤민정',
};

console.log('hp-2:', recalculateOrder(hp2, DEFAULT_SETTINGS, true));
console.log('hp-3:', recalculateOrder(hp3, DEFAULT_SETTINGS, true));
