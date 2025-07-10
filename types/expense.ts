export interface Expense {
  amount: number | string;
  paidBy: string;
  splitBetween: string[];   // user IDs
  splitType: 'equal' | 'exact' | 'percentage';
  customSplit?: string;   // JSON string: { [userId]: number }
  description?: string;
  groupId?: string;
  category?: string;
  createdAt?: string;
  $id?: string;
}