/**
 * GroupReportPage.test.tsx
 *
 * Tests the GroupReportPage component, validating data fetching,
 * rendering of pie chart by categories and members,
 * UI interactions like toggling modes and selecting pie slices,
 * handling loading and empty states,
 * and proper usage of router and theme.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import GroupReportPage from '@/app/(tabs)/group/[groupId]/report';
import { databases } from '@/lib/appwrite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Dimensions } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Text, View } from 'react-native';

// Mock Expo Router hooks
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock Appwrite databases
jest.mock('@/lib/appwrite', () => ({
  databases: {
    listDocuments: jest.fn(),
    getDocument: jest.fn(),
  },
}));

// Mock Dimensions for consistent layout size
jest.spyOn(Dimensions, 'get').mockReturnValue({
    width: 400,
    height: 800,
    scale: 2,
    fontScale: 2,
  });
  
// Silence React Native Gesture Handler warning if any
jest.mock('react-native-gesture-handler', () => ({}));

jest.mock('react-native-gifted-charts', () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return {
      PieChart: ({ data, onPress, ...props }: any) => {
        const total = data.reduce((sum: any, d: any) => sum + d.value, 0);
        const selectedIndex = 0;
        const percentage = (total > 0 ? (data[selectedIndex].value / total) * 100 : 0).toFixed(1) + '%';
        return React.createElement(
          View, null,
          React.createElement(Text, null, 'Simulated Pie Chart'),
          React.createElement(Text, null, percentage),
          React.createElement(Text, { onPress: () => onPress && onPress(data[0], 0) }, 'Food')
        );
      }
    };
});
  
  

describe('GroupReportPage test', () => {
  const mockRouterBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ back: mockRouterBack });
  });

  it('renders loading state initially', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'grp123' });
    // Simulate never-resolving promise for loading state
    (databases.listDocuments as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { getByText } = render(<GroupReportPage />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('fetches and renders category pie chart data correctly', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'grp123' });

    (databases.listDocuments as jest.Mock).mockResolvedValue({
      documents: [
        { $id: 'e1', amount: 10, paidBy: 'u1', category: 'Food', $createdAt: '2025-01-01', groupId: 'grp123' },
        { $id: 'e2', amount: 20, paidBy: 'u2', category: 'Food', $createdAt: '2025-01-01', groupId: 'grp123' },
        { $id: 'e3', amount: 30, paidBy: 'u1', category: 'Utilities', $createdAt: '2025-01-01', groupId: 'grp123' },
      ],
    });

    (databases.getDocument as jest.Mock).mockImplementation((_dbId, _colId, uid) => {
        const profiles: Record<string, { username: string; avatar: null }> = {
          u1: { username: 'Alice', avatar: null },
          u2: { username: 'Bob', avatar: null },
        };
        if (profiles[uid]) return Promise.resolve(profiles[uid]);
        return Promise.reject();
      });
      

    const { getByTestId, getByText, queryByText, queryAllByText } = render(<GroupReportPage />);

    await waitFor(() => expect(queryByText('Loading...')).toBeNull());

    // Check category labels and values appear
    const foodElements = queryAllByText('Food');
    expect(foodElements.length).toBeGreaterThanOrEqual(1);
    expect(getByText('Utilities')).toBeTruthy();
    const foodAmountElements = queryAllByText('$30.00');
    expect(foodAmountElements.length).toBeGreaterThanOrEqual(2); 

    // Verify "Categories" mode toggle button is active
    /*expect(getByText('Categories').parent?.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: expect.any(String) })])
    );*/

    const categoriesBtn = getByTestId('toggle-btn-categories');
    const btnStyle = categoriesBtn.props.style;
    const flattened = Array.isArray(btnStyle) ? Object.assign({}, ...btnStyle) : btnStyle;
    expect(flattened).toHaveProperty('backgroundColor', Colors.primary);

  });

  it('toggles to members mode and renders member pie chart data', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'grp123' });
    (databases.listDocuments as jest.Mock).mockResolvedValue({
      documents: [
        { $id: 'e1', amount: 15, paidBy: 'u1', category: 'Food', $createdAt: '2025-01-01', groupId: 'grp123' },
        { $id: 'e2', amount: 25, paidBy: 'u2', category: 'Utilities', $createdAt: '2025-01-01', groupId: 'grp123' },
      ],
    });
    (databases.getDocument as jest.Mock).mockImplementation((_dbId, _colId, uid) => {
        const profiles: Record<string, { username: string; avatar: string }> = {
          u1: { username: 'Alice', avatar: 'alice.png' },
          u2: { username: 'Bob', avatar: 'bob.png' },
        };
        if (profiles[uid]) return Promise.resolve(profiles[uid]);
        return Promise.reject();
      });
      

    const { getByText, queryByText, getByTestId } = render(<GroupReportPage />);

    await waitFor(() => expect(queryByText('Loading...')).toBeNull());

    // Switch mode to members
    fireEvent.press(getByText('Members'));

    const membersBtn = getByTestId('toggle-btn-members');
    const btnStyle = membersBtn.props.style;
    const flattened = Array.isArray(btnStyle) ? Object.assign({}, ...btnStyle) : btnStyle;
    expect(flattened).toHaveProperty('backgroundColor', Colors.primary);

    // Expect member names to appear in legend
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();

    // Check amounts displayed with $ sign
    expect(getByText('$15.00')).toBeTruthy();
    expect(getByText('$25.00')).toBeTruthy();
  });

  it('shows no expenses message when no data exists', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'empty' });
    (databases.listDocuments as jest.Mock).mockResolvedValue({ documents: [] });
    (databases.getDocument as jest.Mock).mockResolvedValue({ username: 'Unknown', avatar: null });

    const { getByText, queryByText } = render(<GroupReportPage />);

    await waitFor(() => expect(queryByText('Loading...')).toBeNull());

    expect(getByText('No expenses to show.')).toBeTruthy();
  });

  it('calls router.back() when back button is pressed', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'grp123' });
    (databases.listDocuments as jest.Mock).mockResolvedValue({ documents: [] });
    (databases.getDocument as jest.Mock).mockResolvedValue({ username: 'Alice', avatar: null });

    const { getByTestId } = render(<GroupReportPage />);

    // The back button has accessibilityRole or testID - fallback to TouchableOpacity with style
    await waitFor(() => {
      const backButton = getByTestId('Back button');
      if (backButton) fireEvent.press(backButton);
    });

    // If above fails, fallback to find first TouchableOpacity and trigger press
    fireEvent.press(getByTestId('Back button'));

    expect(mockRouterBack).toHaveBeenCalled();
  });

  it('selects and updates pie slice correctly', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'grp123' });

    (databases.listDocuments as jest.Mock).mockResolvedValue({
      documents: [
        { $id: 'e1', amount: 40, paidBy: 'u1', category: 'Food', $createdAt: '2025-01-01', groupId: 'grp123' },
      ],
    });

    (databases.getDocument as jest.Mock).mockResolvedValue({ username: 'Alice', avatar: null });

    const { getByText, queryByText, getByTestId } = render(<GroupReportPage />);
    await waitFor(() => expect(queryByText('Loading...')).toBeNull());

    // pieData has only one slice (Food)

    // simulate selecting that slice by calling setSelectedIndex via pie chart onPress
    // Unfortunately, react-native-gifted-charts cannot be fully tested, so we test that state setSelectedIndex updates by interaction

    // We'll fire press event on legend label manually since chart slice is hard to access
    fireEvent.press(getByTestId('legend-entry-Food'));

    // After selection, the center label should display percentage and label
    expect(getByTestId('legend-entry-Food')).toBeTruthy();
    expect(getByText('100.0%')).toBeTruthy();
  });

  it('handles fetch errors gracefully', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'grp123' });

    (databases.listDocuments as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    (databases.getDocument as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    const { queryByText } = render(<GroupReportPage />);

    await waitFor(() => expect(queryByText('Loading...')).toBeNull());

    // Should show empty state
    expect(queryByText('No expenses to show.')).toBeTruthy();
  });
  
  it('renders fallback profile data when getDocument fails', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'grp123' });
  
    // Return an expense by u1 and u2
    (databases.listDocuments as jest.Mock).mockResolvedValue({
        documents: [
          { $id: 'e1', amount: 10, paidBy: 'u1', category: 'Food', $createdAt: '2025-01-01', groupId: 'grp123' },
          { $id: 'e2', amount: 20, paidBy: 'u2', category: 'Shopping', $createdAt: '2025-01-01', groupId: 'grp123' },
        ],
      });
      
      (databases.getDocument as jest.Mock).mockImplementation((_dbId, _colId, uid) => {
        if (uid === 'u1') {
          return Promise.resolve({ username: 'Alice', avatar: 'alice.png' });
        }
        if (uid === 'u2') {
          return Promise.reject(new Error('User not found'));
        }
        return Promise.reject();
      });
      
  
    const { getByText, queryByText, getByTestId } = render(<GroupReportPage />);
    
    // Wait for loading to finish
    await waitFor(() => expect(queryByText('Loading...')).toBeNull());
  
    // Switch mode to members
    fireEvent.press(getByTestId('toggle-btn-members')); // or by text 'Members'

    // Then query legend entry for Alice
    expect(getByTestId('legend-entry-Alice')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
    expect(getByTestId('legend-entry-(unknown)')).toBeTruthy();

    });


    it('renders loading state correctly (snapshot)', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'grp123' });
      (databases.listDocuments as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves
    
      const { toJSON } = render(<GroupReportPage />);
      expect(toJSON()).toMatchSnapshot();
    });
    
    it('renders category pie chart (snapshot)', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'grp123' });
      (databases.listDocuments as jest.Mock).mockResolvedValue({
        documents: [
          { $id: 'e1', amount: 10, paidBy: 'u1', category: 'Food', $createdAt: '', groupId: 'grp123' },
          { $id: 'e2', amount: 20, paidBy: 'u2', category: 'Food', $createdAt: '', groupId: 'grp123' },
        ],
      });
      (databases.getDocument as jest.Mock).mockImplementation((_dbId, _colId, uid) =>
        Promise.resolve({ username: uid === 'u1' ? 'Alice' : 'Bob', avatar: null })
      );
    
      const { toJSON, queryByText } = render(<GroupReportPage />);
      await waitFor(() => expect(queryByText('Loading...')).toBeNull());
      expect(toJSON()).toMatchSnapshot();
    });
    
    it('renders member pie chart after toggling mode (snapshot)', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'grp123' });
      (databases.listDocuments as jest.Mock).mockResolvedValue({
        documents: [
          { $id: 'e1', amount: 15, paidBy: 'u1', category: 'Food', $createdAt: '', groupId: 'grp123' },
          { $id: 'e2', amount: 25, paidBy: 'u2', category: 'Utilities', $createdAt: '', groupId: 'grp123' },
        ],
      });
      (databases.getDocument as jest.Mock).mockImplementation((_dbId, _colId, uid) =>
        Promise.resolve({ username: uid === 'u1' ? 'Alice' : 'Bob', avatar: null })
      );
    
      const { toJSON, getByTestId, queryByText } = render(<GroupReportPage />);
      await waitFor(() => expect(queryByText('Loading...')).toBeNull());
      fireEvent.press(getByTestId('toggle-btn-members'));
      expect(toJSON()).toMatchSnapshot();
    });
    
    it('renders empty state (snapshot)', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'empty' });
      (databases.listDocuments as jest.Mock).mockResolvedValue({ documents: [] });
      (databases.getDocument as jest.Mock).mockResolvedValue({ username: 'Unknown', avatar: null });
      const { toJSON, queryByText } = render(<GroupReportPage />);
      await waitFor(() => expect(queryByText('Loading...')).toBeNull());
      expect(toJSON()).toMatchSnapshot();
    });
    
    it('renders fallback profile for failed member fetch (snapshot)', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'grp123' });
      (databases.listDocuments as jest.Mock).mockResolvedValue({
        documents: [
          { $id: 'e1', amount: 10, paidBy: 'u1', category: 'Food', $createdAt: '', groupId: 'grp123' },
          { $id: 'e2', amount: 20, paidBy: 'u2', category: 'Shopping', $createdAt: '', groupId: 'grp123' },
        ],
      });
      (databases.getDocument as jest.Mock).mockImplementation((_dbId, _colId, uid) => {
        if (uid === 'u1') return Promise.resolve({ username: 'Alice', avatar: 'alice.png' });
        return Promise.reject(new Error('User not found'));
      });
      const { toJSON, getByTestId, queryByText } = render(<GroupReportPage />);
      await waitFor(() => expect(queryByText('Loading...')).toBeNull());
      fireEvent.press(getByTestId('toggle-btn-members'));
      expect(toJSON()).toMatchSnapshot();
    });
  

  
});
