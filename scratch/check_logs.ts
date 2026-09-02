import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mpaelpzhxyuxowlphrbb.supabase.co';
const supabaseAnonKey = 'sb_publishable_mnQBizZcqfJpJ0wluNNp1Q_2_GmfXEY';

async function test() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("Fetching price_logs count...");
  const { data: logs, error } = await supabase.from("price_logs").select("*");
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Total price logs count:", logs?.length);
  if (logs && logs.length > 0) {
    // Print dates and some samples
    const dates = Array.from(new Set(logs.map(l => l.date))).sort();
    console.log("Unique dates in price_logs:", dates);
    
    console.log("Sample logs (first 5):");
    console.log(logs.slice(0, 5).map(l => ({
      id: l.id,
      productId: l.productId,
      date: l.date,
      naverPrice: l.naverPrice,
      naverShipping: l.naverShipping,
      coupangPrice: l.coupangPrice,
      coupangShipping: l.coupangShipping,
    })));
  }
}

test();
