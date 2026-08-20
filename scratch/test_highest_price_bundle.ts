import { OrderItem, SettlementSettings } from '../src/dailyCalculatorTypes';

const items: Partial<OrderItem>[] = [
  { id: '1', productName: '조개 실리콘 냄비 손잡이', buyerShippingFee: 0, totalPrice: 1536 },
  { id: '2', productName: 'NHB 파스타쿠커 전자레인지 메이커', buyerShippingFee: 0, totalPrice: 8536 },
];

// Test logic: find free shipping items, then pick the one with max totalPrice
const freeItems = items.map((item, idx) => ({ item, idx })).filter(x => (Number(x.item.buyerShippingFee) || 0) === 0);

let actualShippingRepIndex = 0;
if (freeItems.length > 0) {
  // Sort by totalPrice descending
  freeItems.sort((a, b) => (Number(b.item.totalPrice) || 0) - (Number(a.item.totalPrice) || 0));
  actualShippingRepIndex = freeItems[0].idx;
}

console.log('Selected rep index:', actualShippingRepIndex);
console.log('Selected rep item:', items[actualShippingRepIndex].productName);
