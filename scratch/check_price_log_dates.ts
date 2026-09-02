import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mpaelpzhxyuxowlphrbb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mnQBizZcqfJpJ0wluNNp1Q_2_GmfXEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDates() {
  const { data, error } = await supabase.from('price_logs').select('date, created_at, productId, naverPrice, coupangPrice');
  if (error) {
    console.error('Error fetching price_logs:', error);
    return;
  }
  
  console.log(`Total price_logs in Supabase: ${data.length}`);
  
  const dateCounts: Record<string, number> = {};
  data.forEach((log) => {
    dateCounts[log.date] = (dateCounts[log.date] || 0) + 1;
  });
  
  console.log('Unique dates in Supabase price_logs:');
  Object.keys(dateCounts).sort().forEach((d) => {
    console.log(`Date ${d}: ${dateCounts[d]} logs`);
  });
}

checkDates().catch(console.error);
