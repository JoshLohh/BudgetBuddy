import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';

type Expense = {
  $id: string;
  description: string;
  paidBy: string;
  amount: number | string;
};

interface ExpenseListProps {
  expenses: Expense[];
  expensesLoading: boolean;
  showAllExpenses: boolean;
  setShowAllExpenses: (show: boolean) => void;
  getUsername: (userId: string) => string;
}

const EXPENSES_PREVIEW_COUNT = 5;

const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses = [],
  expensesLoading,
  showAllExpenses,
  setShowAllExpenses,
  getUsername,
}) => {
  const router = useRouter();
  const { groupId } = useLocalSearchParams();

  // Determine which expenses to show
  const hasMoreExpenses = expenses.length > EXPENSES_PREVIEW_COUNT;
  const expensesToShow = showAllExpenses
    ? expenses
    : expenses.slice(0, EXPENSES_PREVIEW_COUNT);

  return (
    <View style={{ marginTop: 18 }}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.sectionTitle}>Expenses</ThemedText>
        {showAllExpenses && hasMoreExpenses ? (
          <TouchableOpacity onPress={() => setShowAllExpenses(false)} style={{ marginTop: 8 }}>
            <ThemedText style={{ color: '#1e88e5', fontWeight: 'bold' }}>See Less</ThemedText>
          </TouchableOpacity>
        ) : null}
      </View>
      {expensesLoading ? (
        <ActivityIndicator />
      ) : expensesToShow.length === 0 ? (
        <ThemedText style={{ color: '#aaa', fontStyle: 'italic', marginLeft: 4 }}>
          No expenses yet.
        </ThemedText>
      ) : (
        <>
          {expensesToShow.map(item => (
            <TouchableOpacity
              key={item.$id}
              onPress={() =>
                router.push({
                  pathname: '/group/[groupId]/expense/[expenseId]',
                  params: { groupId, expenseId: item.$id },
                })
              }
              style={styles.expenseTouchable}
            >
              <ThemedView style={styles.expenseRow}>
                <ThemedText style={styles.expenseDescription}>
                  {item.description}
                </ThemedText>
                <View style={styles.expenseInfoRow}>
                  <ThemedText style={styles.expensePaidBy}>
                    Paid by:{' '}
                    <ThemedText style={styles.expensePaidByName}>
                      {getUsername(item.paidBy)}
                    </ThemedText>
                  </ThemedText>
                  <ThemedText style={styles.expenseAmount}>
                    ${parseFloat(item.amount as string).toFixed(2)}
                  </ThemedText>
                </View>
              </ThemedView>
            </TouchableOpacity>
          ))}
          {!showAllExpenses && hasMoreExpenses ? (
            <ThemedButton
              onPress={() => setShowAllExpenses(true)}
              style={{ marginTop: 8, backgroundColor: 'grey' }}
            >
              <ThemedText style={{ color: '#fff', textAlign: 'center' }}>
                See More
              </ThemedText>
            </ThemedButton>
          ) : null}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  expenseTouchable: {
    marginBottom: 8,
  },
  expenseRow: {
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 12,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: 'black',
  },
  expenseInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expensePaidBy: {
    fontSize: 13,
    color: '#888',
  },
  expensePaidByName: {
    fontWeight: 'bold',
    color: '#444',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e88e5',
  },
});

export default ExpenseList;
