/**
 * Tests for UserProfileScreen component
 * - Mocks Appwrite SDK calls
 * - Mocks Expo Router hooks
 * - Checks data fetching, rendering, loading/error UI, and navigation
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import UserProfileScreen from '@/app/(tabs)/group/[groupId]/user/[userId]';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { databases } from '@/lib/appwrite';

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
  },
}));

describe('UserProfileScreen', () => {
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Provide default mocks
    (useRouter as jest.Mock).mockReturnValue({ back: mockBack });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ userId: 'test-user', groupId: 'test-group' });
  });

  it('renders loading indicator initially', () => {
    (databases.getDocument as jest.Mock).mockImplementation(() => new Promise(() => {})); // never resolves

    const { getByTestId } = render(<UserProfileScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders user profile and stats after successful fetch', async () => {
    (databases.getDocument as jest.Mock).mockResolvedValue({
      $id: 'test-user',
      username: 'Test User',
      avatar: 'avatar.png',
      bio: 'Hello bio',
      email: 'test@example.com',
    });
    (databases.listDocuments as jest.Mock)
      // groups query result
      .mockResolvedValueOnce({
        documents: [{ $id: 'group1' }, { $id: 'group2' }],
      })
      // expenses query result
      .mockResolvedValueOnce({
        documents: [
          { amount: '10.50' },
          { amount: '20' },
        ],
      });

    const { getAllByText, getByText, queryByTestId } = render(<UserProfileScreen />);
    
    // Wait for async updates
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull(); // loading ended
    });

    // Check profile info rendered
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('Hello bio')).toBeTruthy();

    // Check stats rendered
    const allTwos = getAllByText('2');
    expect(allTwos.length).toBeGreaterThan(0);
    expect(getByText('$30.50')).toBeTruthy(); // total spent with decimals
  });

  it('renders "User not found" message on error', async () => {
    (databases.getDocument as jest.Mock).mockRejectedValue(new Error('Not found'));
    (databases.listDocuments as jest.Mock).mockResolvedValue({ documents: [] });

    const { getByText, queryByTestId } = render(<UserProfileScreen />);

    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
    });

    expect(getByText('User not found.')).toBeTruthy();
  });

  it('calls router.back() when back button pressed', async () => {
    (databases.getDocument as jest.Mock).mockResolvedValue({
      $id: 'test-user',
      username: 'Test User',
    });
    (databases.listDocuments as jest.Mock).mockResolvedValue({ documents: [] });

    const { getByTestId } = render(<UserProfileScreen />);
    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('back-button'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('matches snapshot during loading', () => {
    (databases.getDocument as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { toJSON } = render(<UserProfileScreen />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('matches snapshot with empty stats', async () => {
    (databases.getDocument as jest.Mock).mockResolvedValue({
      $id: 'test-user',
      username: 'Test User',
      avatar: 'avatar.png',
      bio: '',
      email: 'test@example.com',
    });
    (databases.listDocuments as jest.Mock)
      .mockResolvedValueOnce({ documents: [] }) // no groups
      .mockResolvedValueOnce({ documents: [] }); // no expenses

    const { queryByTestId, toJSON } = render(<UserProfileScreen />);

    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
    });

    expect(toJSON()).toMatchSnapshot();
  });
  
});
