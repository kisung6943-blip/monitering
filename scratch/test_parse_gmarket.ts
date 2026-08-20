import { detectPlatformFromHeaders } from '../src/dailyCalculatorUtils/excelParser';

const headers = [
  '날짜', '상품번호', '상품명', '수량', '옵션', '추가구성', '판매금액', '정산금액', '수령자', '배송비구분', '택배배송비', '서비스이용료', '판매자쿠폰할인'
];

console.log('Detected Platform:', detectPlatformFromHeaders(headers));

const getColIdx = (keywords: string[], excludeKeywords: string[] = []): number => {
  for (const kw of keywords) {
    const cleanKw = kw.replace(/\s+/g, '').toLowerCase();
    const idx = headers.findIndex((h) => {
      if (typeof h !== 'string' || !h.trim()) return false;
      const cleanH = h.replace(/\s+/g, '').toLowerCase();

      // Skip if header matches any exclusion keyword
      if (excludeKeywords.some((ex) => cleanH.includes(ex.replace(/\s+/g, '').toLowerCase()))) {
        return false;
      }

      return cleanH.includes(cleanKw);
    });
    if (idx !== -1) return idx;
  }
  return -1;
};

const dateIdx = getColIdx(['날짜', '주문일시', '결제일시', '주문일자', '결제일자', '주문일', '결제일', '발송일', '일자']);
const orderNoIdx = getColIdx(
  ['상품주문번호', '주문번호', '주문ID', 'OrderNo', '주문 번호', '구매번호', '결제번호'],
  ['상품번호', '상품코드']
);
const productNoIdx = getColIdx(
  ['상품번호', '상품코드', '옵션ID', '품목코드', '상품 ID'],
  ['상품명', '주문번호', '상품주문번호', '상품결제금액']
);
const productIdx = getColIdx(
  ['상품명', '품목명', '주문상품명', '주문상품', '상품 이름', '품목'],
  ['상품번호', '상품주문번호', '상품코드', '옵션ID', '상품금액', '상품결제금액', '상품단가', '수량']
);
const optionIdx = getColIdx(['옵션정보', '선택옵션', '옵션명', '옵션 세부', '옵션'], ['옵션id']);
const qtyIdx = getColIdx(['수량', '구매수량', '수량(개)', '구매 수량']);
const recipientIdx = getColIdx(['수취인명', '수취인', '수령인', '수령자', '구매자명', '구매자', '고객명', '받는사람', '받는분']);
const priceIdx = getColIdx(
  ['상품결제금액', '결제금액', '판매가', '판매금액', '주문금액', '상품금액', '총상품구매금액', '공급가', '총결제금액'],
  ['수수료', '단가']
);
const unitPriceIdx = getColIdx(['개별단가', '단가', '옵션+판매가', '옵션+판매', '상품단가'], ['원가']);
const shippingIdx = getColIdx(
  [
    '택배비',
    '배송비 합계',
    '배송비 금액',
    '배송비금액',
    '총배송비',
    '총 배송비',
    '고객배송비',
    '배송비2',
    '선결제배송비',
    '선결제 배송비',
    '정산배송비',
    '고객부담배송비',
    '배송비',
    '택배',
  ],
  [
    '배송비 형태',
    '배송비유형',
    '배송비종류',
    '배송비구분',
    '배송비조건',
    '배송조건',
    '배송비 속성',
    '배송비 결제방식',
    '배송비결제방식',
    '배송비결제',
    '택배사',
  ]
);
const feeIdx = getColIdx(
  ['결제수수료', '수수료합계', '수수료', '수수료1', '수수료합', '중개수수료', '네이버페이 수수료', '서비스이용료', '서비스이용수수료', '이용료', '공제금액', '공제합계'],
  ['송장', '배송비', '정산', '쿠폰']
);
const settlementIdx = getColIdx(
  ['정산금액', '정산예정금액', '정산금액합계', '송금금액', '실정산금액', '정산합계', '정산가'],
  ['수수료', '단가', '배송비']
);

console.log('Indices:');
console.log('dateIdx:', dateIdx);
console.log('orderNoIdx:', orderNoIdx);
console.log('productNoIdx:', productNoIdx);
console.log('productIdx:', productIdx);
console.log('optionIdx:', optionIdx);
console.log('qtyIdx:', qtyIdx);
console.log('recipientIdx:', recipientIdx);
console.log('priceIdx:', priceIdx);
console.log('shippingIdx:', shippingIdx);
console.log('feeIdx:', feeIdx);
console.log('settlementIdx:', settlementIdx);
