import 'dotenv/config';
import { supabase } from '../src/supabase.ts';

async function check() {
  const { data: prods } = await supabase.from('products').select('*');
  console.log('Total products in Supabase products table:', prods?.length);
  if (prods && prods.length > 0) {
    console.log('Sample product 1:', prods[0]);
    console.log('Sample product 2:', prods[1]);
  }

  const { data: coupangProds } = await supabase.from('coupang_products').select('*');
  console.log('Total in coupang_products table:', coupangProds?.length);
  if (coupangProds && coupangProds.length > 0) {
    console.log('Sample coupang product 1:', coupangProds[0]);
  }
}

check().catch(console.error);
