import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { ExpensesProvider, useExpenses } from '@/contexts/ExpensesContext';
import { UserProvider } from '@/contexts/UserContext';
import { Text } from 'react-native';

// Mock Appwrite SDK as in your working UserContext test
jest.mock('@/lib/appwrite', () => ({
  databases: {
    listDocuments: jest.fn(() =>
      Promise.resolve({
        documents: [
          {
            $id: 'exp1',
            groupId: 'group1',
            amount: 50,
            description: 'Dinner',
            paidBy: 'user1',
            splitBetween: ['user1', 'user2'],
            splitType: 'equal',
            customSplit: '',
            category: 'Food',
            $createdAt: '2025-07-08T00:00:00Z',
          },
        ],
      })
    ),
    createDocument: jest.fn(() =>
      Promise.resolve({
        $id: 'exp2',
        groupId: 'group1',
        amount: 100,
        description: 'Lunch',
        paidBy: 'user1',
        splitBetween: ['user1', 'user2'],
        splitType: 'equal',
        customSplit: '',
        category: 'Food',
        $createdAt: '2025-07-08T01:00:00Z',
      })
    ),
  },
}));

function TestExpensesComponent({ groupId }: { groupId: string }) {
  const { expenses, loading, fetchExpenses, addExpense } = useExpenses();
  React.useEffect(() => {
    fetchExpenses(groupId);
  }, [groupId]);
  return (
    <>
      <Text testID="expense-count">{loading ? 'Loading...' : expenses.length}</Text>
      <Text
        testID="add-expense"
        onPress={async () => {
          await addExpense(
            groupId,
            100,
            'Lunch',
            'user1',
            ['user1', 'user2'],
            'equal',
            '',
            'Food'
          );
        }}
      >
        Add
      </Text>
    </>
  );
}

describe('ExpensesContext', () => {
  it('fetches expenses for a group', async () => {
    const { getByTestId } = render(
      <UserProvider>
        <ExpensesProvider>
          <TestExpensesComponent groupId="group1" />
        </ExpensesProvider>
      </UserProvider>
    );
    await waitFor(() => {
      expect(getByTestId('expense-count').props.children).toBe(1);
    });
  });

  it('adds a new expense', async () => {
    const { getByTestId } = render(
      <UserProvider>
        <ExpensesProvider>
          <TestExpensesComponent groupId="group1" />
        </ExpensesProvider>
      </UserProvider>
    );
    await waitFor(() => {
      expect(getByTestId('expense-count').props.children).toBe(1);
    });
    await act(async () => {
      getByTestId('add-expense').props.onPress();
    });
    await waitFor(() => {
      expect(getByTestId('expense-count').props.children).toBe(2);
    });
  });
});
