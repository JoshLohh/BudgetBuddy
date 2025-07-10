// useGroupDetails.test.tsx

import React, { forwardRef, useImperativeHandle, createRef } from 'react';
import { act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { renderRouter } from 'expo-router/testing-library';

// Mocks must be declared BEFORE importing the hook!
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
  calculateSettlements: jest.fn(() => [
    { from: 'user2', to: 'user1', amount: 10 }
  ])
}));

import { useGroupDetails } from '../../hooks/useGroupDetails';

// Helper test component for UI-based assertions
function TestComponent({ groupId }: { groupId?: string }) {
  const details = useGroupDetails(groupId);
  return (
    <>
      <Text testID="group-title">{details.group?.title ?? ''}</Text>
      <Text testID="loading">{details.loading ? 'yes' : 'no'}</Text>
      <Text testID="error">{details.error}</Text>
      <Text testID="member-count">{details.memberProfiles.length}</Text>
      <Text testID="settlement-count">{details.settlements.length}</Text>
      <Text testID="suggested-settlements">{details.suggestedSettlements.length}</Text>
      <Text testID="total-expenses">{details.totalExpenses}</Text>
      <Text testID="search-results">{details.searchResults.length}</Text>
      <Text testID="searching">{details.searching ? 'yes' : 'no'}</Text>
      <Text testID="show-all-expenses">{details.showAllExpenses ? 'yes' : 'no'}</Text>
    </>
  );
}

// Ref-forwarding wrapper for hook stateful tests
const StateComponent = forwardRef<
  ReturnType<typeof useGroupDetails>,
  { groupId?: string }
>((props, ref) => {
  const details = useGroupDetails(props.groupId);
  useImperativeHandle(ref, () => details, [details]);
  return null;
});

describe('useGroupDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and sets group data', async () => {
    require('@/lib/appwrite').databases.getDocument
      .mockResolvedValueOnce({
        $id: 'group1',
        title: 'Test Group',
        description: 'A group for testing',
        members: ['user1', 'user2'],
        createdBy: 'user1',
      })
      .mockResolvedValueOnce({ $id: 'user1', username: 'Alice', avatar: null })
      .mockResolvedValueOnce({ $id: 'user2', username: 'Bob', avatar: null });

    require('@/lib/appwrite').databases.listDocuments
      .mockResolvedValueOnce({ documents: [
        { amount: 20, paidBy: 'user1', splitBetween: ['user1', 'user2'], splitType: 'equal' }
      ] }) // expenses
      .mockResolvedValueOnce({ documents: [
        { from: 'user2', to: 'user1', amount: 10 }
      ] }) // settlements
      .mockResolvedValueOnce({ documents: [
        { amount: 20, paidBy: 'user1', splitBetween: ['user1', 'user2'], splitType: 'equal', $id: 'exp1', description: '', groupId: 'group1', category: '', createdAt: '' }
      ] }) // expenses (focus effect)
      .mockResolvedValueOnce({ documents: [
        { from: 'user2', to: 'user1', amount: 10 }
      ] }); // settlements (focus effect)

    const { getByTestId } = renderRouter(<TestComponent groupId="group1" />);

    await waitFor(() => {
      expect(getByTestId('group-title').props.children).toBe('Test Group');
      expect(getByTestId('loading').props.children).toBe('no');
      expect(getByTestId('error').props.children).toBe('');
      expect(getByTestId('member-count').props.children).toBe(2);
      expect(getByTestId('settlement-count').props.children).toBe(1);
      expect(getByTestId('suggested-settlements').props.children).toBe(1);
      expect(getByTestId('total-expenses').props.children).toBe(20);
    });
  });

  it('handles missing groupId gracefully', () => {
    const { getByTestId } = renderRouter(<TestComponent groupId={undefined} />);
    expect(getByTestId('loading').props.children).toBe('yes');
  });

  it('handles backend error', async () => {
    require('@/lib/appwrite').databases.getDocument.mockRejectedValue(new Error('Not found'));
    require('@/lib/appwrite').databases.listDocuments.mockResolvedValue({ documents: [] });
    const { getByTestId } = renderRouter(<TestComponent groupId="bad-id" />);
    await waitFor(() => {
      expect(getByTestId('error').props.children).toBe('Group not found.');
    });
  });

  it('toggles membersExpanded state', async () => {
    require('@/lib/appwrite').databases.getDocument.mockResolvedValueOnce({
      $id: 'group1', title: '', description: '', members: [], createdBy: ''
    });
    require('@/lib/appwrite').databases.listDocuments.mockResolvedValue({ documents: [] });
    const detailsRef = createRef<ReturnType<typeof useGroupDetails>>();
    renderRouter(<StateComponent ref={detailsRef} groupId="group1" />);
    await waitFor(() => expect(detailsRef.current).toBeDefined());
    expect(detailsRef.current!.membersExpanded).toBe(false);
    act(() => { detailsRef.current!.setMembersExpanded(true); });
    expect(detailsRef.current!.membersExpanded).toBe(true);
  });

  it('toggles showAllExpenses', async () => {
    require('@/lib/appwrite').databases.getDocument.mockResolvedValueOnce({
      $id: 'group1', title: '', description: '', members: [], createdBy: ''
    });
    require('@/lib/appwrite').databases.listDocuments.mockResolvedValue({ documents: [] });
    const detailsRef = createRef<ReturnType<typeof useGroupDetails>>();
    renderRouter(<StateComponent ref={detailsRef} groupId="group1" />);
    await waitFor(() => expect(detailsRef.current).toBeDefined());
    expect(detailsRef.current!.showAllExpenses).toBe(false);
    act(() => { detailsRef.current!.setShowAllExpenses(true); });
    expect(detailsRef.current!.showAllExpenses).toBe(true);
  });

  it('handles handleSearch and sets searchResults', async () => {
    require('@/lib/appwrite').databases.getDocument.mockResolvedValueOnce({
      $id: 'group1', title: '', description: '', members: [], createdBy: ''
    });
    require('@/lib/appwrite').databases.listDocuments
      .mockResolvedValueOnce({ documents: [] }) // expenses
      .mockResolvedValueOnce({ documents: [] }) // settlements
      .mockResolvedValueOnce({ documents: [
        { $id: 'user3', username: 'Charlie', avatar: null },
        { $id: 'user4', username: 'David', avatar: null }
      ] }); // user search
    const detailsRef = createRef<ReturnType<typeof useGroupDetails>>();
    renderRouter(<StateComponent ref={detailsRef} groupId="group1" />);
    await waitFor(() => expect(detailsRef.current).toBeDefined());
    act(() => { detailsRef.current!.setSearchQuery('char'); });
    await act(async () => {
      await detailsRef.current!.handleSearch();
    });
    expect(detailsRef.current!.searchResults.length).toBe(1);
    expect(detailsRef.current!.searchResults[0].username).toBe('Charlie');
    expect(detailsRef.current!.searching).toBe(false);
  });

  it('adds a member with handleAddMember', async () => {
    require('@/lib/appwrite').databases.getDocument
      .mockResolvedValueOnce({
        $id: 'group1', title: '', description: '', members: ['user1'], createdBy: ''
      });
    require('@/lib/appwrite').databases.listDocuments.mockResolvedValue({ documents: [] });
    require('@/lib/appwrite').databases.updateDocument.mockResolvedValue({});
    const detailsRef = createRef<ReturnType<typeof useGroupDetails>>();
    renderRouter(<StateComponent ref={detailsRef} groupId="group1" />);
    await waitFor(() => expect(detailsRef.current && detailsRef.current.group).toBeDefined());
    await act(async () => {
      await detailsRef.current!.handleAddMember('user2');
    });
    expect(detailsRef.current!.group!.members).toContain('user2');
    expect(detailsRef.current!.searchModalVisible).toBe(false);
    expect(detailsRef.current!.searchQuery).toBe('');
    expect(detailsRef.current!.searchResults.length).toBe(0);
  });

  it('removes a member with handleRemoveMember', async () => {
    require('@/lib/appwrite').databases.getDocument
      .mockResolvedValueOnce({
        $id: 'group1', title: '', description: '', members: ['user1', 'user2'], createdBy: ''
      });
    require('@/lib/appwrite').databases.listDocuments.mockResolvedValue({ documents: [] });
    require('@/lib/appwrite').databases.updateDocument.mockResolvedValue({});
    const detailsRef = createRef<ReturnType<typeof useGroupDetails>>();
    renderRouter(<StateComponent ref={detailsRef} groupId="group1" />);
    await waitFor(() => expect(detailsRef.current && detailsRef.current.group).toBeDefined());
    await act(async () => {
      await detailsRef.current!.handleRemoveMember('user2');
    });
    expect(detailsRef.current!.group!.members).not.toContain('user2');
  });

  it('settles up with settleUp', async () => {
    require('@/lib/appwrite').databases.getDocument
      .mockResolvedValueOnce({
        $id: 'group1', title: '', description: '', members: ['user1', 'user2'], createdBy: ''
      });
    require('@/lib/appwrite').databases.listDocuments.mockResolvedValue({ documents: [] });
    require('@/lib/appwrite').databases.createDocument.mockResolvedValue({});
    require('@/lib/appwrite').databases.listDocuments.mockResolvedValueOnce({
      documents: [
        { from: 'user2', to: 'user1', amount: 10 }
      ]
    });
    const detailsRef = createRef<ReturnType<typeof useGroupDetails>>();
    renderRouter(<StateComponent ref={detailsRef} groupId="group1" />);
    await waitFor(() => expect(detailsRef.current && detailsRef.current.group).toBeDefined());
    await act(async () => {
      await detailsRef.current!.settleUp('user2', 'user1', 10);
    });
    expect(detailsRef.current!.settlements.length).toBe(1);
    expect(detailsRef.current!.settlements[0]).toEqual({ from: 'user2', to: 'user1', amount: 10 });
  });

  it('getUsername returns correct username', async () => {
    require('@/lib/appwrite').databases.getDocument
      .mockResolvedValueOnce({
        $id: 'group1', title: '', description: '', members: ['user1', 'user2'], createdBy: ''
      })
      .mockResolvedValueOnce({ $id: 'user1', username: 'Alice', avatar: null })
      .mockResolvedValueOnce({ $id: 'user2', username: 'Bob', avatar: null });
    require('@/lib/appwrite').databases.listDocuments.mockResolvedValue({ documents: [] });
    const detailsRef = createRef<ReturnType<typeof useGroupDetails>>();
    renderRouter(<StateComponent ref={detailsRef} groupId="group1" />);
    await waitFor(() => expect(detailsRef.current && detailsRef.current.memberProfiles.length).toBe(2));
    expect(detailsRef.current!.getUsername('user1')).toBe('Alice');
    expect(detailsRef.current!.getUsername('user2')).toBe('Bob');
    expect(detailsRef.current!.getUsername('user3')).toBe('user3'); // fallback
  });

  it('calculates totalExpenses correctly', async () => {
    require('@/lib/appwrite').databases.getDocument
      .mockResolvedValueOnce({
        $id: 'group1', title: '', description: '', members: ['user1', 'user2'], createdBy: ''
      })
      .mockResolvedValueOnce({ $id: 'user1', username: 'Alice', avatar: null })
      .mockResolvedValueOnce({ $id: 'user2', username: 'Bob', avatar: null });
    require('@/lib/appwrite').databases.listDocuments
      .mockResolvedValueOnce({ documents: [
        { amount: 20, paidBy: 'user1', splitBetween: ['user1', 'user2'], splitType: 'equal' },
        { amount: 30, paidBy: 'user2', splitBetween: ['user1', 'user2'], splitType: 'equal' }
      ] })
      .mockResolvedValueOnce({ documents: [] })
      .mockResolvedValueOnce({ documents: [
        { amount: 20, paidBy: 'user1', splitBetween: ['user1', 'user2'], splitType: 'equal', $id: 'exp1', description: '', groupId: 'group1', category: '', createdAt: '' },
        { amount: 30, paidBy: 'user2', splitBetween: ['user1', 'user2'], splitType: 'equal', $id: 'exp2', description: '', groupId: 'group1', category: '', createdAt: '' }
      ] })
      .mockResolvedValueOnce({ documents: [] });
    const { getByTestId } = renderRouter(<TestComponent groupId="group1" />);
    await waitFor(() => {
      expect(getByTestId('total-expenses').props.children).toBe(50);
    });
  });

  it('sets and resets searchModalVisible', async () => {
    require('@/lib/appwrite').databases.getDocument.mockResolvedValueOnce({
      $id: 'group1', title: '', description: '', members: [], createdBy: ''
    });
    require('@/lib/appwrite').databases.listDocuments.mockResolvedValue({ documents: [] });
    const detailsRef = createRef<ReturnType<typeof useGroupDetails>>();
    renderRouter(<StateComponent ref={detailsRef} groupId="group1" />);
    await waitFor(() => expect(detailsRef.current).toBeDefined());
    expect(detailsRef.current!.searchModalVisible).toBe(false);
    act(() => { detailsRef.current!.setSearchModalVisible(true); });
    expect(detailsRef.current!.searchModalVisible).toBe(true);
    act(() => { detailsRef.current!.setSearchModalVisible(false); });
    expect(detailsRef.current!.searchModalVisible).toBe(false);
  });

  it('sets and resets searchQuery', async () => {
    require('@/lib/appwrite').databases.getDocument.mockResolvedValueOnce({
      $id: 'group1', title: '', description: '', members: [], createdBy: ''
    });
    require('@/lib/appwrite').databases.listDocuments.mockResolvedValue({ documents: [] });
    const detailsRef = createRef<ReturnType<typeof useGroupDetails>>();
    renderRouter(<StateComponent ref={detailsRef} groupId="group1" />);
    await waitFor(() => expect(detailsRef.current).toBeDefined());
    expect(detailsRef.current!.searchQuery).toBe('');
    act(() => { detailsRef.current!.setSearchQuery('bob'); });
    expect(detailsRef.current!.searchQuery).toBe('bob');
    act(() => { detailsRef.current!.setSearchQuery(''); });
    expect(detailsRef.current!.searchQuery).toBe('');
  });

  it('hasMoreExpenses returns correct value', async () => {
    require('@/lib/appwrite').databases.getDocument
      .mockResolvedValueOnce({
        $id: 'group1', title: '', description: '', members: ['user1', 'user2'], createdBy: ''
      })
      .mockResolvedValueOnce({ $id: 'user1', username: 'Alice', avatar: null })
      .mockResolvedValueOnce({ $id: 'user2', username: 'Bob', avatar: null });
    require('@/lib/appwrite').databases.listDocuments
      .mockResolvedValueOnce({ documents: Array.from({ length: 12 }, (_, i) => ({
        amount: i + 1, paidBy: 'user1', splitBetween: ['user1', 'user2'], splitType: 'equal', $id: `exp${i+1}`, description: '', groupId: 'group1', category: '', createdAt: ''
      })) })
      .mockResolvedValueOnce({ documents: [] })
      .mockResolvedValueOnce({ documents: Array.from({ length: 12 }, (_, i) => ({
        amount: i + 1, paidBy: 'user1', splitBetween: ['user1', 'user2'], splitType: 'equal', $id: `exp${i+1}`, description: '', groupId: 'group1', category: '', createdAt: ''
      })) })
      .mockResolvedValueOnce({ documents: [] });
    const detailsRef = createRef<ReturnType<typeof useGroupDetails>>();
    renderRouter(<StateComponent ref={detailsRef} groupId="group1" />);
    await waitFor(() => expect(detailsRef.current && detailsRef.current.expenses.length).toBe(12));
    expect(detailsRef.current!.hasMoreExpenses).toBe(true);
    act(() => { detailsRef.current!.setShowAllExpenses(true); });
    expect(detailsRef.current!.expensesToShow.length).toBe(12);
  });
});
