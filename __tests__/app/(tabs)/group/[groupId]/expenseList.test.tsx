/**
 * Test suite for ExpenseList component
 * Covers rendering states: loading, empty, preview/full expense lists,
 * username fetching with mock Appwrite backend,
 * navigation on expense press, and edge cases.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ExpenseList from '@/app/(tabs)/group/[groupId]/expenseList';
import { databases } from '@/lib/appwrite';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Mock Expo router hooks
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

// Mock Appwrite databases.listDocuments
jest.mock('@/lib/appwrite', () => ({
  databases: {
    listDocuments: jest.fn(),
  },
}));

// Sample expense data
const sampleExpenses = [
    {
      $id: '1',
      description: 'Lunch',
      amount: 20,
      paidBy: 'user1',
      splitBetween: ['user1', 'user2'],
      splitType: 'equal' as const,
      groupId: 'group1',
      $createdAt: '2025-07-25T10:00:00Z',
    },
    {
      $id: '2',
      description: 'Taxi',
      amount: 15,
      paidBy: 'user2',
      splitBetween: ['user1', 'user2'],
      splitType: 'equal' as const,
      groupId: 'group1',
      $createdAt: '2025-07-26T12:00:00Z',
    },
    {
      $id: '3',
      description: 'Groceries',
      amount: 40,
      paidBy: 'user3',
      splitBetween: ['user1', 'user3'],
      splitType: 'equal' as const,
      groupId: 'group1',
      $createdAt: '2025-07-27T09:00:00Z',
    },
    {
      $id: '4',
      description: 'Restaurant',
      amount: 30,
      paidBy: 'user1',
      splitBetween: ['user2', 'user3'],
      splitType: 'equal' as const,
      groupId: 'group1',
      $createdAt: '2025-07-28T13:00:00Z',
    },
    {
      $id: '5',
      description: 'Hotel',
      amount: 100,
      paidBy: 'user2',
      splitBetween: ['user1'],
      splitType: 'equal' as const,
      groupId: 'group1',
      $createdAt: '2025-07-29T11:00:00Z',
    },
    {
      $id: '6',
      description: 'Movie',
      amount: 12,
      paidBy: 'user3',
      splitBetween: ['user2'],
      splitType: 'equal' as const,
      groupId: 'group1',
      $createdAt: '2025-07-30T15:00:00Z',
    },
  ];
  
// Helper to mock username fetching
const mockUserMap = {
  user1: 'Alice',
  user2: 'Bob',
};

describe('ExpenseList Component', () => {
  const pushMock = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'group1' });
    (databases.listDocuments as jest.Mock).mockImplementation(({}) => {
      return Promise.resolve({
        documents: [
          { $id: 'user1', username: 'Alice' },
          { $id: 'user2', username: 'Bob' },
        ],
      });
    });
    jest.clearAllMocks();
  });

  it('renders loading indicator when expensesLoading is true', () => {
    const { getByTestId } = render(
      <ExpenseList
        expenses={[]}
        expensesLoading={true}
        showAllExpenses={false}
        setShowAllExpenses={jest.fn()}
      />,
    );
    expect(getByTestId('expenses-loading')).toBeTruthy();
  });

  it('renders no expenses message when expenses is empty and not loading', () => {
    const { getByText } = render(
      <ExpenseList
        expenses={[]}
        expensesLoading={false}
        showAllExpenses={false}
        setShowAllExpenses={jest.fn()}
      />,
    );
    expect(getByText('No expenses yet.')).toBeTruthy();
  });

  // Sample updated expenses data with >=6 items as recommended previously...

it('renders expenses in descending order by $createdAt and shows limited preview', async () => {
    const setShowAllExpensesMock = jest.fn();
    const { getByText, queryByText, getAllByText } = render(
      <ExpenseList
        expenses={sampleExpenses}
        expensesLoading={false}
        showAllExpenses={false}
        setShowAllExpenses={setShowAllExpensesMock}
      />,
    );
  
    await waitFor(() => {
      expect(getByText('Movie')).toBeTruthy();
      expect(getByText('Taxi')).toBeTruthy();
    });
  
    expect(queryByText('See More')).toBeTruthy();
  
    // Verify Taxi appears before Lunch
    const descriptions = getAllByText(/./)
      .map(node => node.props.children)
      .filter(text => typeof text === 'string');
    const taxiIndex = descriptions.indexOf('Movie');
    const lunchIndex = descriptions.indexOf('Taxi');
    expect(taxiIndex).toBeLessThan(lunchIndex);
  });
  

  it('toggles showing all expenses when See More / See Less is pressed', () => {
    const setShowAllExpensesMock = jest.fn();
    const { getByText, rerender } = render(
      <ExpenseList
        expenses={sampleExpenses}
        expensesLoading={false}
        showAllExpenses={false}
        setShowAllExpenses={setShowAllExpensesMock}
      />,
    );

    const seeMoreBtn = getByText('See More');
    fireEvent.press(seeMoreBtn);
    expect(setShowAllExpensesMock).toHaveBeenCalledWith(true);

    // Rerender with showAllExpenses true
    rerender(
      <ExpenseList
        expenses={sampleExpenses}
        expensesLoading={false}
        showAllExpenses={true}
        setShowAllExpenses={setShowAllExpensesMock}
      />,
    );

    const seeLessBtn = getByText('See Less');
    fireEvent.press(seeLessBtn);
    expect(setShowAllExpensesMock).toHaveBeenCalledWith(false);
  });

  it('navigates to expense details on expense press', async () => {
    const { getByText } = render(
      <ExpenseList
        expenses={sampleExpenses}
        expensesLoading={false}
        showAllExpenses={true}
        setShowAllExpenses={jest.fn()}
      />,
    );

    // Wait for username map update
    await waitFor(() => {
      expect(getByText('Lunch')).toBeTruthy();
    });

    fireEvent.press(getByText('Lunch'));
    expect(pushMock).toHaveBeenCalledWith({
      pathname: '/group/[groupId]/expense/[expenseId]',
      params: { groupId: 'group1', expenseId: '1' },
    });
  });

  it('displays "Unknown User" if username is missing or fetch fails', async () => {
    // Overwrite listDocuments mock to simulate failure
    (databases.listDocuments as jest.Mock).mockRejectedValue(new Error('Network error'));

    const expensesWithUnknownUser = [
      {
        ...sampleExpenses[0],
        paidBy: 'unknownUser',
      },
    ];

    const { getByText } = render(
      <ExpenseList
        expenses={expensesWithUnknownUser}
        expensesLoading={false}
        showAllExpenses={true}
        setShowAllExpenses={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(getByText('Unknown User')).toBeTruthy();
    });
  });

  // Optionally add a snapshot test here for the whole component
  it('matches snapshot with preview expenses', () => {
    const setShowAllExpensesMock = jest.fn();
    const tree = render(
      <ExpenseList
        expenses={sampleExpenses}
        expensesLoading={false}
        showAllExpenses={false}
        setShowAllExpenses={setShowAllExpensesMock}
      />,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
  
  it('matches snapshot with full expenses list', () => {
    const setShowAllExpensesMock = jest.fn();
    const tree = render(
      <ExpenseList
        expenses={sampleExpenses}
        expensesLoading={false}
        showAllExpenses={true}
        setShowAllExpenses={setShowAllExpensesMock}
      />,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
  
  it('matches snapshot while loading expenses', () => {
    const setShowAllExpensesMock = jest.fn();
    const tree = render(
      <ExpenseList
        expenses={[]}
        expensesLoading={true}
        showAllExpenses={false}
        setShowAllExpenses={setShowAllExpensesMock}
      />,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
  
  it('matches snapshot when no expenses are present', () => {
    const setShowAllExpensesMock = jest.fn();
    const tree = render(
      <ExpenseList
        expenses={[]}
        expensesLoading={false}
        showAllExpenses={false}
        setShowAllExpenses={setShowAllExpensesMock}
      />,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
  
});
