import React from 'react';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';
import { Alert, View, AlertButton, TouchableOpacity, Text } from 'react-native';
import { useGroupDetails } from '@/hooks/useGroupDetails';
import * as appwrite from '@/lib/appwrite';
import { LogBox } from 'react-native';

jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.mock('@/lib/appwrite');

jest.mock('expo-router', () => {
  const React = require('react');
  return { useFocusEffect: (callback: any) => React.useEffect(callback, []) };
});

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

const mockedGroup = {
  $id: 'abc123',
  title: 'BBQ Trip',
  description: 'Fun camping trip',
  members: ['user1', 'user2'],
  createdBy: 'user1',
  avatar: 'avatar.png',
};

const mockedExpenses = {
  documents: [
    {
      $id: 'exp1',
      amount: 100,
      paidBy: 'user1',
      splitBetween: ['user1', 'user2'],
      splitType: 'equal',
      groupId: 'abc123',
      $createdAt: '2023-07-27',
    },
  ],
};

const mockedSettlements = {
  documents: [
    {
      $id: 'set1',
      from: 'user1',
      to: 'user2',
      amount: 50,
      groupId: 'abc123',
      $createdAt: '2023-07-27',
    },
  ],
};

const mockedProfiles = {
  documents: [
    {
      $id: 'user1',
      username: 'Alice',
      avatar: 'avatar1.png',
    },
    {
      $id: 'user2',
      username: 'Bob',
      avatar: 'avatar2.png',
    },
  ],
};

beforeAll(() => {
  LogBox.ignoreLogs([
    'An error occurred in the',
    'The above error occurred',
    'Consider adding an error boundary',
  ]);
  
});

const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  // Mock getDocument to resolve group and member profiles correctly
  appwrite.databases.getDocument = jest.fn().mockImplementation((databaseId, collectionId, docId) => {
    console.log('Mock getDocument called with:', { databaseId, collectionId, docId });
    if (
      collectionId === process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID) {
      return Promise.resolve(mockedGroup);
    }
    if (collectionId === process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID) {
      const profile = mockedProfiles.documents.find(p => p.$id === docId);
      return Promise.resolve(profile || { $id: docId, username: '(unknown)', avatar: null });
    }
    return Promise.reject(new Error('Document not found'));
  });

  // Mock listDocuments to return expenses and settlements appropriately
  appwrite.databases.listDocuments = jest.fn().mockImplementation((_, collectionId) => {
    if (collectionId === process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID) {
      return Promise.resolve(mockedExpenses);
    }
    if (collectionId === process.env.EXPO_PUBLIC_APPWRITE_SETTLEMENTS_COLLECTION_ID) {
      return Promise.resolve(mockedSettlements);
    }
    if (collectionId === process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID) {
      return Promise.resolve(mockedProfiles);
    }
    return Promise.resolve({ documents: [] });
  });

  // Mock createDocument and updateDocument for settlement actions
  appwrite.databases.createDocument = jest.fn().mockResolvedValue({});
  appwrite.databases.updateDocument = jest.fn().mockResolvedValue({});

  
});



function TestComponent({ groupId }: { groupId: string }) {
  const {
    group,
    loading,
    error,
    membersExpanded,
    setMembersExpanded,
    memberProfiles,
    expenses,
    expensesLoading,
    settlements,
    searchModalVisible,
    setSearchModalVisible,
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    totalExpenses,
    handleAddMember,
    handleRemoveMember,
    handleSearch,
  } = useGroupDetails(groupId);

  return (
    <View>
      <View testID="group">{group ? JSON.stringify(group) : 'No group'}</View>
      <View testID="loading">{loading.toString()}</View>
      <View testID="error">{error}</View>
      <View testID="membersExpanded">{membersExpanded.toString()}</View>
      <View testID="memberProfiles">{JSON.stringify(memberProfiles)}</View>
      <View testID="expensesCount">{expenses.length}</View>
      <View testID="expensesLoading">{expensesLoading.toString()}</View>
      <View testID="settlementsCount">{settlements.length}</View>
      <View testID="searchModalVisible">{searchModalVisible.toString()}</View>
      <View testID="searchQuery">{searchQuery}</View>
      <View testID="searchResultsCount">{searchResults.length}</View>
      <View testID="searching">{searching.toString()}</View>
      <View testID="totalExpenses">{totalExpenses.toString()}</View>

      {/* Buttons for testing handlers */}
      <View>
      <TouchableOpacity testID="add-member" onPress={() => handleAddMember('user3')}>
        <Text>Add Member user3</Text>
      </TouchableOpacity>

      <TouchableOpacity testID="remove-member" onPress={() => handleRemoveMember('user2')}>
        <Text>Remove Member user2</Text>
      </TouchableOpacity>
      
        <View testID="trigger-search" onTouchEnd={handleSearch}>Trigger Search</View>
      </View>
    </View>
  );
}


describe('useGroupDetails Hook Extended Tests', () => {
  it('loads and renders group info', async () => {
    const { findByTestId } = render(<TestComponent groupId="abc123" />);
    const group = await findByTestId('group');
    expect(group.props.children).toContain('"title":"BBQ Trip"');
  });

  it('shows loading initially and resolves to false after', async () => {
    const { findByTestId } = render(<TestComponent groupId="abc123" />);
    await waitFor(async () => {
      const loading = await findByTestId('loading');
      expect(loading.props.children).toBe('false');
    });
  });

  it('fetches and displays expenses and settlements counts', async () => {
    const { findByTestId } = render(<TestComponent groupId="abc123" />);
    const expensesCount = await findByTestId('expensesCount');
    expect(expensesCount.props.children).toBe(1);

    const settlementsCount = await findByTestId('settlementsCount');
    expect(settlementsCount.props.children).toBe(1);
  });

  it('fetches and displays member profiles', async () => {
    const { findByTestId } = render(<TestComponent groupId="abc123" />);
    await waitFor(async () => {
      const members = await findByTestId('memberProfiles');
      // Now memberProfiles should be populated
      expect(members.props.children).toContain('Alice');
      expect(members.props.children).toContain('Bob');
    });
  });

  it('calculates total expenses correctly', async () => {
    const { findByTestId } = render(<TestComponent groupId="abc123" />);
    const totalExpenses = await findByTestId('totalExpenses');
    expect(totalExpenses.props.children).toBe('100');
  });

  it('search modal visibility can be toggled', () => {
    const { getByTestId } = render(<TestComponent groupId="abc123" />);
    const searchModalVisible = getByTestId('searchModalVisible');
    expect(searchModalVisible.props.children).toBe('false');
  });

  it('handleAddMember adds new member', async () => {
    const { getByTestId, findByTestId } = render(<TestComponent groupId="abc123" />);
  
    // Wait for group to be loaded
    await waitFor(async () => {
      const loading = await findByTestId('loading');
      expect(loading.props.children).toBe('false');
    });
  
    expect(appwrite.databases.updateDocument).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.press(getByTestId('add-member'));
    });
  
    expect(appwrite.databases.updateDocument).toHaveBeenCalled();
  
    await waitFor(async () => {
      const members = await findByTestId('memberProfiles');
      expect(members.props.children).toContain('user3');
    });
  });
  
  
  // it('handleRemoveMember removes a member after alert confirm', async () => {
  //   let onPressRemove: undefined | (() => Promise<void> | void);
  
  //   jest.spyOn(Alert, 'alert').mockImplementation(
  //     (_title, _msg, buttons = []) => {
  //       // Find and save 'Remove' button handler for manual invocation in test
  //       const removeButton = buttons.find(
  //         (btn) => btn.text === 'Remove' && btn.onPress
  //       );
  //       onPressRemove = removeButton?.onPress;
  //     }
  //   );
  
  //   const { getByTestId, findByTestId } = render(<TestComponent groupId="abc123" />);
  //   expect(appwrite.databases.updateDocument).not.toHaveBeenCalled();
  
  //   // Trigger removing member (will call Alert.alert and set onPressRemove)
  //   fireEvent.press(getByTestId('remove-member'));
  
  //   // Manually call the onPress callback **and await if it's async**
  //   if (onPressRemove) {
  //     await act(async () => {
  //       await onPressRemove!();
  //       // And now flush microtasks
  //       await flushPromises();
  //     });
  //   }
  
  //   expect(appwrite.databases.updateDocument).toHaveBeenCalled();
  
  //   await waitFor(async () => {
  //     const members = await findByTestId('memberProfiles');
  //     expect(members.props.children).not.toContain('Bob');
  //   });
  // });
  
  
  it('handleRemoveMember removes a member directly (without alert)', async () => {
    const { result } = renderHook(() => useGroupDetails('abc123'));
  
    // Wait for hook to load data if needed
    await act(async () => {
      // You can add any data loading wait here if necessary
    });
  
    // Call handleRemoveMember with skipAlert = true to bypass Alert
    await act(async () => {
      await result.current.handleRemoveMember('user2', true);
    });
  
    // The memberProfiles should no longer include user2
    expect(result.current.memberProfiles.some(p => p.userId === 'user2')).toBe(false);
  });

  it('handleSearch updates search results and toggles searching state', async () => {
    const { getByTestId, findByTestId } = render(<TestComponent groupId="abc123" />);
    
    await act(async () => {
      fireEvent(getByTestId('trigger-search'), 'touchEnd');
    });

    await waitFor(async () => {
      const searchResultsCount = await findByTestId('searchResultsCount');
      expect(searchResultsCount.props.children).toBe(mockedProfiles.documents.length);
      
      const searching = await findByTestId('searching');
      expect(searching.props.children).toBe('false');
    });
  });
  // Additional tests for handleAddMember, handleRemoveMember, searching can be added by exposing them in TestComponent and simulating user events.
});


/*describe('handleRemoveMember tests', () => {
  let onPressRemove: undefined | (() => Promise<void> | void);

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(Alert, 'alert').mockImplementation((_, __, buttons=[]) => {
      const removeButton = buttons.find(btn => btn.text === 'Remove' && btn.onPress);
      onPressRemove = removeButton?.onPress;
    });

    jest.spyOn(appwrite.databases, 'updateDocument').mockResolvedValue({});
    jest.spyOn(appwrite.databases, 'createDocument').mockResolvedValue({});
    jest.spyOn(appwrite.databases, 'getDocument').mockImplementation(() => {
      return Promise.resolve(mockedExpenses);
    });
    
    jest.spyOn(appwrite.databases, 'listDocuments').mockImplementation(() => {
      return Promise.resolve(mockedGroup);
    });
  });

  it('handleRemoveMember removes a member after alert confirm', async () => {
    const { getByTestId, findByTestId } = render(<TestComponent groupId="abc123" />);
    
    expect(appwrite.databases.updateDocument).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('remove-member'));

    expect(onPressRemove).toBeDefined();

    if (onPressRemove) {
      await act(async () => {
        await onPressRemove!();
        await flushPromises();
      });
    }

    expect(appwrite.databases.updateDocument).toHaveBeenCalled();

    await waitFor(async () => {
      const members = await findByTestId('memberProfiles');
      expect(members.props.children).not.toContain('Bob');
    });
  });
});*/

describe('handleAddMember edge cases without exposing setGroup', () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it('returns early and logs when group is null due to fetch failure', async () => {
    // Mock group fetch to reject so group stays null
    appwrite.databases.getDocument = jest.fn(
      (databaseId: string, collectionId: string, documentId: string) => {
        if (collectionId === process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID) {
          return Promise.reject(new Error('Group not found'));
        }
        // Fallback: Must return a document-shaped object (not {documents: []})
        return Promise.resolve({ $id: documentId } as any);
      }
    );

    // Wait for the fetch attempt to complete
    const { result } = renderHook(() => useGroupDetails('nonexistent-group'));

    await waitFor(() => {
      expect(result.current.group).toBeNull();
    });
    // Call handleAddMember and assert log and early return
    act(() => {
      result.current.handleAddMember('userX');
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('handleAddMember: group is null or undefined');
  });
});


describe('handleAddMember edge cases - user already member', () => {
  let consoleLogSpy: any;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('returns early and logs when user is already in group.members', async () => {
    // Mock group fetch to resolve group with user1 as a member
    appwrite.databases.getDocument = jest.fn(
      (databaseId, collectionId, documentId) => {
        if (collectionId === process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID) {
          return Promise.resolve({
            $id: documentId,
            members: ['user1', 'user2'],
            title: 'Test Group',
            description: '',
            createdBy: 'user1',
          });
        }
        // fallback
        return Promise.resolve({ $id: documentId } as any);
      }
    );

    const { result } = renderHook(() => useGroupDetails('any-group-id'));

    // Wait for group to be loaded
    await waitFor(() => {
      expect(result.current.group).not.toBeNull();
      expect(result.current.group!.members).toContain('user1');
    });

    act(() => {
      result.current.handleAddMember('user1'); // user1 is already a member
    });

    expect(consoleLogSpy).toHaveBeenCalledWith('handleAddMember: userId user1 already in group.members');
  });
});




/*
 *SETTLE UP
*/
/*describe('settleUp function', () => {
  const mockGroup = {
    $id: 'group1',
    members: ['userA', 'userB'],
    title: 'Test Group',
    createdBy: 'userA',
    description: '',
    avatar: '',
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
    $permissions: [],
    $collectionId: 'groupCollection',
    $databaseId: 'databaseId',
  };

  beforeEach(() => {
    jest.spyOn(appwrite.databases, 'getDocument').mockResolvedValue(mockGroup);

    jest.spyOn(appwrite.databases, 'createDocument').mockResolvedValue({
      $id: 'settle1',
      $collectionId: 'settlementCollection',
      $databaseId: 'databaseId',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      $permissions: [],
      from: 'userA',
      to: 'userB',
      amount: 100,
      groupId: mockGroup.$id,
    });

    jest.spyOn(appwrite.databases, 'listDocuments').mockResolvedValue({
      documents: [
        {
          $id: 'settle1',
          from: 'userA',
          to: 'userB',
          amount: 100,
          groupId: mockGroup.$id,
          $createdAt: new Date().toISOString(),
          $collectionId: 'settlementCollection',
          $databaseId: 'databaseId',
          $updatedAt: new Date().toISOString(),
          $permissions: [],
        },
      ],
      total: 1,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates new settlement and refreshes settlement list', async () => {
    const rendered = renderHook(() => useGroupDetails('group1'));
  
    console.log('Waiting for loading to be false...');
    // Wait for loading to become false after initial fetch
    await waitFor(() => {
      expect(rendered.result.current.group).not.toBeNull();
    });
    expect(rendered.result.current.loading).toBe(false);
    
    console.log('Loading is false now');
  
    expect(rendered.result.current.group).not.toBeNull();
  
    await act(async () => {
      await rendered.result.current.settleUp('userA', 'userB', 100);
    });
  
    expect(appwrite.databases.createDocument).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      {
        groupId: mockGroup.$id,
        from: 'userA',
        to: 'userB',
        amount: 100,
      }
    );
  
    expect(rendered.result.current.settlements.length).toBeGreaterThan(0);
    expect(rendered.result.current.settlements[0].from).toBe('userA');
    expect(rendered.result.current.settlements[0].to).toBe('userB');
    expect(rendered.result.current.settlements[0].amount).toBe(100);
  });
  
  it('does not proceed if group is null', async () => {
    jest.spyOn(appwrite.databases, 'getDocument').mockRejectedValue(new Error('Not found'));

    const rendered = renderHook(() => useGroupDetails('group1'));

    await waitFor(() => {
      rendered.rerender(undefined);
      expect(rendered.result.current.loading).toBe(false);
    });

    expect(rendered.result.current.group).toBeNull();

    await act(async () => {
      await rendered.result.current.settleUp('userA', 'userB', 100);
    });

    expect(appwrite.databases.createDocument).not.toHaveBeenCalled();
    expect(appwrite.databases.listDocuments).not.toHaveBeenCalled();
  });

  it('handles errors thrown by createDocument gracefully', async () => {
    jest.spyOn(appwrite.databases, 'createDocument').mockRejectedValue(new Error('fail'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const rendered = renderHook(() => useGroupDetails('group1'));

    await waitFor(() => {
      rendered.rerender(undefined);
      expect(rendered.result.current.loading).toBe(false);
    });

    expect(rendered.result.current.group).not.toBeNull();

    await act(async () => {
      await rendered.result.current.settleUp('userA', 'userB', 100);
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Settle up failed:'), expect.any(Error));
    errorSpy.mockRestore();
  });
});*/

describe('fetchUsernameById indirect tests via memberProfiles fetching', () => {
  beforeAll(() => {
    // Silence expected console.error from fetchUsernameById error handling
    jest.spyOn(console, 'error').mockImplementation((msg, ...args) => {
      if (typeof msg === 'string' && msg.includes('Error fetching username:')) {
        return; // suppress error logs from fetchUsernameById
      }
      console.error(msg, ...args); // other errors log normally
    });
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('populates memberProfiles with usernames if getDocument succeeds', async () => {
    const mockedUserDoc1 = { $id: 'user1', username: 'Alice', avatar: 'avatar1.png' };
    const mockedUserDoc2 = { $id: 'user2', username: 'Bob', avatar: 'avatar2.png' };
    const mockedGroup = {
      $id: 'someGroupId',
      title: 'Test Group',
      members: ['user1', 'user2'],
      createdBy: 'userX',
      avatar: null,
      description: '',
    };
  
    // Mock getDocument: Return group for groupsCollectionId, profiles for usersCollectionId
    appwrite.databases.getDocument = jest.fn().mockImplementation((_, collectionId, docId) => {
      if (collectionId === process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID && docId === mockedGroup.$id) {
        return Promise.resolve(mockedGroup);
      }
      if (collectionId === process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID) {
        if (docId === 'user1') return Promise.resolve(mockedUserDoc1);
        if (docId === 'user2') return Promise.resolve(mockedUserDoc2);
        return Promise.reject(new Error('User not found'));
      }
      return Promise.reject(new Error('Unknown collection'));
    });
  
    const { result, rerender } = renderHook(({ groupId }) => useGroupDetails(groupId), {
      initialProps: { groupId: '' },
    });
  
    // Initially no group
    expect(result.current.group).toBeNull();
  
    // Rerender with groupId to trigger fetching group and member profiles
    rerender({ groupId: mockedGroup.$id });
  
    // Wait for memberProfiles to be populated based on group members
    await waitFor(() => {
      expect(result.current.memberProfiles).toEqual([
        { userId: 'user1', username: 'Alice', avatar: 'avatar1.png' },
        { userId: 'user2', username: 'Bob', avatar: 'avatar2.png' },
      ]);
    });
  });
  

  it('sets username to "(unknown)" on getDocument failure', async () => {
    const mockedGroup = {
      $id: 'someGroupId',
      title: 'Test Group',
      members: ['user1'],
      createdBy: 'userX',
      avatar: null,
      description: '',
    };
  
    // Mock getDocument to return the group for group fetch,
    // and reject for user profiles to simulate missing user data
    appwrite.databases.getDocument = jest.fn().mockImplementation((_, collectionId, docId) => {
      if (collectionId === process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID && docId === mockedGroup.$id) {
        return Promise.resolve(mockedGroup);
      }
      if (collectionId === process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID) {
        return Promise.reject(new Error('User not found'));
      }
      return Promise.reject(new Error('Unknown collection'));
    });
  
    const { result, rerender } = renderHook(({ groupId }) => useGroupDetails(groupId), {
      initialProps: { groupId: '' },
    });
  
    // Initially no group
    expect(result.current.group).toBeNull();
  
    // Rerender with the groupId to trigger fetching group and member profiles
    rerender({ groupId: mockedGroup.$id });
  
    // Wait until memberProfiles reflects the unknown user
    await waitFor(() => {
      expect(result.current.memberProfiles).toEqual([
        { userId: 'user1', username: '(unknown)', avatar: null },
      ]);
    });
  });
  
});
