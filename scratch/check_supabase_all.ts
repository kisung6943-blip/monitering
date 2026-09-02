import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mpaelpzhxyuxowlphrbb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mnQBizZcqfJpJ0wluNNp1Q_2_GmfXEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAllData() {
  console.log('--- Checking Supabase Tables ---');
  
  const tables = ['products', 'price_logs', 'cost_master', 'settlement_orders', 'daily_tasks'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*');
      
    if (error) {
      console.log(`Table '${table}': Error - ${error.message}`);
    } else {
      console.log(`Table '${table}': ${data?.length || 0} rows found`);
      if (data && data.length > 0) {
        console.log(`Sample row from '${table}':`, data[0]);
      }
    }
  }
}

checkAllData().catch(console.error);
