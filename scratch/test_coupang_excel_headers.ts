import { parseExcelOrders } from '../src/dailyCalculatorUtils/excelParser';
import * as XLSX from 'xlsx';

async function testGyeoljae() {
  const header = ['주문일자', '상품명', '수량', '결재액', '수취인명', '배송비'];
  const row1 = ['2026-08-19', '휘슬러 프리미엄 압력솥 호환용 22cm 국산 패킹 부품', 1, 11000, '유한진', '무료'];
  const row2 = ['2026-08-19', 'WMF 압력밥솥부품 호환용 3종 부품세트', 1, 15000, '우수연', 2500];

  const ws = XLSX.utils.aoa_to_sheet([header, row1, row2]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

  const file = new File([buf], 'coupang_test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const result = await parseExcelOrders(file, 'coupang');
  console.log('Parsed Orders with 결재액 header:', result.orders.map(o => ({
    name: o.productName,
    totalPrice: o.totalPrice,
    feeRate: o.feeRate,
    feeAmount: o.feeAmount,
    settlementAmount: o.settlementAmount,
  })));
}

testGyeoljae();
