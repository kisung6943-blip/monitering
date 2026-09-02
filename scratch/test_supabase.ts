import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mpaelpzhxyuxowlphrbb.supabase.co';
const supabaseAnonKey = 'sb_publishable_mnQBizZcqfJpJ0wluNNp1Q_2_GmfXEY';

async function test() {
  console.log("Initializing Supabase...");
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("Fetching products...");
  try {
    const result = await supabase.from("products").select("*");
    console.log("Result:", result);
  } catch (err) {
    console.error("Caught error:", err);
  }
}

test();
