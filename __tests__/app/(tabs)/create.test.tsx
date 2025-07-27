import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Create from '../../../app/(tabs)/create'; // Adjust path if needed

import * as useGroupsModule from '@/hooks/useGroups';
import * as useUserModule from '@/hooks/useUser';
import * as routerModule from 'expo-router';
import { Alert } from 'react-native';

describe('Create Component', () => {
  const mockCreateGroup = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(useGroupsModule, 'useGroups').mockReturnValue({
        createGroup: mockCreateGroup,
        groups: [],
        fetchGroups: jest.fn(),
        fetchGroupsById: jest.fn(),
        deleteGroup: jest.fn(),
    });

    jest.spyOn(useUserModule, 'useUser').mockReturnValue({
      user: { id: 'user-1', name: 'Test User' },
      authChecked: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
      refetchProfile: jest.fn(),
      profile: null,
    });

    jest.spyOn(routerModule, 'useRouter').mockReturnValue({
        replace: mockReplace,
        dismiss: jest.fn(),
        dismissTo: jest.fn(),
        dismissAll: jest.fn(),
        canDismiss: jest.fn(),
        back: jest.fn(),
        canGoBack: jest.fn(),
        push: jest.fn(),
        navigate: jest.fn(),
        setParams: jest.fn(),
        reload: jest.fn(),
        prefetch: jest.fn(),
    });

    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('shows validation alert if title is empty', () => {
    const { getByText } = render(<Create />);

    const submitBtn = getByText('Create Group');
    fireEvent.press(submitBtn);

    expect(Alert.alert).toHaveBeenCalledWith('Validation', 'Group title is required.');
    expect(mockCreateGroup).not.toHaveBeenCalled();
  });

  it('calls createGroup and navigates on successful submission', async () => {
    mockCreateGroup.mockResolvedValue({ id: 'group-1' });

    const { getByText, getByPlaceholderText } = render(<Create />);

    fireEvent.changeText(getByPlaceholderText(/group name/i), 'My New Group');
    fireEvent.changeText(getByPlaceholderText(/description/i), 'Description here');

    fireEvent.press(getByText('Create Group'));

    expect(mockCreateGroup).toHaveBeenCalledWith({
      title: 'My New Group',
      description: 'Description here',
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/group/groups');
    });
  });

  it('shows error alert on createGroup failure', async () => {
    mockCreateGroup.mockRejectedValue(new Error('Failed'));

    const { getByText, getByPlaceholderText } = render(<Create />);

    fireEvent.changeText(getByPlaceholderText(/group name/i), 'Fail Group');

    fireEvent.press(getByText('Create Group'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Failed to create group. Please try again.');
    });
  });

  it('disables button and shows loading while submitting', async () => {
    let resolveCreate: () => void = () => {};
    const createPromise = new Promise<void>((resolve) => {
      resolveCreate = resolve;
    });
    mockCreateGroup.mockReturnValue(createPromise);
  
    const { getByText, getByPlaceholderText } = render(<Create />);
    fireEvent.changeText(getByPlaceholderText(/group name/i), 'Loading Group');
    const submitBtn = getByText('Create Group');
    fireEvent.press(submitBtn);
    expect(getByText('Saving...')).toBeTruthy();
  
    resolveCreate();
  
    await waitFor(() => {
      expect(getByText('Create Group')).toBeTruthy();
    });
  });
});
