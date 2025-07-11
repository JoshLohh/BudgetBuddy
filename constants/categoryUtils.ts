import { Ionicons } from "@expo/vector-icons";

export const CATEGORIES = [
  { label: 'Food', value: 'Food', icon: 'restaurant' },
  { label: 'Transportation', value: 'Transportation', icon: 'car' },
  { label: 'Accommodation', value: 'Accommodation', icon: 'home' },
  { label: 'Entertainment', value: 'Entertainment', icon: 'film' },
  { label: 'Utilities', value: 'Utilities', icon: 'bulb' },
  { label: 'Shopping', value: 'Shopping', icon: 'cart' },
  { label: 'Others', value: 'Others', icon: 'ellipsis-horizontal' },
];

export const getCategoryIconName = (category: string) => {
  const found = CATEGORIES.find(c => c.value === category);
  return found?.icon || 'ellipsis-horizontal';
};

export type IoniconName = React.ComponentProps<typeof Ionicons>['name'];