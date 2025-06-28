import React from 'react';
import { FlatList, View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
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
  expensesToShow: Expense[];
  expensesLoading: boolean;
  hasMoreExpenses: boolean;
  showAllExpenses: boolean;
  setShowAllExpenses: (show: boolean) => void;
  getUsername: (userId: string) => string;
}

const ExpenseList: React.FC<ExpenseListProps> = ({
  expensesToShow,
  expensesLoading,
  hasMoreExpenses,
  showAllExpenses,
  setShowAllExpenses,
  getUsername,
}) => (
  <ThemedView>
    <ThemedText style={styles.sectionTitle}>Expenses</ThemedText>
    {showAllExpenses && hasMoreExpenses ? (
      <ThemedButton onPress={() => setShowAllExpenses(false)} style={{ marginTop: 8 }}>
        <ThemedText>See Less</ThemedText>
      </ThemedButton>
    ) : null}
    {expensesLoading ? (
      <ActivityIndicator style={{ marginTop: 12 }} />
    ) : expensesToShow.length === 0 ? (
      <ThemedText>No expenses yet.</ThemedText>
    ) : (
      <FlatList
        data={expensesToShow}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <View style={styles.expenseRow}>
            <ThemedText>{item.description}</ThemedText>
            <ThemedText>
              Paid by: {getUsername(item.paidBy)}
            </ThemedText>
            <ThemedText>
              ${parseFloat(item.amount as string).toFixed(2)}
            </ThemedText>
          </View>
        )}
        style={{ marginTop: 8 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListFooterComponent={
          <>
            {!showAllExpenses && hasMoreExpenses ? (
              <TouchableOpacity onPress={() => setShowAllExpenses(true)} style={{ marginTop: 8, backgroundColor: 'grey' }}>
                <ThemedText style={{ color: '#fff', padding: 8 }}>See More</ThemedText>
              </TouchableOpacity>
            ) : null}
          </>
        }
      />
    )}
  </ThemedView>
);

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: 'bold', fontSize: 17, marginBottom: 4 },
  expenseRow: { marginBottom: 8, padding: 8, backgroundColor: '#f7f7f7', borderRadius: 8 },
});

export default ExpenseList;
