import React from 'react';
import { FlatList, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';

export default function ExpenseList({
  expensesToShow,
  expensesLoading,
  hasMoreExpenses,
  showAllExpenses,
  setShowAllExpenses,
  getUsername,
}) {
  return (
    <View style={{ marginTop: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 4 }}>Expenses</ThemedText>
        {showAllExpenses && hasMoreExpenses ? (
          <TouchableOpacity onPress={() => setShowAllExpenses(false)}>
            <ThemedText style={{ color: '#1e88e5', fontWeight: 'bold' }}>See Less</ThemedText>
          </TouchableOpacity>
        ) : null}
      </View>
      {expensesLoading ? (
        <ActivityIndicator />
      ) : expensesToShow.length === 0 ? (
        <ThemedText style={{ color: '#aaa', fontStyle: 'italic', marginLeft: 4 }}>No expenses yet.</ThemedText>
      ) : (
        <FlatList
          data={expensesToShow}
          keyExtractor={item => item.$id}
          renderItem={({ item }) => (
            <ThemedView style={{
              backgroundColor: '#f2f2f2',
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
            }}>
              <ThemedText style={{ fontSize: 16, fontWeight: '600', marginBottom: 4, color: 'black' }}>{item.description}</ThemedText>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 13, color: '#888' }}>
                  Paid by: <ThemedText style={{ fontWeight: 'bold', color: '#444' }}>{getUsername(item.paidBy)}</ThemedText>
                </ThemedText>
                <ThemedText style={{ fontSize: 16, fontWeight: 'bold', color: '#1e88e5' }}>
                  ${parseFloat(item.amount).toFixed(2)}
                </ThemedText>
              </View>
            </ThemedView>
          )}
          style={{ marginTop: 8 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListFooterComponent={
            <>
              {!showAllExpenses && hasMoreExpenses ? (
                <ThemedButton onPress={() => setShowAllExpenses(true)} style={{ marginTop: 8, backgroundColor: 'grey' }}>
                  <ThemedText style={{ color: '#fff', textAlign: 'center' }}>See More</ThemedText>
                </ThemedButton>
              ) : null}
            </>
          }
        />
      )}
    </View>
  );
}
