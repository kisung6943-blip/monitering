import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mpaelpzhxyuxowlphrbb.supabase.co';
const supabaseAnonKey = 'sb_publishable_mnQBizZcqfJpJ0wluNNp1Q_2_GmfXEY';

async function test() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("Fetching all price_logs...");
  const { data: logs, error } = await supabase.from("price_logs").select("*");
  if (error || !logs) {
    console.error("Error fetching logs:", error);
    return;
  }

  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const logsByProduct: { [id: string]: any[] } = {};
  sortedLogs.forEach(log => {
    if (!logsByProduct[log.productId]) {
      logsByProduct[log.productId] = [];
    }
    logsByProduct[log.productId].push(log);
  });

  const logsToUpsert: any[] = [];

  for (const productId in logsByProduct) {
    const prodLogs = logsByProduct[productId];
    let lastKnownNaverPrice = 0;
    let lastKnownNaverShipping = 0;
    let lastKnownCoupangPrice = 0;
    let lastKnownCoupangShipping = 0;
    let lastKnownCoupangSeller = "";

    for (const log of prodLogs) {
      if (log.naverPrice > 0) {
        lastKnownNaverPrice = log.naverPrice;
        lastKnownNaverShipping = log.naverShipping;
      }
      if (log.coupangPrice > 0) {
        lastKnownCoupangPrice = log.coupangPrice;
        lastKnownCoupangShipping = log.coupangShipping;
        lastKnownCoupangSeller = log.coupangSeller;
      }

      const needsNaverRestore = log.naverPrice === 0 && lastKnownNaverPrice > 0;
      const needsCoupangRestore = log.coupangPrice === 0 && lastKnownCoupangPrice > 0;

      if (needsNaverRestore || needsCoupangRestore) {
        const updatedLog = { ...log };
        if (needsNaverRestore) {
          updatedLog.naverPrice = lastKnownNaverPrice;
          updatedLog.naverShipping = lastKnownNaverShipping;
          updatedLog.naverTotal = lastKnownNaverPrice + lastKnownNaverShipping;
        }
        if (needsCoupangRestore) {
          updatedLog.coupangPrice = lastKnownCoupangPrice;
          updatedLog.coupangShipping = lastKnownCoupangShipping;
          updatedLog.coupangSeller = lastKnownCoupangSeller;
          updatedLog.coupangTotal = lastKnownCoupangPrice + lastKnownCoupangShipping;
        }
        updatedLog.difference = updatedLog.naverTotal - updatedLog.coupangTotal;
        logsToUpsert.push(updatedLog);
      }
    }
  }

  console.log(`Prepared ${logsToUpsert.length} updates.`);
  if (logsToUpsert.length > 0) {
    console.log("Upserting to Supabase...");
    const { data, error: upsertError } = await supabase.from("price_logs").upsert(logsToUpsert);
    if (upsertError) {
      console.error("Upsert error:", upsertError);
    } else {
      console.log("Successfully restored all price log entries!");
    }
  }
}

test();
