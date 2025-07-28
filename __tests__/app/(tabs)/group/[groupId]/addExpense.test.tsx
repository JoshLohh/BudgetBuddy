// addExpense.test.tsx

import React from 'react';
import { render, fireEvent, waitFor, act, screen } from '@testing-library/react-native';
import AddExpenseScreen from '@/app/(tabs)/group/[groupId]/addExpense';
import { databases } from '@/lib/appwrite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { NavigationContext } from '@react-navigation/native';

// Mock the Appwrite databases module
jest.mock('@/lib/appwrite', () => ({
  databases: {
    getDocument: jest.fn(),
    createDocument: jest.fn(),
  },
}));

// Mock expo-router hooks
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

// Mock useFocusEffect as useEffect for simpler testing
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const React = require('react');
  return {
    ...actual,
    useFocusEffect: jest.fn((callback) => React.useEffect(callback, [])),
  };
});

const navigationMock = {
  addListener: jest.fn((event, listener) => {
    if (event === 'focus') {
      listener();
    }
    return jest.fn();
  }),
  removeListener: jest.fn(),
  isFocused: () => true,
  goBack: jest.fn(),
  navigate: jest.fn(),
  // Add other navigation functions as needed
};

describe('AddExpenseScreen', () => {
  const mockRouterBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the router and local search params before each test
    (useRouter as jest.Mock).mockReturnValue({ back: mockRouterBack });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'group1' });
  });

  // Helper to render with NavigationContext provider
  function renderWithNavigationContext() {
    return render(
      <NavigationContext.Provider value={navigationMock as any}>
        <AddExpenseScreen />
      </NavigationContext.Provider>
    );
  }

  it('fetches group members and profiles on focus and initializes state', async () => {
    (databases.getDocument as jest.Mock)
      .mockResolvedValueOnce({ members: ['user1', 'user2'] }) // group members
      .mockResolvedValueOnce({ username: 'Alice', avatar: null }) // user1 profile
      .mockResolvedValueOnce({ username: 'Bob', avatar: null }); // user2 profile

    renderWithNavigationContext();

    await waitFor(() => {
      expect(databases.getDocument).toHaveBeenCalledTimes(3);
      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
    });
  });

  it('validates required fields and shows error messages', async () => {
    (databases.getDocument as jest.Mock)
      .mockResolvedValueOnce({ members: ['user1'] })
      .mockResolvedValueOnce({ username: 'Alice', avatar: null });
  
    renderWithNavigationContext();
  
    // Wait user profile render
    await screen.findAllByText('Alice');
  
    const saveButton = screen.getByText('Save Expense');
  
    // First press Save without description or amount
    await act(async () => {
      fireEvent.press(saveButton);
    });
    await waitFor(() => {
      expect(screen.getByText('Please enter a description.')).toBeTruthy();
    });
  
    // Enter description only
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('e.g. Lunch at cafe'), 'Lunch');
    });
  
    // Press Save again without amount
    await act(async () => {
      fireEvent.press(saveButton);
    });
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid amount.')).toBeTruthy();
    });
  });

  it('submits successfully and navigates back', async () => {
    (databases.getDocument as jest.Mock)
      .mockResolvedValueOnce({ members: ['user1'] })
      .mockResolvedValueOnce({ username: 'Alice', avatar: null });
  
    (databases.createDocument as jest.Mock).mockResolvedValue({});
  
    renderWithNavigationContext();
  
    await screen.findAllByText('Alice');
  
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('e.g. Lunch at cafe'), 'Lunch');
      fireEvent.changeText(screen.getByPlaceholderText('$0.00'), '20');
    });
  
    const paidByButton = screen.getAllByText('Alice')[0];
    await act(async () => {
      fireEvent.press(paidByButton);
    });
  
    const splitEveryoneButton = screen.getByText('Everyone');
    await act(async () => {
      fireEvent.press(splitEveryoneButton);
    });
  
    const saveButton = screen.getByText('Save Expense');
    await act(async () => {
      fireEvent.press(saveButton);
    });
  
    await waitFor(() => {
      expect(databases.createDocument).toHaveBeenCalledWith(
        expect.any(String),  // databaseId
        expect.any(String),  // collectionId
        expect.any(String),  // documentId generated, unique id
        expect.objectContaining({
          groupId: 'group1',
          description: 'Lunch',
          amount: 20,
          paidBy: 'user1',
          splitBetween: ['user1'],
          splitType: 'equal',
          customSplit: '',
          category: 'Others',
        }),
      );
      expect(mockRouterBack).toHaveBeenCalled();
    });
  });
  

  it('shows error if exact split amounts do not sum correctly', async () => {
    (databases.getDocument as jest.Mock)
      .mockResolvedValueOnce({ members: ['user1', 'user2'] })
      .mockResolvedValueOnce({ username: 'Alice', avatar: null })
      .mockResolvedValueOnce({ username: 'Bob', avatar: null });

    renderWithNavigationContext();

    await act(async () => {
      fireEvent.changeText(await screen.findByPlaceholderText('e.g. Lunch at cafe'), 'Dinner');
      fireEvent.changeText(screen.getByPlaceholderText('$0.00'), '30');
      fireEvent.press(screen.getByText('Exact Amounts'));
    });

    const amountInputs = screen.getAllByPlaceholderText('Amount');

    await act(async () => {
      fireEvent.changeText(amountInputs[0], '10');
      fireEvent.changeText(amountInputs[1], '15');
    });

    const saveButton = screen.getByText('Save Expense');
    await act(async () => {
      fireEvent.press(saveButton);
    });

    await waitFor(() =>
      expect(screen.getByText('Exact amounts must sum to the total amount.')).toBeTruthy()
    );
  });

  //testing lines 121-128
  it('shows error if percentage split amounts do not sum to 100%', async () => {
    (databases.getDocument as jest.Mock)
      .mockResolvedValueOnce({ members: ['user1', 'user2'] })
      .mockResolvedValueOnce({ username: 'Alice', avatar: null })
      .mockResolvedValueOnce({ username: 'Bob', avatar: null });
  
    renderWithNavigationContext();
  
    await screen.findAllByText('Alice');
    await screen.findAllByText('Bob');
  
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('e.g. Lunch at cafe'), 'Dinner');
      fireEvent.changeText(screen.getByPlaceholderText('$0.00'), '100');
    });
  
    const percentSplitButton = screen.getByText('% Percentages');
    await act(async () => fireEvent.press(percentSplitButton));
  
    // Use getAllByText because "Alice" appears multiple places
    const paidByButtons = screen.getAllByText('Alice');
    await act(async () => fireEvent.press(paidByButtons[0])); // Press first 'Alice' (Paid By section)
  
    const splitEveryoneButton = screen.getByText('Everyone');
    await act(async () => fireEvent.press(splitEveryoneButton));
  
    const percentageInputs = screen.getAllByPlaceholderText('Percent');
    await act(async () => {
      fireEvent.changeText(percentageInputs[0], '40');
      fireEvent.changeText(percentageInputs[1], '50');
    });
  
    const saveButton = screen.getByText('Save Expense');
    await act(async () => fireEvent.press(saveButton));
  
    await waitFor(() =>
      expect(screen.getByText('Percentages must sum to 100%.')).toBeTruthy()
    );
  
    expect(databases.createDocument).not.toHaveBeenCalled();
  });
  
  //Snapshot
  it('renders correctly and matches snapshot', async () => {
    (databases.getDocument as jest.Mock)
      .mockResolvedValueOnce({ members: ['user1', 'user2'] }) // group members
      .mockResolvedValueOnce({ username: 'Alice', avatar: null }) // user1 profile
      .mockResolvedValueOnce({ username: 'Bob', avatar: null }); // user2 profile
  
    const tree = renderWithNavigationContext();
  
    // Wait to ensure async hooks finish (optional)
    await screen.findByText('Add Expense');
  
    expect(tree.toJSON()).toMatchSnapshot();
  });
  

});
