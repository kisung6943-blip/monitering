import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mpaelpzhxyuxowlphrbb.supabase.co';
const supabaseAnonKey = 'sb_publishable_mnQBizZcqfJpJ0wluNNp1Q_2_GmfXEY';

async function test() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("Fetching all products...");
  const { data: products } = await supabase.from("products").select("*");
  console.log("Fetching all price_logs...");
  const { data: logs } = await supabase.from("price_logs").select("*");
  
  if (!products || !logs) {
    console.log("Failed to fetch products or logs.");
    return;
  }

  console.log(`Loaded ${products.length} products and ${logs.length} logs.`);
  
  // Let's check the first 10 products
  for (const prod of products.slice(0, 10)) {
    const prodLogs = logs.filter(l => l.productId === prod.id);
    console.log(`Product: "${prod.name}" (ID: ${prod.id})`);
    console.log(`  Logs count: ${prodLogs.length}`);
    if (prodLogs.length > 0) {
      console.log(`  Log dates:`, prodLogs.map(l => l.date));
      console.log(`  Log details (first 3):`, prodLogs.slice(0, 3).map(l => ({
        date: l.date,
        naverPrice: l.naverPrice,
        coupangPrice: l.coupangPrice
      })));
    }
  }
}

test();
