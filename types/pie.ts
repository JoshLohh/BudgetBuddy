export interface CategoryPieData {
  value: number;
  color: string;
  label: string;
  icon: string;
}

export interface MemberPieData {
  value: number;
  color: string;
  label: string;
  avatar: string | null;
}

export type PieDataItem = CategoryPieData | MemberPieData;
