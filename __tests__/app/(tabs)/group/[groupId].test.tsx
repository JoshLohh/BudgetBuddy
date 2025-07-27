/**
 * Test suite for GroupDetailScreen component.
 * 
 * Covers loading, error, no data, rendering of key child components,
 * interaction with modal & member search,
 * and navigation.
 * 
 * Mocks hooks, navigation, and necessary context to isolate component.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import GroupDetailScreen from '@/app/(tabs)/group/[groupId].tsx'; // adjust import if needed

import { useGroupDetails } from '@/hooks/useGroupDetails';
import { useUser } from '@/hooks/useUser';
import { useRouter, useLocalSearchParams } from 'expo-router';

jest.mock('@/hooks/useGroupDetails');
jest.mock('@/hooks/useUser');
jest.mock('expo-router');

describe('GroupDetailScreen', () => {
  const mockRouterPush = jest.fn();
  const mockRouterBack = jest.fn();
  
  const groupMock = {
    $id: 'group1',
    title: 'Test Group',
    description: 'A test group description',
    members: ['user1', 'user2'],
    createdBy: 'user1',
    avatar: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'group1' });
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
      back: mockRouterBack,
    });

    (useUser as jest.Mock).mockReturnValue({
      user: { $id: 'user1' },
    });
  });

  it('renders loading indicator when loading', () => {
    (useGroupDetails as jest.Mock).mockReturnValue({
      loading: true,
      error: '',
      group: null,
      membersExpanded: false,
      setMembersExpanded: jest.fn(),
      memberProfiles: [],
      searchModalVisible: false,
      setSearchModalVisible: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn(),
      searchResults: [],
      handleSearch: jest.fn(),
      searching: false,
      handleAddMember: jest.fn(),
      handleRemoveMember: jest.fn(),
      expenses: [],
      expensesToShow: [],
      expensesLoading: false,
      hasMoreExpenses: false,
      showAllExpenses: false,
      setShowAllExpenses: jest.fn(),
      suggestedSettlements: [],
      settleUp: jest.fn(),
      getUsername: jest.fn(),
      totalExpenses: 0,
    });

    const { getByTestId } = render(<GroupDetailScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders error message when error occurs', () => {
    (useGroupDetails as jest.Mock).mockReturnValue({
      loading: false,
      error: 'Failed to load group',
      group: null,
      // ...other mocks as above
      membersExpanded: false,
      setMembersExpanded: jest.fn(),
      memberProfiles: [],
      searchModalVisible: false,
      setSearchModalVisible: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn(),
      searchResults: [],
      handleSearch: jest.fn(),
      searching: false,
      handleAddMember: jest.fn(),
      handleRemoveMember: jest.fn(),
      expenses: [],
      expensesToShow: [],
      expensesLoading: false,
      hasMoreExpenses: false,
      showAllExpenses: false,
      setShowAllExpenses: jest.fn(),
      suggestedSettlements: [],
      settleUp: jest.fn(),
      getUsername: jest.fn(),
      totalExpenses: 0,
    });

    const { getByText } = render(<GroupDetailScreen />);
    expect(getByText('Failed to load group')).toBeTruthy();
  });

  it('shows no group data if group is null and no loading/error', () => {
    (useGroupDetails as jest.Mock).mockReturnValue({
      loading: false,
      error: '',
      group: null,
      // ...others props
      membersExpanded: false,
      setMembersExpanded: jest.fn(),
      memberProfiles: [],
      searchModalVisible: false,
      setSearchModalVisible: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn(),
      searchResults: [],
      handleSearch: jest.fn(),
      searching: false,
      handleAddMember: jest.fn(),
      handleRemoveMember: jest.fn(),
      expenses: [],
      expensesToShow: [],
      expensesLoading: false,
      hasMoreExpenses: false,
      showAllExpenses: false,
      setShowAllExpenses: jest.fn(),
      suggestedSettlements: [],
      settleUp: jest.fn(),
      getUsername: jest.fn(),
      totalExpenses: 0,
    });

    const { getByText } = render(<GroupDetailScreen />);
    expect(getByText('No group data.')).toBeTruthy();
  });

  it('renders GroupHeader and ExpenseList when group data available', () => {
    (useGroupDetails as jest.Mock).mockReturnValue({
      loading: false,
      error: '',
      group: groupMock,
      membersExpanded: false,
      setMembersExpanded: jest.fn(),
      memberProfiles: [],
      searchModalVisible: false,
      setSearchModalVisible: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn(),
      searchResults: [],
      handleSearch: jest.fn(),
      searching: false,
      handleAddMember: jest.fn(),
      handleRemoveMember: jest.fn(),
      expenses: [],
      expensesToShow: [],
      expensesLoading: false,
      hasMoreExpenses: false,
      showAllExpenses: false,
      setShowAllExpenses: jest.fn(),
      suggestedSettlements: [],
      settleUp: jest.fn(),
      getUsername: jest.fn().mockImplementation(id => `User: ${id}`),
      totalExpenses: 123.45,
    });

    const { getByText } = render(<GroupDetailScreen />);
    expect(getByText(groupMock.title)).toBeTruthy();
    expect(getByText('Add Expense')).toBeTruthy();
  });

  it('navigates to add expense page on Add Expense button press', () => {
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock, back: jest.fn() });
    (useGroupDetails as jest.Mock).mockReturnValue({
      loading: false,
      error: '',
      group: groupMock,
      membersExpanded: false,
      setMembersExpanded: jest.fn(),
      memberProfiles: [],
      searchModalVisible: false,
      setSearchModalVisible: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn(),
      searchResults: [],
      handleSearch: jest.fn(),
      searching: false,
      handleAddMember: jest.fn(),
      handleRemoveMember: jest.fn(),
      expenses: [],
      expensesToShow: [],
      expensesLoading: false,
      hasMoreExpenses: false,
      showAllExpenses: false,
      setShowAllExpenses: jest.fn(),
      suggestedSettlements: [],
      settleUp: jest.fn(),
      getUsername: jest.fn(),
      totalExpenses: 0,
    });

    const { getByText } = render(<GroupDetailScreen />);
    fireEvent.press(getByText('Add Expense'));
    expect(pushMock).toHaveBeenCalledWith({
      pathname: '/group/[groupId]/addExpense',
      params: { groupId: groupMock.$id },
    });
  });

  it('calls router.back when back button is pressed', () => {
    const backMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn(), back: backMock });
  
    (useGroupDetails as jest.Mock).mockReturnValue({
      loading: false,
      error: '',
      group: {
        $id: 'group1',
        title: 'Test Group',
        description: 'Description',
        members: ['user1'],
        createdBy: 'user1',
        avatar: null,
      },
      membersExpanded: false,
      setMembersExpanded: jest.fn(),
      memberProfiles: [],
      searchModalVisible: false,
      setSearchModalVisible: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn(),
      searchResults: [],
      handleSearch: jest.fn(),
      searching: false,
      handleAddMember: jest.fn(),
      handleRemoveMember: jest.fn(),
      expenses: [],
      expensesToShow: [],
      expensesLoading: false,
      hasMoreExpenses: false,
      showAllExpenses: false,
      setShowAllExpenses: jest.fn(),
      suggestedSettlements: [],
      settleUp: jest.fn(),
      getUsername: jest.fn(),
      totalExpenses: 0,
    });
  
    const { getByTestId, getByText } = render(<GroupDetailScreen />);
  
    // Find TouchableOpacity which wraps the back button.
    // Possibly add a testID or accessibilityLabel to this TouchableOpacity in your component to select it reliably.
    // For example, if you don't have testID, and there is a Text child with 'Back', you can do:
    const backButton = getByTestId('back-button'); // Adjust this if you have a specific testID for the back button
  
    fireEvent.press(backButton);
  
    expect(backMock).toHaveBeenCalledTimes(1);
  });
  
  
});

describe('GroupDetailScreen - Add Member Modal', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (useLocalSearchParams as jest.Mock).mockReturnValue({ groupId: 'group1' });
      (useUser as jest.Mock).mockReturnValue({ user: { $id: 'user1' } });
      (useRouter as jest.Mock).mockReturnValue({ push: jest.fn(), back: jest.fn() });
    });
  
    const baseHookReturn = {
      loading: false,
      error: '',
      group: { $id: 'group1', title: 'Test Group', members: ['user1'], createdBy: 'user1' },
      membersExpanded: false,
      setMembersExpanded: jest.fn(),
      memberProfiles: [],
      searchModalVisible: true, // Modal visible here
      setSearchModalVisible: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn(),
      searchResults: [
        { userId: 'user2', username: 'User Two' },
        { userId: 'user3', username: 'User Three' },
      ],
      handleSearch: jest.fn(),
      searching: false,
      handleAddMember: jest.fn(),
      handleRemoveMember: jest.fn(),
      expenses: [],
      expensesToShow: [],
      expensesLoading: false,
      hasMoreExpenses: false,
      showAllExpenses: false,
      setShowAllExpenses: jest.fn(),
      suggestedSettlements: [],
      settleUp: jest.fn(),
      getUsername: jest.fn(),
      totalExpenses: 0,
    };
  
    it('renders the Add Member modal when visible', () => {
      (useGroupDetails as jest.Mock).mockReturnValue(baseHookReturn);
  
      const { getByPlaceholderText, getByText } = render(<GroupDetailScreen />);
  
      // Check modal search input is rendered
      expect(getByPlaceholderText('Search username...')).toBeTruthy();
  
      // Check user entries are rendered
      expect(getByText('User Two')).toBeTruthy();
      expect(getByText('User Three')).toBeTruthy();
  
      // Check ListEmptyComponent message is NOT shown
      expect(() => getByText('No users found.')).toThrow();
    });
  
    it('closes the modal when Close button is pressed', async () => {
      const setSearchModalVisibleMock = jest.fn();
      (useGroupDetails as jest.Mock).mockReturnValue({
        ...baseHookReturn,
        setSearchModalVisible: setSearchModalVisibleMock,
      });
  
      const { getByText } = render(<GroupDetailScreen />);
  
      // Press the Close button on modal
      fireEvent.press(getByText('Close'));
  
      // Expect modal close handler to have been called with false
      expect(setSearchModalVisibleMock).toHaveBeenCalledWith(false);
    });
  
    it('calls handleAddMember when a user is tapped', () => {
      const handleAddMemberMock = jest.fn();
      (useGroupDetails as jest.Mock).mockReturnValue({
        ...baseHookReturn,
        handleAddMember: handleAddMemberMock,
      });
  
      const { getByText } = render(<GroupDetailScreen />);
  
      fireEvent.press(getByText('User Two'));
  
      expect(handleAddMemberMock).toHaveBeenCalledWith('user2');
    });
  });
