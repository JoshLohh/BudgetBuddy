import React from 'react';
import { render, act } from '@testing-library/react-native';
import { waitFor } from '@testing-library/react-native';
import { UserProvider, UserContext , UserContextType } from '@/contexts/UserContext';

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
    const contextValue = { current: undefined as UserContextType | undefined };
    render(
      <UserProvider>
        <UserContext.Consumer>
          {value => {
            contextValue.current = value;
            return null;
          }}
        </UserContext.Consumer>
      </UserProvider>
    );
    await act(async () => {
      await contextValue.current!.login('test@example.com', 'password');
    });
    expect(contextValue.current!.user).toBeDefined();
    expect(contextValue.current!.profile).toBeDefined();
    expect(contextValue.current!.user.email).toBe('test@example.com');
    expect(contextValue.current!.profile.username).toBe('testuser');
  });

  it('register should call login and set user/profile', async () => {
    const contextValue = { current: undefined as UserContextType | undefined };
    render(
      <UserProvider>
        <UserContext.Consumer>
          {value => {
            contextValue.current = value;
            return null;
          }}
        </UserContext.Consumer>
      </UserProvider>
    );
    await act(async () => {
      await contextValue.current!.register('testuser', 'test@example.com', 'password');
    });
    expect(contextValue.current!.user).toBeDefined();
    expect(contextValue.current!.profile).toBeDefined();
  });

  it('logout should clear user and profile', async () => {
    const contextValue = { current: undefined as UserContextType | undefined };
    render(
      <UserProvider>
        <UserContext.Consumer>
          {value => {
            contextValue.current = value;
            return null;
          }}
        </UserContext.Consumer>
      </UserProvider>
    );
    await act(async () => {
      await contextValue.current!.login('test@example.com', 'password');
      await contextValue.current!.logout();
    });
    expect(contextValue.current!.user).toBeNull();
    expect(contextValue.current!.profile).toBeNull();
  });

  it('updateProfile should update profile', async () => {
    const contextValue = { current: undefined as UserContextType | undefined };
    render(
      <UserProvider>
        <UserContext.Consumer>
          {value => {
            contextValue.current = value;
            return null;
          }}
        </UserContext.Consumer>
      </UserProvider>
    );
    // Login and wait for profile to be set
    await act(async () => {
      await contextValue.current!.login('test@example.com', 'password');
    });
    await waitFor(() => {
      expect(contextValue.current!.profile).not.toBeNull();
    });
    // Now update the profile
    await act(async () => {
      await contextValue.current!.updateProfile({ username: 'newuser' });
    });
    expect(contextValue.current!.profile.username).toBe('newuser');
  });

  it('updateProfile throws error if profile is not loaded', async () => {
    const contextValue = { current: undefined as UserContextType | undefined };
    render(
      <UserProvider>
        <UserContext.Consumer>
          {value => { contextValue.current = value; return null; }}
        </UserContext.Consumer>
      </UserProvider>
    );
    // Ensure profile is null
    contextValue.current!.profile = null;
    await expect(contextValue.current!.updateProfile({ username: 'shouldFail' }))
      .rejects.toThrow('No profile loaded');
  });


  it('refetchProfile should update profile', async () => {
    const contextValue = { current: undefined as UserContextType | undefined };
    render(
      <UserProvider>
        <UserContext.Consumer>
          {value => {
            contextValue.current = value;
            return null;
          }}
        </UserContext.Consumer>
      </UserProvider>
    );
    await act(async () => {
      await contextValue.current!.login('test@example.com', 'password');
      await contextValue.current!.refetchProfile();
    });
    expect(contextValue.current!.profile).toBeDefined();
  });

  it('refetchProfile returns null if no user is set', async () => {
    const contextValue = { current: undefined as UserContextType | undefined };
    render(
      <UserProvider>
        <UserContext.Consumer>
          {value => { contextValue.current = value; return null; }}
        </UserContext.Consumer>
      </UserProvider>
    );
    // Ensure user is null
    expect(contextValue.current!.user).toBeNull();
    const result = await contextValue.current!.refetchProfile();
    expect(result).toBeNull();
  });

});
