/**
* Test suite for AddExpenseScreen component.
* Covers form input validation, data fetching, submission logic,
* UI state updates, and navigation behavior.
*/

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddExpenseScreen from '@/app/(tabs)/group/[groupId]/addExpense'; // Adjust relative path as needed

import { databases } from '@/lib/appwrite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { NavigationContainer } from '@react-navigation/native'; // Add this import

// Mock Appwrite databases
jest.mock('@/lib/appwrite', () => ({
  databases: {
    getDocument: jest.fn(),
    createDocument: jest.fn(),
  },
}));

// Mock Expo Router hooks
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

// Helper render method with navigation
const renderWithNavigation = (ui: React.ReactElement) => {
  return render(
    <NavigationContainer>
      {ui}
    </NavigationContainer>
  );
};

describe('AddExpenseScreen', () => {
  const mockRouter = { back: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'group1' });
  });

  it('fetches group members and profiles on focus and initializes state', async () => {
    (databases.getDocument as jest.Mock)
      // first call: group document with members
      .mockResolvedValueOnce({ members: ['user1', 'user2'] })
      // second call: user1 profile
      .mockResolvedValueOnce({ username: 'Alice', avatar: null })
      // third call: user2 profile
      .mockResolvedValueOnce({ username: 'Bob', avatar: null });

    const { getByText, getAllByText } = renderWithNavigation(<AddExpenseScreen />);

    await waitFor(() => {
      expect(databases.getDocument).toHaveBeenCalledTimes(3);
      expect(getAllByText('Alice').length).toBeGreaterThan(0);
      expect(getAllByText('Bob').length).toBeGreaterThan(0);
    });
  });

  it('validates required fields and shows error message', async () => {
    (databases.getDocument as jest.Mock).mockResolvedValueOnce({ members: ['user1'] });
    (databases.getDocument as jest.Mock).mockResolvedValueOnce({ username: 'Alice', avatar: null });

    const { getByText, getByPlaceholderText, getByTestId } = renderWithNavigation(<AddExpenseScreen />);

    const saveButton = getByText('Save Expense');

    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(getByText('Please enter a description.')).toBeTruthy();
    });

    // Fill description and test amount validation
    fireEvent.changeText(getByPlaceholderText('$0.00'), ''); // empty amount
    fireEvent.changeText(getByPlaceholderText("e.g. Lunch at cafe"), 'Dinner');

    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(getByText('Please enter a valid amount.')).toBeTruthy();
    });
  });

  it('submits expense successfully and navigates back', async () => {
    (databases.getDocument as jest.Mock)
      .mockResolvedValueOnce({ members: ['user1'] })
      .mockResolvedValueOnce({ username: 'Alice', avatar: null });
  
    (databases.createDocument as jest.Mock).mockResolvedValue({});
  
    const { getByText, getByPlaceholderText, getAllByText } = renderWithNavigation(<AddExpenseScreen />);
  
    fireEvent.changeText(getByPlaceholderText("e.g. Lunch at cafe"), 'Lunch');
    fireEvent.changeText(getByPlaceholderText('$0.00'), '20');
  
    await waitFor(() => expect(getAllByText('Alice').length).toBeGreaterThan(0));
  
    const paidByButton = getAllByText('Alice')[0];
    fireEvent.press(paidByButton);
    await waitFor(() => {
      // wait for state update triggered by pressed paidByButton
    });
  
    const splitBetweenEveryone = getByText('Everyone');
    fireEvent.press(splitBetweenEveryone);
    await waitFor(() => {
      // wait for state update triggered by pressed splitBetweenEveryone button
    });
  
    fireEvent.press(getByText('Save Expense'));
  
    await waitFor(() => {
      expect(databases.createDocument).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        'group1',
        'Lunch',
        20,
        'user1',
        ['user1'],
        'equal',
        '',
        'Others'
      );
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });
  
  
  
  
  
  
  

  it('shows error if exact split amounts do not sum to total', async () => {
    // Setup with splitType = 'exact' and invalid customSplit
    (databases.getDocument as jest.Mock)
      .mockResolvedValueOnce({ members: ['user1', 'user2'] })
      .mockResolvedValueOnce({ username: 'Alice', avatar: null })
      .mockResolvedValueOnce({ username: 'Bob', avatar: null });

    const { getByText, getByPlaceholderText, getByTestId } = renderWithNavigation(<AddExpenseScreen />);

    fireEvent.changeText(getByPlaceholderText("e.g. Lunch at cafe"), 'Dinner');
    fireEvent.changeText(getByPlaceholderText('$0.00'), '30');
    // Set split type to exact
    fireEvent.press(getByText('Exact Amounts'));
    // Set custom split amounts incorrectly (e.g., sum != 30)
    const inputs = getByPlaceholderText('Amount');
    // Note: if you have multiple inputs, use getAllByPlaceholderText('Amount')
    // and loop over them for multiple users, e.g.:
    // const [user1Input, user2Input] = getAllByPlaceholderText('Amount');
    // fireEvent.changeText(user1Input, '10');
    // fireEvent.changeText(user2Input, '15');
    fireEvent.changeText(inputs, '10');  // for user1
    fireEvent.changeText(inputs, '15');  // for user2

    fireEvent.press(getByText('Save Expense'));

    await waitFor(() => {
      expect(getByText('Exact amounts must sum to the total amount.')).toBeTruthy();
    });
  });

  // Additional tests can cover:
  // - Percentage split validation (sum to 100)
  // - Cancel button navigates back
  // - UI snapshot tests for rendering states
  // - Handling of loading and error states
});
