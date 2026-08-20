import 'dotenv/config';
import { INITIAL_PRODUCTS } from '../src/data/mockData.ts';
import { ProductMaster } from '../src/types.ts';

const mergeAllProductSources = (...sources: any[][]): ProductMaster[] => {
  const map = new Map<string, ProductMaster>();

  const initialByName = new Map<string, ProductMaster>();
  INITIAL_PRODUCTS.forEach((p) => {
    if (p.name) initialByName.set(p.name.trim(), p);
  });

  sources.forEach((list) => {
    if (Array.isArray(list)) {
      list.forEach((p) => {
        if (p && p.name) {
          const trimmedName = p.name.trim();
          const id = p.id || `prod-${trimmedName}`;
          const existingById = map.get(id);
          const existingByName = Array.from(map.values()).find((item) => item.name === trimmedName);
          const existing = existingById || existingByName;

          const initialMatch = initialByName.get(trimmedName);

          const supplyPrice =
            existing && existing.supplyPrice > 0
              ? existing.supplyPrice
              : typeof p.supplyPrice === 'number' && p.supplyPrice > 0
              ? p.supplyPrice
              : initialMatch?.supplyPrice || 10000;

          const unitCost =
            existing && existing.unitCost > 0
              ? existing.unitCost
              : typeof p.unitCost === 'number' && p.unitCost > 0
              ? p.unitCost
              : initialMatch?.unitCost || 4000;

          const commissionRate =
            typeof p.commissionRate === 'number'
              ? p.commissionRate
              : existing?.commissionRate ?? initialMatch?.commissionRate ?? 10.8;

          const defaultOtherFee =
            typeof p.defaultOtherFee === 'number'
              ? p.defaultOtherFee
              : existing?.defaultOtherFee ?? initialMatch?.defaultOtherFee ?? 0;

          const item: ProductMaster = {
            id: existing ? existing.id : id,
            sku: p.sku || existing?.sku || initialMatch?.sku || `SKU-${id}`,
            name: trimmedName,
            category: p.category || existing?.category || initialMatch?.category || '주방용품',
            supplyPrice,
            unitCost,
            commissionRate,
            defaultOtherFee,
          };
          map.set(item.id, item);
        }
      });
    }
  });

  return Array.from(map.values());
};

const fakeStorageData = [
  { id: 'custom-1', name: 'NHB 앤틱 접시꽂이', supplyPrice: 12500, unitCost: 6000 },
];

const result = mergeAllProductSources(INITIAL_PRODUCTS, fakeStorageData);
console.log('Sample merged results:');
result.slice(0, 10).forEach((p) => {
  console.log(`- [${p.name}]: 매입가 ${p.supplyPrice}원, 제조원가 ${p.unitCost}원`);
});
