export interface CostMasterItem {
  id: string;
  productName: string;
  optionName: string;
  cost: number;
  supplyPrice: number;
  vat: number;
  memo?: string;
  updatedAt: string;
}

export type PlatformType = 'smartstore' | 'coupang' | 'todayhouse' | 'jasamall' | 'elevenst' | 'gmarket' | 'auction';

export interface PlatformConfig {
  id: PlatformType;
  name: string;
  defaultFeeRate: number;
  color: string;
}

export interface SettlementOrder {
  id: string;
  platform: PlatformType;
  orderDate: string;
  settlementDate?: string;
  productName: string;
  optionName: string;
  quantity: number;
  salesAmount: number;
  feeAmount: number;
  settlementAmount: number;
  costPerUnit: number;
  totalCost: number;
  adSpend: number;
  netProfit: number;
  marginRate: number;
  status: 'pending' | 'completed';
  rawExcelData?: Record<string, any>;
}

export interface DailyAdSpend {
  id: string;
  date: string;
  platform: PlatformType;
  amount: number;
}

export interface GlobalSettings {
  vatIncludedInCost: boolean;
  corporateTaxRate: number;
  defaultVatRate: number;
}
