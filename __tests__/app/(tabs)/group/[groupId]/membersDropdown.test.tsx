/**
 * Test suite for MembersDropdown component
 * Covers rendering, interaction, routing, and callbacks.
 * Uses mocks for Expo Router and verifies UI behavior on toggle, navigation, removal, and adding member.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MembersDropdown from '@/app/(tabs)/group/[groupId]/membersDropdown';
import { useRouter } from 'expo-router';

// Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

describe('MembersDropdown', () => {
  const mockPush = jest.fn();
  const currentUserId = 'user1';
  const group = { $id: 'group1', title: 'Test Group', members: ['user1', 'user2'], createdBy: 'user1' };
  const memberProfiles = [
    { userId: 'user1', username: 'Alice', avatar: 'avatar1.png' },
    { userId: 'user2', username: 'Bob', avatar: 'avatar2.png' },
  ];
  const emptyMemberProfiles: typeof memberProfiles = [];

  beforeEach(() => {
    // Reset mocks & provide router mock
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('renders header and toggle button with correct initial state', () => {
    const { getByText } = render(
      <MembersDropdown
        currentUserId={currentUserId}
        group={group}
        membersExpanded={false}
        setMembersExpanded={() => {}}
        memberProfiles={memberProfiles}
        handleRemoveMember={() => {}}
        setSearchModalVisible={() => {}}
      />
    );
    expect(getByText('Group Members')).toBeTruthy();
    expect(getByText('Show Members')).toBeTruthy();
  });

  it('toggles membersExpanded when toggle button is pressed', () => {
    let expanded = false;
    const setMembersExpanded = jest.fn((fn) => {
      expanded = fn(expanded);
    });

    const { getByText, rerender } = render(
      <MembersDropdown
        currentUserId={currentUserId}
        group={group}
        membersExpanded={expanded}
        setMembersExpanded={setMembersExpanded}
        memberProfiles={memberProfiles}
        handleRemoveMember={() => {}}
        setSearchModalVisible={() => {}}
      />
    );

    const toggleButton = getByText('Show Members');
    fireEvent.press(toggleButton);

    expect(setMembersExpanded).toHaveBeenCalled();

    // Rerender with updated state
    rerender(
      <MembersDropdown
        currentUserId={currentUserId}
        group={group}
        membersExpanded={expanded}
        setMembersExpanded={setMembersExpanded}
        memberProfiles={memberProfiles}
        handleRemoveMember={() => {}}
        setSearchModalVisible={() => {}}
      />
    );

    if (expanded) {
      expect(getByText('Hide Members')).toBeTruthy();
    }
  });

  it('shows "No members." message when memberProfiles is empty and expanded', () => {
    const { getByText } = render(
      <MembersDropdown
        currentUserId={currentUserId}
        group={group}
        membersExpanded={true}
        setMembersExpanded={() => {}}
        memberProfiles={emptyMemberProfiles}
        handleRemoveMember={() => {}}
        setSearchModalVisible={() => {}}
      />
    );

    expect(getByText('No members.')).toBeTruthy();
  });

  it('renders member list with remove button for other members', () => {
    const handleRemoveMember = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <MembersDropdown
        currentUserId={currentUserId}
        group={group}
        membersExpanded={true}
        setMembersExpanded={() => {}}
        memberProfiles={memberProfiles}
        handleRemoveMember={handleRemoveMember}
        setSearchModalVisible={() => {}}
      />
    );
  
    // Current user should NOT have remove button
    expect(queryByTestId('remove-btn-user1')).toBeNull();
  
    // Other member should have remove button
    const removeButton = getByTestId('remove-btn-user2');
    expect(removeButton).toBeTruthy();
  
    fireEvent.press(removeButton);
    expect(handleRemoveMember).toHaveBeenCalledWith('user2');
  });
  
  it('navigates to user profile when member pressed', () => {
    const { getByTestId } = render(
      <MembersDropdown
        currentUserId={currentUserId}
        group={group}
        membersExpanded={true}
        setMembersExpanded={() => {}}
        memberProfiles={memberProfiles}
        handleRemoveMember={() => {}}
        setSearchModalVisible={() => {}}
      />
    );
  
    const memberTouchable = getByTestId('member-user2');
    fireEvent.press(memberTouchable);
  
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/user/[userId]',
      params: { userId: 'user2', groupId: 'group1' },
    });
  });
  

  it('calls setSearchModalVisible when Add Member button pressed', () => {
    const setSearchModalVisible = jest.fn();

    const { getByText } = render(
      <MembersDropdown
        currentUserId={currentUserId}
        group={group}
        membersExpanded={true}
        setMembersExpanded={() => {}}
        memberProfiles={memberProfiles}
        handleRemoveMember={() => {}}
        setSearchModalVisible={setSearchModalVisible}
      />
    );

    const addButton = getByText('+ Add Member');
    fireEvent.press(addButton);

    expect(setSearchModalVisible).toHaveBeenCalledWith(true);
  });

  //Snapshots
  it('matches snapshot when collapsed', () => {
    const tree = render(
      <MembersDropdown
        currentUserId={currentUserId}
        group={group}
        membersExpanded={false}
        setMembersExpanded={() => {}}
        memberProfiles={memberProfiles}
        handleRemoveMember={() => {}}
        setSearchModalVisible={() => {}}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('matches snapshot when expanded with members', () => {
    const tree = render(
      <MembersDropdown
        currentUserId={currentUserId}
        group={group}
        membersExpanded={true}
        setMembersExpanded={() => {}}
        memberProfiles={memberProfiles}
        handleRemoveMember={() => {}}
        setSearchModalVisible={() => {}}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('matches snapshot when expanded with no members', () => {
    const tree = render(
      <MembersDropdown
        currentUserId={currentUserId}
        group={group}
        membersExpanded={true}
        setMembersExpanded={() => {}}
        memberProfiles={emptyMemberProfiles}
        handleRemoveMember={() => {}}
        setSearchModalVisible={() => {}}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
