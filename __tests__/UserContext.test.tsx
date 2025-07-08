import React from 'react';
import { render, act } from '@testing-library/react-native';
import { waitFor } from '@testing-library/react-native';
import { UserProvider, UserContext } from '@/contexts/UserContext';

// Mock Appwrite SDK
jest.mock('@/lib/appwrite', () => ({
  account: {
    createEmailPasswordSession: jest.fn(() => Promise.resolve({ $id: 'user123' })),
    create: jest.fn(() => Promise.resolve()),
    get: jest.fn(() => Promise.resolve({ $id: 'user123', email: 'test@example.com' })),
    deleteSession: jest.fn(() => Promise.resolve()),
    updateEmail: jest.fn(() => Promise.resolve()),
  },
  databases: {
    getDocument: jest.fn(() => Promise.resolve({ $id: 'user123', username: 'testuser' })),
    updateDocument: jest.fn(() => Promise.resolve({ $id: 'user123', username: 'newuser' })),
  },
}));

describe('UserContext', () => {
  it('login should set user and fetch profile', async () => {
    let contextValue;
    render(
      <UserProvider>
        <UserContext.Consumer>
          {value => {
            contextValue = value;
            return null;
          }}
        </UserContext.Consumer>
      </UserProvider>
    );
    await act(async () => {
      await contextValue.login('test@example.com', 'password');
    });
    expect(contextValue.user).toBeDefined();
    expect(contextValue.profile).toBeDefined();
    expect(contextValue.user.email).toBe('test@example.com');
    expect(contextValue.profile.username).toBe('testuser');
  });

  it('register should call login and set user/profile', async () => {
    let contextValue;
    render(
      <UserProvider>
        <UserContext.Consumer>
          {value => {
            contextValue = value;
            return null;
          }}
        </UserContext.Consumer>
      </UserProvider>
    );
    await act(async () => {
      await contextValue.register('testuser', 'test@example.com', 'password');
    });
    expect(contextValue.user).toBeDefined();
    expect(contextValue.profile).toBeDefined();
  });

  it('logout should clear user and profile', async () => {
    let contextValue;
    render(
      <UserProvider>
        <UserContext.Consumer>
          {value => {
            contextValue = value;
            return null;
          }}
        </UserContext.Consumer>
      </UserProvider>
    );
    await act(async () => {
      await contextValue.login('test@example.com', 'password');
      await contextValue.logout();
    });
    expect(contextValue.user).toBeNull();
    expect(contextValue.profile).toBeNull();
  });

  it('updateProfile should update profile', async () => {
    let contextValue;
    render(
      <UserProvider>
        <UserContext.Consumer>
          {value => {
            contextValue = value;
            return null;
          }}
        </UserContext.Consumer>
      </UserProvider>
    );
    // Login and wait for profile to be set
    await act(async () => {
      await contextValue.login('test@example.com', 'password');
    });
    await waitFor(() => {
      expect(contextValue.profile).not.toBeNull();
    });
    // Now update the profile
    await act(async () => {
      await contextValue.updateProfile({ username: 'newuser' });
    });
    expect(contextValue.profile.username).toBe('newuser');
  });

  it('refetchProfile should update profile', async () => {
    let contextValue;
    render(
      <UserProvider>
        <UserContext.Consumer>
          {value => {
            contextValue = value;
            return null;
          }}
        </UserContext.Consumer>
      </UserProvider>
    );
    await act(async () => {
      await contextValue.login('test@example.com', 'password');
      await contextValue.refetchProfile();
    });
    expect(contextValue.profile).toBeDefined();
  });
});
