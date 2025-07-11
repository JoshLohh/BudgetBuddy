import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { useGroupDetails } from '../../hooks/useGroupDetails';
import { Text } from 'react-native';

// Mock external dependencies
jest.mock('@/lib/appwrite', () => ({
  databases: {
    getDocument: jest.fn(),
    listDocuments: jest.fn(),
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
  }
}));
jest.mock('../../hooks/settlementUtils', () => ({
  calculateBalances: jest.fn(() => ({ user1: 10, user2: -10 })),
  calculateSettlements: jest.fn(() => [{ from: 'user2', to: 'user1', amount: 10 }])
}));

// Test component to use the hook
function TestComponent({ groupId }: { groupId: string | undefined }) {
  const details = useGroupDetails(groupId);
  return (
    <>
      <Text testID="group-title">{details.group?.title ?? ''}</Text>
      <Text testID="loading">{details.loading ? 'yes' : 'no'}</Text>
      <Text testID="error">{details.error}</Text>
      <Text testID="total-expenses">{details.totalExpenses}</Text>
      <Text testID="member-count">{details.memberProfiles.length}</Text>
      <Text testID="settlement-count">{details.settlements.length}</Text>
      <Text testID="suggested-settlements">{details.suggestedSettlements.length}</Text>
    </>
  );
}

describe('useGroupDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and sets group data', async () => {
    // Mock backend responses
    require('@/lib/appwrite').databases.getDocument.mockResolvedValue({
      $id: 'group1',
      title: 'Test Group',
      description: 'A group for testing',
      members: ['user1', 'user2'],
      createdBy: 'user1',
    });
    require('@/lib/appwrite').databases.listDocuments.mockResolvedValueOnce({
      documents: [
        { amount: 20, paidBy: 'user1', splitBetween: ['user1', 'user2'], splitType: 'equal' }
      ]
    }).mockResolvedValueOnce({
      documents: [
        { from: 'user2', to: 'user1', amount: 10 }
      ]
    });
    require('@/lib/appwrite').databases.getDocument.mockResolvedValueOnce({
      $id: 'user1', username: 'Alice', avatar: null
    }).mockResolvedValueOnce({
      $id: 'user2', username: 'Bob', avatar: null
    });

    const { getByTestId } = render(<TestComponent groupId="group1" />);
    await waitFor(() => {
      expect(getByTestId('group-title').props.children).toBe('Test Group');
      expect(getByTestId('loading').props.children).toBe('no');
      expect(getByTestId('error').props.children).toBe('');
      expect(getByTestId('member-count').props.children).toBe(2);
      expect(getByTestId('settlement-count').props.children).toBe(1);
      expect(getByTestId('suggested-settlements').props.children).toBe(1);
    });
  });

  it('handles missing groupId gracefully', () => {
    const { getByTestId } = render(<TestComponent groupId={undefined} />);
    expect(getByTestId('loading').props.children).toBe('yes');
    // No group data should be set
  });

  it('handles backend error', async () => {
    require('@/lib/appwrite').databases.getDocument.mockRejectedValue(new Error('Not found'));
    const { getByTestId } = render(<TestComponent groupId="bad-id" />);
    await waitFor(() => {
      expect(getByTestId('error').props.children).toBe('Group not found.');
    });
  });

  // Add more tests for handleAddMember, handleRemoveMember, handleSearch, settleUp, etc.
});
