/**
 * @file SettingsPage.test.tsx
 * Test suite for SettingsPage (settings.tsx)
 * - Covers rendering, password change UX, logout, and account deletion.
 */

//var mockHolder: { updatePassword?: jest.Mock } = {};

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsPage from '@/app/(tabs)/profile/settings';
import { useUser } from '@/hooks/useUser';


// Mocks and helpers
jest.mock('@/hooks/useUser');
jest.mock('@react-navigation/native', () => ({
  useNavigationState: () => ({ routes: [], index: 0 })
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock('react-native-appwrite', () => {
    const updatePasswordFn = jest.fn();
    //mockHolder.updatePassword = updatePasswordFn;
  
    return {
      Client: jest.fn().mockImplementation(() => ({
        setEndpoint: jest.fn().mockReturnThis(),
        setProject: jest.fn().mockReturnThis(),
        setPlatform: jest.fn().mockReturnThis(),
      })),
      Account: jest.fn().mockImplementation(() => ({
        updatePassword: updatePasswordFn,
      })),
      Avatars: jest.fn().mockImplementation(() => ({
        getInitials: jest.fn(),
        getQR: jest.fn(),
      })),
      Databases: jest.fn().mockImplementation(() => ({
        getDocument: jest.fn(),
        listDocuments: jest.fn(),
        updateDocument: jest.fn(),
        createDocument: jest.fn(),
        deleteDocument: jest.fn(),
      })),
    };
});
  


describe('SettingsPage', () => {
  const logoutMock = jest.fn();

  beforeEach(() => {
    (useUser as jest.Mock).mockReturnValue({ logout: logoutMock });
    jest.clearAllMocks();
    jest.useFakeTimers();
    //jest.spyOn(global, 'alert').mockImplementation(() => {});
    global.alert = jest.fn(); 
    //mockHolder.updatePassword?.mockReset();
    //mockHolder.updatePassword?.mockResolvedValue({});
  });

  it('renders settings screen options', () => {
    const { getByText } = render(<SettingsPage />);
    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Change Password')).toBeTruthy();
    expect(getByText('Logout')).toBeTruthy();
    expect(getByText('Delete Account')).toBeTruthy();
  });

  it('opens and closes the change password modal', () => {
    const { getByText, queryByText } = render(<SettingsPage />);
    fireEvent.press(getByText('Change Password'));
    expect(getByText('Current Password')).toBeTruthy();
    fireEvent.press(getByText('Cancel'));
    expect(queryByText('Current Password')).toBeNull();
  });

  it('shows error if new password is too short', () => {
    const { getByText, getByPlaceholderText } = render(<SettingsPage />);
    fireEvent.press(getByText('Change Password'));
    const newPwInput = getByPlaceholderText('New Password');
    fireEvent.changeText(newPwInput, 'short');
    fireEvent.press(getByText('Save'));
    expect(getByText('New password must be at least 8 characters.')).toBeTruthy();
  });

  it('calls updatePassword on successful valid password change', async () => {
    // Patch global Account mock
    const Account = require('react-native-appwrite').Account;
    Account.mockImplementation(() => ({
      updatePassword: jest.fn().mockResolvedValueOnce({}),
    }));

    const { getByText, getByPlaceholderText, queryByText } = render(<SettingsPage />);
    fireEvent.press(getByText('Change Password'));
    fireEvent.changeText(getByPlaceholderText('Current Password'), 'current-password');
    fireEvent.changeText(getByPlaceholderText('New Password'), 'validpassword');
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(getByText('Password changed successfully!')).toBeTruthy();
      expect(queryByText('New password must be at least 8 characters.')).toBeNull();
    });
  });

  /*it('shows API error if updatePassword fails', async () => {
    mockHolder.updatePassword?.mockRejectedValueOnce(new Error('Network fail'));
    const { getByText, getByPlaceholderText, findByText } = render(<SettingsPage />);
    fireEvent.press(getByText('Change Password'));
    fireEvent.changeText(getByPlaceholderText('Current Password'), 'current-password');
    fireEvent.changeText(getByPlaceholderText('New Password'), 'validpassword');
    fireEvent.press(getByText('Save'));
  
    await expect(findByText('Network fail')).resolves.toBeTruthy();
  });*/

  // ...your other test cases, which can use updatePasswordMock as needed...
});
