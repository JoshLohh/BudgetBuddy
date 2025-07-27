import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useUser } from '../../hooks/useUser';
import { UserContext } from '../../contexts/UserContext';

const mockUser = { $id: 'uid1', email: 'user@email.com' };
const mockProfile = { username: 'josh' };

const mockContextValue = {
  user: mockUser,
  profile: mockProfile,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  updateProfile: jest.fn(),
  authChecked: true,
  refetchProfile: jest.fn(),
};

function ConsumerComponent() {
  const context = useUser();
  return (
    <>
      <Text testID="user-id">{context.user?.$id}</Text>
      <Text testID="profile-username">{context.profile?.username}</Text>
      <Text testID="auth-checked">{String(context.authChecked)}</Text>
    </>
  );
}

describe('useUser', () => {
  it('returns UserContext value when used within UserProvider', () => {
    const { getByTestId } = render(
      <UserContext.Provider value={mockContextValue}>
        <ConsumerComponent />
      </UserContext.Provider>
    );
    expect(getByTestId('user-id').props.children).toBe('uid1');
    expect(getByTestId('profile-username').props.children).toBe('josh');
    expect(getByTestId('auth-checked').props.children).toBe('true');
  });

  it('returns updated UserContext value when provider value changes', () => {
    const { getByTestId, rerender } = render(
      <UserContext.Provider value={mockContextValue}>
        <ConsumerComponent />
      </UserContext.Provider>
    );
    expect(getByTestId('user-id').props.children).toBe('uid1');

    const updatedValue = { ...mockContextValue, user: { $id: 'uid2', email: 'new@em.com' }, profile: { username: 'newuser' }, authChecked: false };
    rerender(
      <UserContext.Provider value={updatedValue}>
        <ConsumerComponent />
      </UserContext.Provider>
    );
    expect(getByTestId('user-id').props.children).toBe('uid2');
    expect(getByTestId('profile-username').props.children).toBe('newuser');
    expect(getByTestId('auth-checked').props.children).toBe('false');
  });

  it('throws an error if used outside a UserProvider', () => {
    // Suppress error output for test cleanliness
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function InvalidConsumer() {
      useUser();
      return null;
    }
    expect(() => render(<InvalidConsumer />)).toThrow('useUser must be used within a UserProvider');
    spy.mockRestore();
  });
});
