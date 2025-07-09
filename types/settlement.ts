export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export type Balances = Record<string, number>;
