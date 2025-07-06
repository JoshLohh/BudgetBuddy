export const CATEGORIES = [
  { label: 'Food', value: 'Food', icon: 'restaurant' },
  { label: 'Transportation', value: 'Transportation', icon: 'car' },
  { label: 'Accommodation', value: 'Accommodation', icon: 'bed' },
  { label: 'Entertainment', value: 'Entertainment', icon: 'game-controller' },
  { label: 'Utilities', value: 'Utilities', icon: 'flash' },
  { label: 'Shopping', value: 'Shopping', icon: 'cart' },
  { label: 'Others', value: 'Others', icon: 'ellipsis-horizontal' },
];

export const getCategoryIconName = (category: string) => {
  const found = CATEGORIES.find(c => c.value === category);
  return found?.icon || 'ellipsis-horizontal';
};
