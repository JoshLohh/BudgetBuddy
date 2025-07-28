import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import GroupHistoryPage from '@/app/(tabs)/group/[groupId]/history';  // adjust path to your file
import { databases } from '@/lib/appwrite';
import { useRouter } from 'expo-router';
import { within } from '@testing-library/react-native';
import type { Mock } from 'jest-mock';

// --- Mocks ---
jest.mock('@/lib/appwrite', () => ({
  databases: {
    listDocuments: jest.fn(),
    getDocument: jest.fn(),
  },
}));
let actualBackMock: jest.Mock<void, []>;

jest.mock('expo-router', () => {
    const actual = jest.requireActual('expo-router');
    actualBackMock = jest.fn();
    const React = require('react');
    return {
      ...actual,
      useRouter: () => ({ back: jest.fn() }),
      useLocalSearchParams: () => ({ groupId: 'testgroupid' }),
      // This makes useFocusEffect run its callback on mount like useEffect!
      useFocusEffect: (callback: any) => React.useEffect(callback, []),
      // useFocusEffect: jest.fn((callback) => React.useEffect(callback, [])),
    };
  });

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// --- Test Data ---
const expensesSample = [
  {
    $id: 'e1',
    amount: 12,
    paidBy: 'u1',
    splitBetween: ['u1', 'u2'],
    splitType: 'equal',
    customSplit: null,
    description: 'Lunch',
    groupId: 'testgroupid',
    category: 'Food',
    $createdAt: '2025-05-10T10:30:00Z',
  }
];
const settlementsSample = [
  {
    $id: 's1',
    groupId: 'testgroupid',
    from: 'u2',
    to: 'u1',
    amount: 12,
    $createdAt: '2025-05-12T12:00:00Z',
  }
];
const userProfiles: Record<string, { $id: string; username: string; avatar: string | null }> = {
    u1: { $id: 'u1', username: 'Alice', avatar: 'avatar1.png' },
    u2: { $id: 'u2', username: 'Bob', avatar: null },
  };

beforeEach(() => {
  jest.clearAllMocks();
  (databases.listDocuments as jest.Mock).mockImplementation(() => Promise.resolve({ documents: [] }));
});

it('shows loading initially and then list state', async () => {
  (databases.listDocuments as jest.Mock)
    .mockResolvedValueOnce({ documents: expensesSample })
    .mockResolvedValueOnce({ documents: settlementsSample })
    .mockResolvedValueOnce({ documents: expensesSample })
    .mockResolvedValueOnce({ documents: settlementsSample });

  (databases.getDocument as jest.Mock).mockImplementation(
    (_db, _col, id: string) =>
      Promise.resolve(userProfiles[id] || { $id: id, username: '(unknown)', avatar: null })
  );

  const { getByText, findByTestId } = render(<GroupHistoryPage />);

  expect(getByText(/Loading/i)).toBeTruthy();

  // Find expense activity container by testID (assuming expense $id is 'e1')
  const expenseItem = await findByTestId('activity-e1');
  const { getByText: getByTextInExpense } = within(expenseItem);
  expect(getByTextInExpense(/Alice/i)).toBeTruthy();
  expect(getByTextInExpense(/paid/i)).toBeTruthy();

  // Find settlement activity container by testID (assuming settlement $id is 's1')
  const settlementItem = await findByTestId('activity-s1');
  const { getByText: getByTextInSettlement } = within(settlementItem);
  expect(getByTextInSettlement(/Bob/i)).toBeTruthy();
  expect(getByTextInSettlement(/settled up/i)).toBeTruthy();
});

it('shows "No activity yet" when there is no data', async () => {
    (databases.listDocuments as jest.Mock)
  .mockImplementationOnce(() => Promise.resolve({ documents: [] }))
  .mockImplementationOnce(() => Promise.resolve({ documents: [] }));
    const { findByText } = render(<GroupHistoryPage />);
    expect(await findByText(/No activity yet/)).toBeTruthy();
});

it('displays unknown if user fetch fails', async () => {
    // Mock enough calls for both useEffect & useFocusEffect
    (databases.listDocuments as jest.Mock)
      .mockResolvedValueOnce({ documents: expensesSample })   // expenses
      .mockResolvedValueOnce({ documents: [] })               // settlements
      .mockResolvedValueOnce({ documents: expensesSample })   // expenses (focus)
      .mockResolvedValueOnce({ documents: [] });              // settlements (focus)
  
    // All getDocument calls will fail to fetch
    (databases.getDocument as jest.Mock).mockRejectedValue(new Error('not found'));
  
    const { findByTestId } = render(<GroupHistoryPage />);
    // Find the expense activity container for the activity row
    const expenseItem = await findByTestId('activity-e1');
    const { getByText } = within(expenseItem);
  
    expect(getByText(/\(unknown\)/)).toBeTruthy();
    expect(getByText(/paid/i)).toBeTruthy();
  });

it('toggles sort order via control', async () => {
  (databases.listDocuments as jest.Mock)
    .mockResolvedValueOnce({ documents: expensesSample })
    .mockResolvedValueOnce({ documents: settlementsSample });
  (databases.getDocument as jest.Mock).mockImplementation((_db, _col, id) =>
    Promise.resolve(userProfiles[id])
  );
  const { getByText } = render(<GroupHistoryPage />);
  const sortBtn = getByText(/Newest/i);
  fireEvent.press(sortBtn);
  expect(getByText(/Oldest/i)).toBeTruthy();
});

/*it('calls router.back() when back is pressed', () => {
    const { getByTestId } = render(<GroupHistoryPage />);
    fireEvent.press(getByTestId('back-button'));
    expect(actualBackMock).toHaveBeenCalled();
});*/

it('renders activity log page correctly (snapshot)', async () => {
    // Mock data so that activity items render as expected
    (databases.listDocuments as jest.Mock)
      .mockResolvedValueOnce({ documents: expensesSample })
      .mockResolvedValueOnce({ documents: settlementsSample })
      .mockResolvedValueOnce({ documents: expensesSample })
      .mockResolvedValueOnce({ documents: settlementsSample });
  
    (databases.getDocument as jest.Mock).mockImplementation(
      (_db: any, _col: any, id: string) =>
        Promise.resolve(userProfiles[id] || { $id: id, username: '(unknown)', avatar: null })
    );
  
    const { toJSON, findByTestId } = render(<GroupHistoryPage />);
    // Wait for at least one activity to render (pick the first expense)
    await findByTestId('activity-e1');
    // Snapshot the tree for regression testing (after load & activity shown)
    expect(toJSON()).toMatchSnapshot();
  });
  

// ...add snapshot tests and more edge cases as needed
