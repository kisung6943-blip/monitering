import 'dotenv/config';
import { supabase } from '../src/supabase.ts';

async function restore() {
  const productId = 'prod-1785412875494';
  const keywords = ['스퀴지', '욕실스퀴지', '물기제거스퀴지', '미니스퀴지', '유리스퀴지', '바닥스퀴지'];

  const { data: prod, error: prodErr } = await supabase.from('products').select('*').eq('id', productId).single();
  if (prod) {
    const updatedProd = { ...prod, keywords };
    const { error: uErr } = await supabase.from('products').upsert(updatedProd);
    console.log('Product updated:', updatedProd.name, uErr ? uErr : 'SUCCESS');
  } else {
    console.log('Product not found:', prodErr);
  }

  const logId = `log-${productId}-2026-08-06`;
  const todayLog = {
    id: logId,
    date: '2026-08-06',
    productId: productId,
    naverPrice: 4500,
    naverShipping: 2500,
    naverTotal: 7000,
    coupangSeller: '',
    coupangPrice: 0,
    coupangShipping: 0,
    coupangTotal: 0,
    difference: 7000,
    keywordRanks: ['35', '91', '73', '', '81', ''],
    coupangKeywordRanks: ['', '', '', '', '', ''],
    memo: ''
  };

  const { error: logErr } = await supabase.from('price_logs').upsert(todayLog);
  console.log('Today log updated:', todayLog.date, logErr ? logErr : 'SUCCESS');
}

restore().catch(console.error);
