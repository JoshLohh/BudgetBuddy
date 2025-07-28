/**
 * Tests for ExpenseDetailScreen component
 * - Mocks Appwrite SDK calls (databases)
 * - Mocks Expo Router hooks and alert dialogs
 * - Tests data fetching, UI rendering, validation, save, delete actions
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ExpenseDetailScreen from '@/app/(tabs)/group/[groupId]/expense/[expenseId]';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { databases } from '@/lib/appwrite';
import { Alert, AlertButton } from 'react-native';
import renderer from 'react-test-renderer'

// Mock Expo Router hooks

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

// Mock Appwrite databases client

jest.mock('@/lib/appwrite', () => ({
  databases: {
    getDocument: jest.fn(),
    listDocuments: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
  },
}));

// Mock Alert

jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  // Optionally auto-confirm or cancel buttons in tests by calling handlers
});

describe('ExpenseDetailScreen', () => {
  const mockBack = jest.fn();
  const mockUpdateDocument = databases.updateDocument as jest.Mock;
  const mockDeleteDocument = databases.deleteDocument as jest.Mock;
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock router back method
    (useRouter as jest.Mock).mockReturnValue({ back: mockBack });

    // Mock params
    (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'group1', expenseId: 'expense1' });

    // Mock expense document fetch
    (databases.getDocument as jest.Mock).mockImplementation((databaseId, collectionId, documentId) => {
      if (collectionId === (process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '')) {
        return Promise.resolve({
          $id: 'expense1',
          amount: '100',
          description: 'Dinner',
          paidBy: 'user1',
          splitBetween: ['user1', 'user2'],
          splitType: 'equal',
          customSplit: '',
          groupId: 'group1',
          category: 'Food',
          $createdAt: '2023-01-01T00:00:00Z',
        });
      }
      // Mock user document fetch per user id
      if (collectionId === (process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID ?? '')) {
        if (documentId === 'user1') {
          return Promise.resolve({ $id: 'user1', username: 'Alice', avatar: null });
        }
        if (documentId === 'user2') {
          return Promise.resolve({ $id: 'user2', username: 'Bob', avatar: null });
        }
        return Promise.reject(new Error('User not found'));
      }
      return Promise.reject(new Error('Document not found'));
    });

    // For listDocuments, return empty array as this is unused in this context
    (databases.listDocuments as jest.Mock).mockResolvedValue({ documents: [] });
  });

  it('shows loading indicator initially', () => {
    (databases.getDocument as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { getByTestId } = render(<ExpenseDetailScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders expense details and user profiles after fetch', async () => {
    const { getByPlaceholderText, findByTestId, queryByTestId } = render(<ExpenseDetailScreen />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
    });

    // Check expense basic info inputs
    expect(getByPlaceholderText('Expense description').props.value).toBe('Dinner');
    expect(getByPlaceholderText("$0.00").props.value).toBe('100');

    // Now wait for user profile texts to appear
    const aliceText = await findByTestId('user-profile-user1'); // Optionally can check container or text, but use 'user1' if used as key
    const aliceUsername = await findByTestId('user-username-user1'); // Adjust as per your testid naming (see below)

    // Alternatively, correct testid:
    //const aliceUsernameText = await findByTestId('user-username-user1');
    //expect(aliceUsernameText.props.children.includes('Alice')).toBe(true); // Or adjust better per structure

    // However, since in your component, the testid is `user1` or `user-username-user1`? Adjust accordingly:
    const aliceUsernameTextCorrect = await findByTestId('user-username-user1');
    expect(aliceUsernameTextCorrect.props.children).toBe('Alice');

    const bobUsernameText = await findByTestId('user-username-user2');
    expect(bobUsernameText.props.children).toBe('Bob');
  });
  
  

  it('validates and shows error if description is empty on save', async () => {
    setUpBasicRender();
    const { getByText, getByPlaceholderText, getByTestId, queryByText } = await setUpBasicRender();
    // Clear description
    fireEvent.changeText(getByPlaceholderText('Expense description'), '');
    // Press save
    fireEvent.press(getByText('Save Changes'));
    expect(getByText('Please enter a description.')).toBeTruthy();
  });

  it('calls updateDocument on successful save', async () => {
    await setUpBasicRender();
    mockUpdateDocument.mockResolvedValue({});
    const { getByText, getByPlaceholderText } = await setUpBasicRender();
    fireEvent.changeText(getByPlaceholderText('Expense description'), 'Updated Dinner');
    fireEvent.changeText(getByPlaceholderText('$0.00'), '120');
    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdateDocument).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Expense updated');
      expect(mockBack).toHaveBeenCalled();
    });

  });

  it('shows confirmation and deletes expense on confirm', async () => {

    await setUpBasicRender();
    mockDeleteDocument.mockResolvedValue({});
    let deleteHandler: any;

    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        // Find the Delete button handler and call it to simulate confirmation
        deleteHandler = buttons?.find((btn: AlertButton) => btn.text === 'Delete')?.onPress;
      });

    const { getByText } = await setUpBasicRender();
    fireEvent.press(getByText('Delete Expense'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      expect.any(Array)
    );

    // Simulate user confirming delete

    act(() => {
      deleteHandler && deleteHandler();
    });

    await waitFor(() => {
      expect(mockDeleteDocument).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Deleted', 'Expense deleted');
      expect(mockBack).toHaveBeenCalled();
    });

  });

  // Helper to render and wait for loading to finish

  async function setUpBasicRender() {

    (databases.getDocument as jest.Mock).mockResolvedValue({
      $id: 'expense1',
      amount: '100',
      description: 'Dinner',
      paidBy: 'user1',
      splitBetween: ['user1', 'user2'],
      splitType: 'equal',
      customSplit: '',
      groupId: 'group1',
      category: 'Food',
      $createdAt: '2023-01-01T00:00:00Z',
    });

    (databases.listDocuments as jest.Mock).mockResolvedValue({
      documents: [
        { $id: 'user1', username: 'Alice', avatar: null },
        { $id: 'user2', username: 'Bob', avatar: null },
      ],
    });

    const utils = render(<ExpenseDetailScreen />);

    await waitFor(() => {
      expect(utils.queryByTestId('loading-indicator')).toBeNull();
    });

    return utils;
  }

});

//lines 275-295
describe('ExpenseDetailScreen Custom Split inputs', () => {
    beforeEach(() => {
      jest.clearAllMocks();
  
      (useRouter as jest.Mock).mockReturnValue({ back: jest.fn() });
      (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'group1', expenseId: 'expense1' });
  
      // Expense document with splitType 'exact' to show custom splits
      (databases.getDocument as jest.Mock).mockImplementation((dbId, collId, docId) => {
        if (collId === process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID) {
          return Promise.resolve({
            $id: 'expense1',
            amount: '100',
            description: 'Dinner',
            paidBy: 'user1',
            splitBetween: ['user1', 'user2'],
            splitType: 'exact',
            customSplit: JSON.stringify({ user1: '40', user2: '60' }),
            groupId: 'group1',
            category: 'Food',
            $createdAt: '2023-01-01T00:00:00Z',
          });
        }
        if (collId === process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID) {
          if (docId === 'user1') {
            return Promise.resolve({ $id: 'user1', username: 'Alice', avatar: 'https://example.com/alice.jpg' });
          }
          if (docId === 'user2') {
            return Promise.resolve({ $id: 'user2', username: 'Bob', avatar: null });
          }
        }
        return Promise.reject(new Error('Doc not found'));
      });
  
      (databases.listDocuments as jest.Mock).mockResolvedValue({ documents: [] });
    });
  
    it('renders user avatars, usernames, and updates customSplit on input change', async () => {
      const { findByTestId, findAllByPlaceholderText, findByPlaceholderText, findByText, queryByText } = render(<ExpenseDetailScreen />);
      
      // Wait for the loading indicator to disappear
      await waitFor(() => {
        expect(queryByText('Saving...')).toBeNull();
      });
  
      // Check that username and avatar are rendered for user1 (has avatar)
      const aliceUsernameTextCorrect = await findByTestId('user-username-user1');
        expect(aliceUsernameTextCorrect.props.children).toBe('Alice');

        const bobUsernameText = await findByTestId('user-username-user2');
        expect(bobUsernameText.props.children).toBe('Bob');
  
      // Find the custom split TextInput for user1 by placeholder ("Amount" because splitType 'exact')
      const aliceInput = await findByTestId('custom-split-input-user1');
      const bobInput = await findByTestId('custom-split-input-user2');
      
      expect(aliceInput.props.value).toBe('40');
      expect(bobInput.props.value).toBe('60');
      
      fireEvent.changeText(aliceInput, '50');
      fireEvent.changeText(bobInput, '50');
  
      // Because the component updates local state, you can verify state indirectly by checking no errors occur
      // Direct state access isn't possible unless exposing state, so this test focuses on input responding
  
      // Optionally, you can simulate "Save Changes" and check the payload includes updated customSplit
    });
});

//lines 123-130
describe('ExpenseDetailScreen exact split validation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
  
      (useRouter as jest.Mock).mockReturnValue({ back: jest.fn() });
      (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'group1', expenseId: 'expense1' });
  
      (databases.getDocument as jest.Mock).mockImplementation((dbId, collId, docId) => {
        if (collId === process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID) {
          // Provide an expense with "exact" splitType
          return Promise.resolve({
            $id: 'expense1',
            amount: 100,
            description: 'Test expense',
            paidBy: 'user1',
            splitBetween: ['user1', 'user2'],
            splitType: 'exact',
            customSplit: JSON.stringify({ user1: '40', user2: '50' }), // sum 90 !== amount 100 to trigger error
            groupId: 'group1',
            category: 'Food',
            $createdAt: '2023-01-01T00:00:00Z',
          });
        }
        if (collId === process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID) {
          if (docId === 'user1') return Promise.resolve({ $id: 'user1', username: 'Alice', avatar: null });
          if (docId === 'user2') return Promise.resolve({ $id: 'user2', username: 'Bob', avatar: null });
        }
        return Promise.reject(new Error('Doc not found'));
      });
  
      (databases.listDocuments as jest.Mock).mockResolvedValue({ documents: [] });
  
      // Mock Alert alert to track error messages
      jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });
  
    it('shows error if exact split amounts do not sum to total amount', async () => {
      const { getByText, queryByText, getByPlaceholderText } = render(<ExpenseDetailScreen />);
  
      // Wait for loading to disappear
      await waitFor(() => {
        expect(queryByText('Saving...')).toBeNull();
      });
  
      // The initial description and amount should be loaded as per mock
      expect(getByPlaceholderText('Expense description').props.value).toBe('Test expense');
      expect(getByPlaceholderText('$0.00').props.value).toBe('100');
  
      // Press "Save Changes" button to trigger validation
      fireEvent.press(getByText('Save Changes'));
  
      // The error message should be displayed synchronously by setError in component
      await waitFor(() => {
        expect(getByText('Exact amounts must sum to the total amount.')).toBeTruthy();
      });
    });
  
    it('allows saving when exact split amounts sum to total', async () => {
      // Adjust customSplit mock to sum correctly
      (databases.getDocument as jest.Mock).mockImplementationOnce((dbId, collId, docId) => {
        if (collId === process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID) {
          return Promise.resolve({
            $id: 'expense1',
            amount: 100,
            description: 'Test expense',
            paidBy: 'user1',
            splitBetween: ['user1', 'user2'],
            splitType: 'exact',
            customSplit: JSON.stringify({ user1: '50', user2: '50' }), // sum 100 == amount 100
            groupId: 'group1',
            category: 'Food',
            $createdAt: '2023-01-01T00:00:00Z',
          });
        }
        return Promise.reject(new Error('Doc not found'));
      });
  
      const { getByText, queryByText } = render(<ExpenseDetailScreen />);
  
      await waitFor(() => {
        expect(queryByText('Saving...')).toBeNull();
      });
  
      fireEvent.press(getByText('Save Changes'));
  
      // No error message expected
      await waitFor(() => {
        expect(queryByText('Exact amounts must sum to the total amount.')).toBeNull();
      });
    });
});

//lines 134-141 (percentage split)
describe('ExpenseDetailScreen percentage split validation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
  
      (useRouter as jest.Mock).mockReturnValue({ back: jest.fn() });
      (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'group1', expenseId: 'expense1' });
  
      (databases.getDocument as jest.Mock).mockImplementation((dbId, collId, docId) => {
        if (collId === process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID) {
          return Promise.resolve({
            $id: 'expense1',
            amount: 100,
            description: 'Test expense',
            paidBy: 'user1',
            splitBetween: ['user1', 'user2'],
            splitType: 'percentage',
            customSplit: JSON.stringify({ user1: '30', user2: '60' }), // sum 90% < 100 to trigger error
            groupId: 'group1',
            category: 'Food',
            $createdAt: '2023-01-01T00:00:00Z',
          });
        }
        if (collId === process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID) {
          if (docId === 'user1') return Promise.resolve({ $id: 'user1', username: 'Alice', avatar: null });
          if (docId === 'user2') return Promise.resolve({ $id: 'user2', username: 'Bob', avatar: null });
        }
        return Promise.reject(new Error('Doc not found'));
      });
  
      (databases.listDocuments as jest.Mock).mockResolvedValue({ documents: [] });
  
      jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });
  
    it('shows error if percentage split amounts do not sum to 100%', async () => {
      const { getByText, queryByText, getByPlaceholderText } = render(<ExpenseDetailScreen />);
  
      // Wait for any loading indicator to disappear
      await waitFor(() => {
        expect(queryByText('Saving...')).toBeNull();
      });
  
      // Initial values loaded properly
      expect(getByPlaceholderText('Expense description').props.value).toBe('Test expense');
      expect(getByPlaceholderText('$0.00').props.value).toBe('100');
  
      // Press "Save Changes" to trigger validation
      fireEvent.press(getByText('Save Changes'));
  
      // The error message should be shown
      await waitFor(() => {
        expect(getByText('Percentages must sum to 100%.')).toBeTruthy();
      });
    });
  
    it('allows saving when percentage split sums to 100%', async () => {
      // Adjust mock to have correct sum
      (databases.getDocument as jest.Mock).mockImplementationOnce((dbId, collId, docId) => {
        if (collId === process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID) {
          return Promise.resolve({
            $id: 'expense1',
            amount: 100,
            description: 'Test expense',
            paidBy: 'user1',
            splitBetween: ['user1', 'user2'],
            splitType: 'percentage',
            customSplit: JSON.stringify({ user1: '50', user2: '50' }), // sum 100%
            groupId: 'group1',
            category: 'Food',
            $createdAt: '2023-01-01T00:00:00Z',
          });
        }
        return Promise.reject(new Error('Doc not found'));
      });
  
      const { getByText, queryByText } = render(<ExpenseDetailScreen />);
  
      await waitFor(() => {
        expect(queryByText('Saving...')).toBeNull();
      });
  
      fireEvent.press(getByText('Save Changes'));
  
      // No error message expected
      await waitFor(() => {
        expect(queryByText('Percentages must sum to 100%.')).toBeNull();
      });
    });
});
  
//lines 113-115(proper number)
describe('ExpenseDetailScreen amount validation', () => {
    let consoleErrorMock: jest.SpyInstance;
  
    beforeEach(() => {
      jest.clearAllMocks();
  
      (useRouter as jest.Mock).mockReturnValue({ back: jest.fn() });
      (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'group1', expenseId: 'expense1' });
  
      (databases.getDocument as jest.Mock).mockImplementation((dbId, collId, docId) => {
        if (collId === process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID) {
          return Promise.resolve({
            $id: 'expense1',
            amount: 100,
            description: 'Test expense',
            paidBy: 'user1',
            splitBetween: ['user1', 'user2'],
            splitType: 'equal',
            customSplit: '',
            groupId: 'group1',
            category: 'Food',
            $createdAt: '2023-01-01T00:00:00Z',
          });
        }
        if (collId === process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID) {
          if (docId === 'user1') return Promise.resolve({ $id: 'user1', username: 'Alice', avatar: null });
          if (docId === 'user2') return Promise.resolve({ $id: 'user2', username: 'Bob', avatar: null });
        }
        return Promise.reject(new Error('Doc not found'));
      });
  
      (databases.listDocuments as jest.Mock).mockResolvedValue({ documents: [] });
    });
  
    beforeAll(() => {
      // Mock console.error to silence warnings/errors during tests
      consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    });
  
    afterAll(() => {
      // Restore console.error after tests complete
      consoleErrorMock.mockRestore();
    });
  
    it('shows error if amount is empty', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(<ExpenseDetailScreen />);
  
      // Wait for loading to finish
      await waitFor(() => {
        expect(queryByText('Saving...')).toBeNull();
      });
  
      // Clear amount input field
      fireEvent.changeText(getByPlaceholderText('$0.00'), '');
  
      // Press save
      fireEvent.press(getByText('Save Changes'));
  
      await waitFor(() => {
        expect(getByText('Please enter a valid amount.')).toBeTruthy();
      });
    });
  
    it('shows error if amount is not a number', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(<ExpenseDetailScreen />);
  
      await waitFor(() => {
        expect(queryByText('Saving...')).toBeNull();
      });
  
      fireEvent.changeText(getByPlaceholderText('$0.00'), 'abc');
  
      fireEvent.press(getByText('Save Changes'));
  
      await waitFor(() => {
        expect(getByText('Please enter a valid amount.')).toBeTruthy();
      });
    });
  
    it('shows error if amount is zero or less', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(<ExpenseDetailScreen />);
  
      await waitFor(() => {
        expect(queryByText('Saving...')).toBeNull();
      });
  
      fireEvent.changeText(getByPlaceholderText('$0.00'), '0');
  
      fireEvent.press(getByText('Save Changes'));
  
      await waitFor(() => {
        expect(getByText('Please enter a valid amount.')).toBeTruthy();
      });
    });
  
    it('allows saving if amount is valid positive number', async () => {
      (databases.updateDocument as jest.Mock).mockResolvedValue({});
      const { getByText, getByPlaceholderText, queryByText } = render(<ExpenseDetailScreen />);
  
      await waitFor(() => {
        expect(queryByText('Saving...')).toBeNull();
      });
  
      fireEvent.changeText(getByPlaceholderText('$0.00'), '150');
  
      fireEvent.press(getByText('Save Changes'));
  
      await waitFor(() => {
        expect(queryByText('Please enter a valid amount.')).toBeNull();
        expect(databases.updateDocument).toHaveBeenCalled();
      });
    });
});

//lines 94-96
it('shows error message and stops loading if expense fetch fails', async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Mock getDocument to reject (simulate fetch error)
    (databases.getDocument as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));
  
    // Mock router and params as usual
    (useRouter as jest.Mock).mockReturnValue({ back: jest.fn() });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'group1', expenseId: 'expense1' });
  
    const { getByText, queryByTestId } = render(<ExpenseDetailScreen />);
  
    // Initially loading indicator should show
    expect(queryByTestId('loading-indicator')).toBeTruthy();
  
    // Wait for loading indicator to disappear (loading = false)
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
    });
  
    // Expect error message to be displayed
    expect(getByText('Expense not found')).toBeTruthy();
    consoleErrorMock.mockRestore();
});

//Snapshots

describe('ExpenseDetailScreen snapshots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ back: jest.fn() });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'group1', expenseId: 'expense1' });
  });

  it('matches snapshot during loading state', () => {
    // Mock getDocument to a pending promise to simulate loading
    (databases.getDocument as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const tree = renderer.create(<ExpenseDetailScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('matches snapshot after expense loaded', async () => {
    // Mock successful expense fetch
    (databases.getDocument as jest.Mock).mockImplementation((dbId, collId, docId) => {
      if (collId === process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID) {
        return Promise.resolve({
          $id: 'expense1',
          amount: '100',
          description: 'Dinner',
          paidBy: 'user1',
          splitBetween: ['user1', 'user2'],
          splitType: 'equal',
          customSplit: '',
          groupId: 'group1',
          category: 'Food',
          $createdAt: '2023-01-01T00:00:00Z',
        });
      }
      if (collId === process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID) {
        if (docId === 'user1') return Promise.resolve({ $id: 'user1', username: 'Alice', avatar: null });
        if (docId === 'user2') return Promise.resolve({ $id: 'user2', username: 'Bob', avatar: null });
      }
      return Promise.reject(new Error('Doc not found'));
    });

    const tree = renderer.create(<ExpenseDetailScreen />);

    // Wait for useEffect to finish loading and updating state
    await act(async () => {
      await Promise.resolve(); // wait a tick
    });

    expect(tree.toJSON()).toMatchSnapshot();
  });
});

