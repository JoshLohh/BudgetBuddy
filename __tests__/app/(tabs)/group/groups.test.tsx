/**
 * Detailed test suite for GroupsScreen.
 * - Mocks useGroups, useUser, GroupsContext, and useRouter.
 * - Stubs Appwrite database calls to isolate network operations.
 * - Tests rendering, filtering, navigation, modal open/close, leave/delete group.
 * - Tests user interactions with confirmation modals.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import GroupsScreen from '@/app/(tabs)/group/groups';
import { useGroups } from '@/hooks/useGroups';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'expo-router';
import { GroupsContext } from '@/contexts/GroupsContext';
import * as appwrite from '@/lib/appwrite'; // database module
import renderer from 'react-test-renderer';


// Mock hooks and router
jest.mock('@/hooks/useGroups');
jest.mock('@/hooks/useUser');
jest.mock('expo-router');

// Mock console to suppress expected errors in tests
jest.spyOn(global.console, 'error').mockImplementation(() => {});

// Mock implementations for Appwrite database calls with correct $permissions and structure
const mockUpdateDocument = jest
  .spyOn(appwrite.databases, 'updateDocument')
  .mockImplementation(
    async (_databaseId, _collectionId, documentId, data) => ({
      $id: String(documentId), // documentId param always present!
      $collectionId: 'mockCollectionId',
      $databaseId: 'mockDatabaseId',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      $permissions: ['*'],                 // Correct permission field name with leading $
      ...(data || {}),                    // Spread updated doc fields at top level
    })
  );

const mockDeleteDocument = jest
  .spyOn(appwrite.databases, 'deleteDocument')
  .mockImplementation(() =>
    Promise.resolve({
      $id: 'deletedId',
      $collectionId: 'mockCollectionId',
      $databaseId: 'mockDatabaseId',
      $createdAt: new Date().toISOString(),
      $updatedAt: new Date().toISOString(),
      $permissions: ['*'],
    })
  );

const mockGetDocument = jest
  .spyOn(appwrite.databases, 'getDocument')
  .mockImplementation(async (dbId, collId, docId) => ({
    $id: docId,
    $collectionId: collId,
    $databaseId: dbId,
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
    $permissions: ['*'],
    // Return mock user data for creator info fetch
    username: `User_${docId}`,
    avatar: null,
  }));

// Sample mock groups data
const groupsMock = [
  {
    $id: '1',
    title: 'Group One',
    description: 'First group description',
    members: ['user1'],
    createdBy: 'user1',
    avatar: null,
  },
  {
    $id: '2',
    title: 'Group Two',
    description: 'Second group description',
    members: ['user1', 'user2'],
    createdBy: 'user2',
    avatar: null,
  },
];

const mockDeleteGroup = jest.fn();
const mockFetchGroups = jest.fn();

describe('GroupsScreen', () => {
  const mockUseGroups = useGroups as jest.Mock;
  const mockUseUser = useUser as jest.Mock;
  const mockUseRouter = useRouter as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock returns
    mockUseUser.mockReturnValue({ user: { $id: 'user1' } });
    mockUseGroups.mockReturnValue({
      groups: groupsMock,
      fetchGroups: mockFetchGroups,
    });
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      navigate: jest.fn(),
    });
  });

  function renderWithContext(ui: React.ReactElement, groups = groupsMock) {
    return render(
      <GroupsContext.Provider
        value={{
          groups,
          fetchGroups: mockFetchGroups,
          createGroup: jest.fn(),
          deleteGroup: mockDeleteGroup,
          fetchGroupsById: jest.fn(),
        }}
      >
        {ui}
      </GroupsContext.Provider>
    );
  }
  

  it('renders groups list with titles and descriptions', () => {
    const { getByText } = renderWithContext(<GroupsScreen />);
    expect(getByText('Group One')).toBeTruthy();
    expect(getByText('First group description')).toBeTruthy();
    expect(getByText('Group Two')).toBeTruthy();
    expect(getByText('Second group description')).toBeTruthy();
  });

  it('filters groups when typing in search input', () => {
    const { getByPlaceholderText, queryByText } = renderWithContext(<GroupsScreen />);
    const searchInput = getByPlaceholderText('Search groups...');
    fireEvent.changeText(searchInput, 'Two');
    expect(queryByText('Group One')).toBeNull();
    expect(queryByText('Group Two')).toBeTruthy();
  });

  it('navigates to group details on group press', () => {
    const router = mockUseRouter();
    const { getByText } = renderWithContext(<GroupsScreen />);
    fireEvent.press(getByText('Group One'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/group/[groupId]', params: { groupId: '1' } });
  });

  it('opens group info modal and fetches creator info on menu button press', async () => {
    const { getAllByTestId, getByText, queryByText, getByTestId } = renderWithContext(<GroupsScreen />);
    
    // Press the menu button for first group to open modal
    const menuButtons = getAllByTestId('menu-button');
    fireEvent.press(menuButtons[0]);
    
    // Wait for creator info fetch & update
    await waitFor(() => {
      expect(getByText('Created By:')).toBeTruthy();
      expect(getByText('User_user1')).toBeTruthy();
    });
  
    // Close modal (assuming 'Close' button)
    fireEvent.press(getByTestId('modal-close-btn'));
    expect(queryByText('Created By:')).toBeNull();
  });
  

  it('calls updateDocument to remove user when leaving multi-member group', async () => {
    const { getAllByTestId, getByText } = renderWithContext(<GroupsScreen />);
  
    // Open modal menu for second group (index 1)
    const menuButtons = getAllByTestId('menu-button');
    fireEvent.press(menuButtons[1]);
  
    // Wait for the Leave & Exit Group button to appear
    await waitFor(() => getByText('Leave & Exit Group'));
  
    jest.spyOn(global.console, 'log').mockImplementation(() => {}); // suppress logs
  
    await act(async () => {
      fireEvent.press(getByText('Leave & Exit Group'));
    });
  
    // Confirm updateDocument called to remove user
    expect(mockUpdateDocument).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      groupsMock[1].$id,
      expect.objectContaining({
        members: groupsMock[1].members.filter((id) => id !== 'user1'),
      })
    );
  });
  

  it('calls deleteGroup when leaving a group with only one member', async () => {
    const singleMemberGroup = {
      $id: '3',
      title: 'Solo Group',
      description: 'Only member',
      members: ['user1'],
      createdBy: 'user1',
      avatar: null,
    };
  
    // Override useGroups hook for this test only!
    mockUseGroups.mockReturnValue({
      groups: [singleMemberGroup],
      fetchGroups: mockFetchGroups,
    });
  
    const { getAllByTestId, getByText } = renderWithContext(<GroupsScreen />);
  
    // Open modal menu for the solo group (should be at index 0 if only one)
    const menuButtons = getAllByTestId('menu-button');
    fireEvent.press(menuButtons[0]);
  
    await waitFor(() => getByText('Leave & Exit Group'));
  
    jest.spyOn(global.console, 'log').mockImplementation(() => {});
  
    await act(async () => {
      fireEvent.press(getByText('Leave & Exit Group'));
    });
  
    expect(mockDeleteGroup).toHaveBeenCalledWith(singleMemberGroup.$id);
  });
  
  

  it('shows empty state when no groups available', () => {
    // Override hook to return empty groups
    mockUseGroups.mockReturnValue({ groups: [], fetchGroups: mockFetchGroups });
    const { getByText } = renderWithContext(<GroupsScreen />);
    expect(getByText('No groups found. Create one!')).toBeTruthy();
  });

  it('shows loading indicator when loading is true', () => {
    mockUseGroups.mockReturnValue({
      groups: [],
      fetchGroups: mockFetchGroups,
    });
  
    // Render component with loading set manually through prop for test purposes
    const { getByTestId } = renderWithContext(<GroupsScreen initialLoading={true} />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('navigates to create group screen when Create Group button is pressed', () => {
    const navigateMock = jest.fn();
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      navigate: navigateMock,
    });
  
    // Arrange: render GroupsScreen with default groups
    const { getByText } = renderWithContext(<GroupsScreen />);
  
    // Act: press the Create Group button
    fireEvent.press(getByText('Create Group'));
  
    // Assert: router.navigate called with '../create'
    expect(navigateMock).toHaveBeenCalledWith('../create');
  });

  it('hides the modal when pressing on the overlay', async () => {
    // Render normally with mock groups
    const setMenuVisibleIdMock = jest.fn();  

    const { getAllByTestId, getByTestId } = renderWithContext(<GroupsScreen />);
  
    // Open the modal for the first group by pressing its menu button
    fireEvent.press(getAllByTestId('menu-button')[0]);
  
    // Wait for modal to be visible (modalOverlay to appear)
    const overlay = await waitFor(() => getByTestId('modalOverlay'));
  
    // Press overlay to close modal
    fireEvent.press(overlay);

    await waitFor(() => {
      expect(() => getByTestId('modalOverlay')).toThrow();
    });
  });
  
});
