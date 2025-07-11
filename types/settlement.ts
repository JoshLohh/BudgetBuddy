export interface Settlement {
  groupId: string;
  from: string;
  to: string;
  amount: number;
  $createdAt: string;
  $id: string;
}

export type Balances = Record<string, number>;
