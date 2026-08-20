import { OrderItem } from '../src/dailyCalculatorTypes';

const itemsCaseA: Partial<OrderItem>[] = [
  { id: '1', productName: 'bormioli 보르미올리 콰트로 뚜껑 대 86mm 1p', buyerShippingFee: 3000, totalPrice: 1980 },
  { id: '2', productName: 'bormioli 보르미올리 콰트로 뚜껑 중 70mm 1p', buyerShippingFee: 0, totalPrice: 3160 },
];

function selectRepIndex(groupItems: Partial<OrderItem>[]): number {
  const paidItems = groupItems
    .map((item, idx) => ({ item, idx }))
    .filter((x) => (Number(x.item.buyerShippingFee) || 0) > 0);

  if (paidItems.length > 0) {
    // Sort by buyerShippingFee descending, then totalPrice descending
    paidItems.sort((a, b) => {
      const feeDiff = (Number(b.item.buyerShippingFee) || 0) - (Number(a.item.buyerShippingFee) || 0);
      if (feeDiff !== 0) return feeDiff;
      return (Number(b.item.totalPrice) || 0) - (Number(a.item.totalPrice) || 0);
    });
    return paidItems[0].idx;
  }

  const freeItems = groupItems
    .map((item, idx) => ({ item, idx }))
    .filter((x) => (Number(x.item.buyerShippingFee) || 0) === 0);

  if (freeItems.length > 0) {
    freeItems.sort((a, b) => (Number(b.item.totalPrice) || 0) - (Number(a.item.totalPrice) || 0));
    return freeItems[0].idx;
  }

  return 0;
}

console.log('Case A (Paid 3000 vs Free 0):');
const repA = selectRepIndex(itemsCaseA);
console.log('Selected rep index:', repA);
console.log('Selected rep item:', itemsCaseA[repA].productName);
