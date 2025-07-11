import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { GroupsProvider, GroupsContext, GroupsContextType } from '@/contexts/GroupsContext';
import { UserContext } from '@/contexts/UserContext';
import { Text } from 'react-native';
import { Group } from '@/types';

let errorSpy: jest.SpyInstance;

beforeEach(() => {
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});

// Mock Appwrite SDK
jest.mock('@/lib/appwrite', () => ({
  databases: {
    listDocuments: jest.fn(() =>
      Promise.resolve({
        documents: [
          {
            $id: 'group1',
            title: 'Test Group',
            description: 'A group for testing',
            members: ['user1', 'user2'],
            createdBy: 'user1',
          },
        ],
      })
    ),
    createDocument: jest.fn((_db, _col, _id, groupData) =>
      Promise.resolve({
        $id: 'group2',
        ...groupData,
      })
    ),
    getDocument: jest.fn((db, col, id) =>
      id === 'bad-id'
        ? Promise.reject(new Error('Not found'))
        : Promise.resolve({
            $id: id,
            title: 'Fetched Group',
            description: 'Fetched Desc',
            members: ['user1'],
            createdBy: 'user1',
          })
    ),
    deleteDocument: jest.fn((db, col, id) =>
      id === 'bad-id'
        ? Promise.reject(new Error('Delete failed'))
        : Promise.resolve()
    ),
  },
}));

type MockUserProviderProps = {
  children: React.ReactNode;
  user?: { $id: string; email: string };
};

function MockUserProvider({ children, user = { $id: 'user1', email: 'test@example.com' } }: MockUserProviderProps) {
    const [mockUser, setMockUser] = React.useState(user);
    const mockProfile = { userId: 'user1', username: 'Test User' };
    return (
      <UserContext.Provider value={{
        user: mockUser,
        profile: mockProfile,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        updateProfile: jest.fn(),
        refetchProfile: jest.fn(),
        authChecked: true,
      }}>
        {children}
      </UserContext.Provider>
    );
  }


function TestGroupsComponent() {
  const context = React.useContext(GroupsContext);
  if (!context) throw new Error('GroupsContext is not provided');
  const { groups, fetchGroups, createGroup, deleteGroup } = context;
  React.useEffect(() => {
    fetchGroups();
  }, []);
  return (
    <>
      <Text testID="group-count">{groups.length}</Text>
      <Text
        testID="add-group"
        onPress={async () => {
          await createGroup({ title: 'New Group', description: 'desc' });
        }}
      >
        Add Group
      </Text>
      <Text
        testID="delete-group"
        onPress={async () => {
          if (groups.length > 0) {
            await deleteGroup(groups[0].id);
          }
        }}
      >
        Delete Group
      </Text>
    </>
  );
}

describe('GroupsContext', () => {
  it('fetches groups for the user', async () => {
    const { getByTestId } = render(
      <MockUserProvider>
        <GroupsProvider>
          <TestGroupsComponent />
        </GroupsProvider>
      </MockUserProvider>
    );
    await waitFor(() => {
      expect(getByTestId('group-count').props.children).toBe(1);
    });
  });

  it('creates a new group', async () => {
    const { getByTestId } = render(
      <MockUserProvider>
        <GroupsProvider>
          <TestGroupsComponent />
        </GroupsProvider>
      </MockUserProvider>
    );
    await waitFor(() => {
      expect(getByTestId('group-count').props.children).toBe(1);
    });
    await act(async () => {
      getByTestId('add-group').props.onPress();
    });
    await waitFor(() => {
      expect(getByTestId('group-count').props.children).toBe(2);
    });
  });

  it('deletes a group', async () => {
    const { getByTestId } = render(
      <MockUserProvider>
        <GroupsProvider>
          <TestGroupsComponent />
        </GroupsProvider>
      </MockUserProvider>
    );
    await waitFor(() => {
      expect(getByTestId('group-count').props.children).toBe(1);
    });
    await act(async () => {
      getByTestId('delete-group').props.onPress();
    });
    await waitFor(() => {
      expect(getByTestId('group-count').props.children).toBe(0);
    });
  });

  it('fetches a group by ID', async () => {
    const contextValue = { current: undefined as GroupsContextType | undefined };
    render(
      <MockUserProvider>
        <GroupsProvider>
          <GroupsContext.Consumer>
            {value => { contextValue.current = value; return null; }}
          </GroupsContext.Consumer>
        </GroupsProvider>
      </MockUserProvider>
    );
    let group: Group | undefined;
    await act(async () => {
      group = await contextValue.current!.fetchGroupsById('group42');
    });
    expect(group).toBeDefined();
    expect(group!.id).toBe('group42');
    expect(group!.title).toBe('Fetched Group');
  });

  it('handles error in fetchGroupsById', async () => {
    const contextValue = { current: undefined as GroupsContextType | undefined };
    render(
      <MockUserProvider>
        <GroupsProvider>
          <GroupsContext.Consumer>
            {value => { contextValue.current = value; return null; }}
          </GroupsContext.Consumer>
        </GroupsProvider>
      </MockUserProvider>
    );
    await act(async () => { 
      await expect(contextValue.current!.fetchGroupsById('bad-id')).rejects.toThrow('Not found');
    });
     // Assert that console.error was called with the expected arguments
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to fetch groups: by Id',
      expect.any(Error)
    );
  });

  it('throws error if user is not authenticated in createGroup', async () => {
    const contextValue = { current: undefined as GroupsContextType | undefined };
    render(
      <UserContext.Provider value={{
        user: undefined,
        profile: undefined,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        updateProfile: jest.fn(),
        refetchProfile: jest.fn(),
        authChecked: true,
      }}>
        <GroupsProvider>
          <GroupsContext.Consumer>
            {value => { contextValue.current = value; return null; }}
          </GroupsContext.Consumer>
        </GroupsProvider>
      </UserContext.Provider>
    );
    await act (async () => {
      await expect(contextValue.current!.createGroup({ title: 'x' })).rejects.toThrow('User not authenticated');
    });
  });




  it('handles error in deleteGroup', async () => {
    const contextValue = { current: undefined as GroupsContextType | undefined };
    render(
      <MockUserProvider>
        <GroupsProvider>
          <GroupsContext.Consumer>
            {value => { contextValue.current = value; return null; }}
          </GroupsContext.Consumer>
        </GroupsProvider>
      </MockUserProvider>
    );
    await act (async () => {
      await expect(contextValue.current!.deleteGroup('bad-id')).rejects.toThrow('Delete failed');
    });
  });

  it('clears groups when user logs out', async () => {
    const mockUser = { $id: 'user1', email: 'test@example.com' };
    const mockProfile = { userId: 'user1', username: 'Test User' };
    const { rerender, getByTestId } = render(
      <UserContext.Provider value={{
        user: mockUser,
        profile: mockProfile,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        refetchProfile: jest.fn(),
        authChecked: true, 
      }}>
        <GroupsProvider>
          <TestGroupsComponent />
        </GroupsProvider>
      </UserContext.Provider>
    );
    await waitFor(() => {
      expect(getByTestId('group-count').props.children).toBe(1);
    });
    // Simulate logout
    rerender(
      <UserContext.Provider value={{
        user: null,
        profile: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        updateProfile: jest.fn(),
        refetchProfile: jest.fn(),
        authChecked: true, 
      }}>
        <GroupsProvider>
          <TestGroupsComponent />
        </GroupsProvider>
      </UserContext.Provider>
    );
    await waitFor(() => {
      expect(getByTestId('group-count').props.children).toBe(0);
    });
  });
});
