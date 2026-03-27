export enum Currency {
  USD = 'USD',
  CNY = 'CNY',
  JPY = 'JPY',
  EUR = 'EUR',
  GBP = 'GBP',
  HKD = 'HKD',
  TWD = 'TWD',
  VND = 'VND',
  THB = 'THB',
  PHP = 'PHP',
  SGD = 'SGD',
  AUD = 'AUD',
  CAD = 'CAD'
}

export type ExchangeRates = Record<string, number>;

export interface CostBreakdown {
  baseAmountForeign: number;
  baseAmountKRW: number;
  hiddenFeeKRW: number;
  forwardingFee: number;
  localShippingFeeKRW: number;
  duty: number;
  vat: number;
  shippingFee: number;
  additionalCost: number;
  totalCostKRW: number;
  unitCostKRW: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AdditionalCostItem {
  id: string;
  name: string;
  amount: number;
}
