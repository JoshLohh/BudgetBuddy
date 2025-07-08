import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { GroupsProvider, GroupsContext } from '@/contexts/GroupsContext';
import { UserContext } from '@/contexts/UserContext';
import { Text } from 'react-native';

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

function MockUserProvider({ children, user = { $id: 'user1', email: 'test@example.com' } }) {
  const mockProfile = { userId: 'user1', username: 'Test User' };
  return (
    <UserContext.Provider value={{
      user,
      profile: mockProfile,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      updateProfile: jest.fn(),
      refetchProfile: jest.fn()
    }}>
      {children}
    </UserContext.Provider>
  );
}

function TestGroupsComponent() {
  const { groups, fetchGroups, createGroup, deleteGroup } = React.useContext(GroupsContext);
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
    let contextValue;
    render(
      <MockUserProvider>
        <GroupsProvider>
          <GroupsContext.Consumer>
            {value => { contextValue = value; return null; }}
          </GroupsContext.Consumer>
        </GroupsProvider>
      </MockUserProvider>
    );
    const group = await contextValue.fetchGroupsById('group42');
    expect(group).toBeDefined();
    expect(group.id).toBe('group42');
    expect(group.title).toBe('Fetched Group');
  });

  it('handles error in fetchGroupsById', async () => {
    let contextValue;
    render(
      <MockUserProvider>
        <GroupsProvider>
          <GroupsContext.Consumer>
            {value => { contextValue = value; return null; }}
          </GroupsContext.Consumer>
        </GroupsProvider>
      </MockUserProvider>
    );
    await expect(contextValue.fetchGroupsById('bad-id')).rejects.toThrow('Not found');
  });

  it('throws error if user is not authenticated in createGroup', async () => {
    let contextValue;
    render(
      <MockUserProvider user={null}>
        <GroupsProvider>
          <GroupsContext.Consumer>
            {value => { contextValue = value; return null; }}
          </GroupsContext.Consumer>
        </GroupsProvider>
      </MockUserProvider>
    );
    await expect(contextValue.createGroup({ title: 'x' })).rejects.toThrow('User not authenticated');
  });

  it('handles error in deleteGroup', async () => {
    let contextValue;
    render(
      <MockUserProvider>
        <GroupsProvider>
          <GroupsContext.Consumer>
            {value => { contextValue = value; return null; }}
          </GroupsContext.Consumer>
        </GroupsProvider>
      </MockUserProvider>
    );
    await expect(contextValue.deleteGroup('bad-id')).rejects.toThrow('Delete failed');
  });

  it('clears groups when user logs out', async () => {
    const mockUser = { $id: 'user1', email: 'test@example.com' };
    const mockProfile = { userId: 'user1', username: 'Test User' };
    const { rerender, getByTestId } = render(
      <UserContext.Provider value={{ user: mockUser, profile: mockProfile }}>
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
      <UserContext.Provider value={{ user: null, profile: null }}>
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
