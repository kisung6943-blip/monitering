import * as XLSX from 'xlsx';
import { parseExcelOrders } from '../src/dailyCalculatorUtils/excelParser';
import { SettlementSettings } from '../src/dailyCalculatorTypes';

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

// Create a mock Gmarket Excel file
const headers = [
  '날짜', '상품번호', '상품명', '수량', '옵션', '추가구성', '판매금액', '정산금액', '수령자', '배송비구분', '택배배송비', '서비스이용료', '판매자쿠폰할인'
];

const rows = [
  headers,
  ['08월 18일', '7.74E+08', 'NHB 스텐 핸드드립 커피필터 커피드리퍼 (대만산)', 1, '기본', '', 17900, 15573, '정혜영', '선불', 2500, 2327, 0]
];

const ws = XLSX.utils.aoa_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

const file = {
  arrayBuffer: () => Promise.resolve(buf),
  name: 'gmarket_test.xlsx',
} as any;

parseExcelOrders(file, undefined, settings).then(res => {
  console.log('Detected platform:', res.detectedPlatform);
  console.log('Parsed Orders:', JSON.stringify(res.orders, null, 2));
}).catch(err => {
  console.error(err);
});
