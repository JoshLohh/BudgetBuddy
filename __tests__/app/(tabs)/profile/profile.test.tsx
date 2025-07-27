/**
 * @file Profile.test.tsx
 * Test suite for Profile.tsx
 *
 * Covers key functionalities including:
 * - Rendering user profile information
 * - Editing profile data and saving updates
 * - Handling avatar image upload with permission checks and errors
 * - Logout functionality and navigation
 * - Loading states and timeout reload behavior
 *
 * Uses mocks for:
 * - useUser hook (profile data, update, logout)
 * - useStats hook (group/expense stats)
 * - Expo Router (navigation mocks)
 * - Expo ImagePicker (permissions and image launch)
 * - Global fetch (for avatar upload)
 */

import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react-native';
import Profile from '@/app/(tabs)/profile/profile';
import { useUser } from '@/hooks/useUser';
import { useStats } from '@/contexts/StatsContext';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

jest.mock('@/hooks/useUser');
jest.mock('@/contexts/StatsContext');
jest.mock('expo-image-picker');
jest.mock('expo-router');

global.alert = jest.fn(); // Mock global alert to suppress dialogs in tests

describe('Profile Component', () => {
  const mockUser = { email: 'test@example.com', $id: 'user1' };
  const mockProfile = {
    username: 'TestUser',
    email: 'test@example.com',
    bio: 'Hello world',
    avatar: 'https://example.com/avatar.jpg',
  };
  const mockStats = {
    groupsCount: 3,
    userExpensesCount: 10,
    userTotalSpent: 150.75,
    loading: false,
    refetchStats: jest.fn(),
  };
  const mockRefetchProfile = jest.fn().mockResolvedValue(mockProfile);
  const mockUpdateProfile = jest.fn().mockResolvedValue(undefined);
  const mockLogout = jest.fn().mockResolvedValue(undefined);
  const mockRouterReplace = jest.fn();
  const mockRouterPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useUser hook
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      updateProfile: mockUpdateProfile,
      logout: mockLogout,
      authChecked: true,
      refetchProfile: mockRefetchProfile,
    });

    // Mock useStats hook
    (useStats as jest.Mock).mockReturnValue(mockStats);

    // Mock expo-router hooks
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockRouterReplace,
      push: mockRouterPush,
    });

    // Mock Expo ImagePicker permissions granted and launch results
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///test-image.jpg', mimeType: 'image/jpeg' }],
    });

    // Mock fetch for file upload with successful JSON response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ $id: 'file123' }),
      } as Response)
    ) as unknown as typeof fetch;
  });

  it('renders profile information correctly', () => {
    const { getByText } = render(<Profile />);
    expect(getByText('TestUser')).toBeTruthy();
    expect(getByText('Hello world')).toBeTruthy();

    // Separate assertions for split Text nodes in stats section
    expect(getByText('3')).toBeTruthy();
    expect(getByText('Groups')).toBeTruthy();

    expect(getByText('$150.75')).toBeTruthy();
    //expect(getByText('150.75')).toBeTruthy();
    expect(getByText('Total Spent')).toBeTruthy();

    expect(getByText('10')).toBeTruthy();
    expect(getByText('# Expenses')).toBeTruthy();
  });

  it('toggles editing mode and populates inputs', () => {
    const { getByText, getByDisplayValue } = render(<Profile />);
    fireEvent.press(getByText('Edit Profile'));
    expect(getByDisplayValue('TestUser')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
    expect(getByDisplayValue('Hello world')).toBeTruthy();
  });

  it('saves profile changes and exits edit mode on success', async () => {
    const { getByText } = render(<Profile />);
    fireEvent.press(getByText('Edit Profile'));
    fireEvent.press(getByText('Save Changes'));
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({
        username: 'TestUser',
        email: 'test@example.com',
        bio: 'Hello world',
      }));
      expect(getByText('Edit Profile')).toBeTruthy(); // Checks edit button shown after save
    });
  });

  it('shows error message if save profile fails', async () => {
    mockUpdateProfile.mockRejectedValueOnce(new Error('Save failed'));
    const { getByText } = render(<Profile />);
    fireEvent.press(getByText('Edit Profile'));
    fireEvent.press(getByText('Save Changes'));
    await waitFor(() => {
      expect(getByText('Save failed')).toBeTruthy();
    });
  });

  it('handles avatar upload permission denied', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: false });
    global.alert = jest.fn();
    const { getByLabelText } = render(<Profile />);
    // Make sure there is an accessibilityLabel for avatar change button in your Profile component!
    const avatarButton = getByLabelText('Change Avatar');
    await act(async () => {
      fireEvent.press(avatarButton);
    });
    expect(global.alert).toHaveBeenCalledWith('Permission to access gallery is required!');
  });

  it('uploads avatar image successfully and updates profile', async () => {
    const { getByLabelText } = render(<Profile />);
    const avatarButton = getByLabelText('Change Avatar');
    await act(async () => {
      fireEvent.press(avatarButton);
    });
    expect(global.fetch).toHaveBeenCalled();
    expect(mockUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({
      avatar: expect.stringContaining('storage/buckets'),
    }));
    expect(mockRefetchProfile).toHaveBeenCalled();
  });

  it('alerts on avatar upload server error', async () => {
    // Mock fetch to trigger catch for invalid JSON
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.reject('server error'),
      } as Response)
    ) as unknown as typeof fetch;

    global.alert = jest.fn();
    const { getByLabelText } = render(<Profile />);
    const avatarButton = getByLabelText('Change Avatar');

    await act(async () => {
      fireEvent.press(avatarButton);
    });

    expect(global.alert).toHaveBeenCalledWith('Upload failed: invalid response from server.');
  });

  it('alerts on avatar upload non-ok response', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Upload error' }),
      } as Response)
    ) as unknown as typeof fetch;

    global.alert = jest.fn();
    const { getByLabelText } = render(<Profile />);
    const avatarButton = getByLabelText('Change Avatar');

    await act(async () => {
      fireEvent.press(avatarButton);
    });

    expect(global.alert).toHaveBeenCalledWith('Upload failed: Upload error');
  });

  it('calls logout and navigates to root on logout button press', async () => {
    const { getByText } = render(<Profile />);
    fireEvent.press(getByText('Logout'));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockRouterReplace).toHaveBeenCalledWith('/');
    });
  });

  it('shows loading state with reload button on profile load timeout', async () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      profile: null,
      updateProfile: mockUpdateProfile,
      logout: mockLogout,
      authChecked: true,
      refetchProfile: mockRefetchProfile,
    });

    jest.useFakeTimers();
    const { getByText } = render(<Profile />);

    expect(getByText(/Loading profile/)).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(getByText('Still loading? Tap reload below.')).toBeTruthy();

    const reloadButton = getByText('Reload');
    fireEvent.press(reloadButton);

    await waitFor(() => {
      expect(mockRefetchProfile).toHaveBeenCalled();
      expect(mockStats.refetchStats).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });

  it('matches snapshot (non-edit mode)', () => {
    const tree = render(<Profile />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('matches snapshot (edit mode)', () => {
    const { getByText } = render(<Profile />);
    fireEvent.press(getByText('Edit Profile'));
    const tree = render(<Profile />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
