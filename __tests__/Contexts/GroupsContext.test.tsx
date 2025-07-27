import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import { GroupsProvider, GroupsContext, GroupsContextType } from '@/contexts/GroupsContext';
import { UserContext } from '@/contexts/UserContext';
import { Text, Button } from 'react-native';
import { Group } from '@/types';

// 1: Robust, full-shape provider to match your UserContext expectations
const mockUserContextValue = (user: { $id: string; email: string } | null = { $id: 'user1', email: 'test@example.com' }) => ({
  user,
  profile: null,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  updateProfile: jest.fn(),
  authChecked: true,
  refetchProfile: jest.fn(),
});

type MockUserProviderProps = {
  children: React.ReactNode;
  user?: { $id: string; email: string } | null;
};

function MockUserProvider({
  children,
  user = { $id: 'user1', email: 'test@example.com' },
}: MockUserProviderProps) {
  // Always produce a fresh object to force context update
  const value = React.useMemo(() => mockUserContextValue(user), [user]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
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
      <Button
        testID="add-group"
        title="Add Group"
        onPress={async () => {
          await createGroup({ title: 'New Group', description: 'desc' });
        }}
      />
      <Button
        testID="delete-group"
        title="Delete Group"
        onPress={async () => {
          if (groups.length > 0) {
            await deleteGroup(groups[0].$id);
          }
        }}
      />
    </>
  );
}

let errorSpy: jest.SpyInstance;

beforeEach(() => {
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.clearAllMocks();
});
afterEach(() => {
  errorSpy.mockRestore();
});

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

describe('GroupsContext', () => {
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
      fireEvent.press(getByTestId('add-group'));
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
      fireEvent.press(getByTestId('delete-group'));
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
            {value => {
              contextValue.current = value!;
              return null;
            }}
          </GroupsContext.Consumer>
        </GroupsProvider>
      </MockUserProvider>
    );
    let group: Group | undefined;
    await act(async () => {
      group = await contextValue.current!.fetchGroupsById('group42');
    });
    expect(group).toBeDefined();
    expect(group!.$id).toBe('group42');
    expect(group!.title).toBe('Fetched Group');
  });

  it('handles error in fetchGroupsById', async () => {
    const contextValue = { current: undefined as GroupsContextType | undefined };
    render(
      <MockUserProvider>
        <GroupsProvider>
          <GroupsContext.Consumer>
            {value => {
              contextValue.current = value!;
              return null;
            }}
          </GroupsContext.Consumer>
        </GroupsProvider>
      </MockUserProvider>
    );
    await act(async () => {
      await expect(
        contextValue.current!.fetchGroupsById('bad-id')
      ).rejects.toThrow('Not found');
    });
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to fetch groups: by Id',
      expect.any(Error)
    );
  });

  it('throws error if user is not authenticated in createGroup', async () => {
    expect.assertions(1);
    const contextValue = { current: undefined as GroupsContextType | undefined };
    render(
      <MockUserProvider user={null}>
        <GroupsProvider>
          <GroupsContext.Consumer>
            {value => {
              contextValue.current = value!;
              return null;
            }}
          </GroupsContext.Consumer>
        </GroupsProvider>
      </MockUserProvider>
    );
    await expect(
      contextValue.current!.createGroup({ title: 'x' })
    ).rejects.toThrow('User not authenticated');
  });

  it('handles error in deleteGroup', async () => {
    const contextValue = { current: undefined as GroupsContextType | undefined };
    render(
      <MockUserProvider>
        <GroupsProvider>
          <GroupsContext.Consumer>
            {value => {
              contextValue.current = value!;
              return null;
            }}
          </GroupsContext.Consumer>
        </GroupsProvider>
      </MockUserProvider>
    );
    await act(async () => {
      await expect(
        contextValue.current!.deleteGroup('bad-id')
      ).rejects.toThrow('Delete failed');
    });
  });

  // 4: TEST FOR CLEARING ON LOGOUT — using user={null}
  it('clears groups when user logs out', async () => {
    const { rerender, getByTestId } = render(
      <MockUserProvider>
        <GroupsProvider>
          <TestGroupsComponent />
        </GroupsProvider>
      </MockUserProvider>
    );

    await waitFor(() => {
      expect(getByTestId('group-count').props.children).toBe(1);
    });

    rerender(
      <MockUserProvider user={null}>
        <GroupsProvider>
          <TestGroupsComponent />
        </GroupsProvider>
      </MockUserProvider>
    );

    await waitFor(() => {
      expect(getByTestId('group-count').props.children).toBe(0);
    });
  });

  it('throws error when GroupsContext is not provided at all', () => {
    const BrokenComponent = () => {
      const ctx = React.useContext(GroupsContext);
      if (!ctx) throw new Error('GroupsContext is not provided');
      return null;
    };
    expect(() => {
      render(<BrokenComponent />);
    }).toThrow('GroupsContext is not provided');
  });
});
