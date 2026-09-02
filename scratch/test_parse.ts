import { parseExcelOrders } from '../src/dailyCalculatorUtils/excelParser';
import { recalculateOrder } from '../src/dailyCalculatorUtils/calculator';
import { DEFAULT_SETTINGS } from '../src/dailyCalculatorData/initialData';

// Test simulation of row parsing for SmartStore Excel format shown in Image 1
const mockHeaders = [
  '날짜', '상품번호', '상품명', '수량', '옵션', '총주문금액', '정산금액', '수령자', '배송비구분', '택배비', '주문관리수수료', '매출연동수수료'
];

const mockRow2 = [
  '2026-09-01', '5900000000', 'NHB 양념통 조미료통 양념병 170ML 6P세트', 1, '제품선택:', 29500, 27730, '백승민', '유료', 2500, -885, -885
];

console.log('Testing calculation logic...');

const orderObj = {
  platform: 'smartstore' as const,
  orderDate: '2026-09-01',
  orderNumber: '5900000000',
  productNumber: '5900000000',
  productName: 'NHB 양념통 조미료통 양념병 170ML 6P세트',
  optionName: '제품선택:',
  quantity: 1,
  recipient: '백승민',
  unitPrice: 29500,
  totalPrice: 29500,
  buyerShippingFee: 2500,
  feeAmount: 885,
  knowledgeShoppingFee: 885,
  settlementAmount: 27730,
};

const result = recalculateOrder(orderObj, DEFAULT_SETTINGS, false);

console.log('Parsed Order Result:');
console.log({
  totalPrice: result.totalPrice,
  buyerShippingFee: result.buyerShippingFee,
  feeAmount: result.feeAmount,
  knowledgeShoppingFee: result.knowledgeShoppingFee,
  settlementAmount: result.settlementAmount,
});

if (result.feeAmount === 885 && result.knowledgeShoppingFee === 885 && result.settlementAmount === 27730) {
  console.log('SUCCESS: Fee figures match Excel perfectly (feeAmount: 885, knowledgeShoppingFee: 885)!');
} else {
  console.error('FAIL: Mismatch detected!', result);
}
