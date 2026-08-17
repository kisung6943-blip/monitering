export const getDeletedProductIds = (): Set<string> => {
  try {
    const saved1 = localStorage.getItem('coupang_deleted_product_ids');
    const saved2 = localStorage.getItem('price_monitor_deleted_product_ids');
    const combined = [
      ...(saved1 ? JSON.parse(saved1) : []),
      ...(saved2 ? JSON.parse(saved2) : []),
    ];
    return new Set(combined);
  } catch (e) {}
  return new Set();
};

export const getDeletedProductNames = (): Set<string> => {
  try {
    const saved1 = localStorage.getItem('coupang_deleted_product_names');
    const saved2 = localStorage.getItem('price_monitor_deleted_product_names');
    const combined = [
      ...(saved1 ? JSON.parse(saved1) : []),
      ...(saved2 ? JSON.parse(saved2) : []),
    ];
    return new Set(combined);
  } catch (e) {}
  return new Set();
};

export const extractNameVariants = (name: string): string[] => {
  if (!name) return [];
  const trimmed = name.trim();
  const variants = new Set<string>();
  variants.add(trimmed);

  // Extract base prefix before '(' or ','
  const parts = trimmed.split(/[\(\,]/);
  if (parts.length > 1 && parts[0].trim().length >= 4) {
    variants.add(parts[0].trim());
  }
  return Array.from(variants);
};

export const saveDeletedProduct = (id: string, name?: string) => {
  const ids = getDeletedProductIds();
  if (id) ids.add(id);
  const idsArr = Array.from(ids);
  localStorage.setItem('coupang_deleted_product_ids', JSON.stringify(idsArr));
  localStorage.setItem('price_monitor_deleted_product_ids', JSON.stringify(idsArr));

  if (name && name.trim()) {
    const names = getDeletedProductNames();
    const variants = extractNameVariants(name);
    variants.forEach((v) => names.add(v));
    const namesArr = Array.from(names);
    localStorage.setItem('coupang_deleted_product_names', JSON.stringify(namesArr));
    localStorage.setItem('price_monitor_deleted_product_names', JSON.stringify(namesArr));
  }
};

export const unblacklistProduct = (id?: string, name?: string) => {
  if (id) {
    const ids = getDeletedProductIds();
    ids.delete(id);
    const idsArr = Array.from(ids);
    localStorage.setItem('coupang_deleted_product_ids', JSON.stringify(idsArr));
    localStorage.setItem('price_monitor_deleted_product_ids', JSON.stringify(idsArr));
  }
  if (name && name.trim()) {
    const names = getDeletedProductNames();
    const variants = extractNameVariants(name);
    const variantLowers = variants.map((v) => v.toLowerCase());

    for (const n of Array.from(names)) {
      const nLower = n.trim().toLowerCase();
      if (variantLowers.some((v) => v === nLower || nLower.includes(v) || v.includes(nLower))) {
        names.delete(n);
      }
    }
    const namesArr = Array.from(names);
    localStorage.setItem('coupang_deleted_product_names', JSON.stringify(namesArr));
    localStorage.setItem('price_monitor_deleted_product_names', JSON.stringify(namesArr));
  }
};

export const isProductDeleted = (id?: string, name?: string): boolean => {
  const deletedIds = getDeletedProductIds();
  const deletedNames = getDeletedProductNames();

  if (id && deletedIds.has(id)) return true;

  if (name && name.trim()) {
    const trimmed = name.trim().toLowerCase();

    for (const dName of deletedNames) {
      const dLower = dName.trim().toLowerCase();
      if (!dLower) continue;

      if (trimmed === dLower) return true;

      // Substring match for product names with at least 4 characters
      if (dLower.length >= 4 && trimmed.length >= 4) {
        if (trimmed.includes(dLower) || dLower.includes(trimmed)) return true;
      }
    }
  }

  return false;
};
