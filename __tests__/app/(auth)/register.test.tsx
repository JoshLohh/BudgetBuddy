import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Register from '../../../app/(auth)/register';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'expo-router';

// Jest mocks

// Mock for useUser hook (with register & refetchProfile)
const mockRegister = jest.fn();
const mockRefetchProfile = jest.fn();

jest.mock('@/hooks/useUser', () => ({
  useUser: jest.fn(() => ({
    register: mockRegister,
    refetchProfile: mockRefetchProfile,
  })),
}));

// Mock for useRouter hook from expo-router
let mockReplace: jest.Mock;

jest.mock('expo-router', () => {
  const React = require('react');
  mockReplace = jest.fn();  
  return {
    Link: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useRouter: () => ({
      replace: mockReplace,
    }),
  };
});

// Basic mocks for themed components (return children or simple native elements)
jest.mock('@/components/ThemedText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
  };
});

jest.mock('@/components/ThemedView', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ThemedView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

jest.mock('@/components/Spacer', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ testID }: any) => <View testID={testID || 'spacer'} />;
});

jest.mock('@/components/ThemedButton', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    ThemedButton: ({ children, onPress, ...props }: any) => (
      <Pressable onPress={onPress} {...props}>
        {typeof children === 'string' ? <Text>{children}</Text> : children}
      </Pressable>
    ),
  };
});

jest.mock('@/components/ThemedTextInput', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return React.forwardRef((props: any, ref: any) => <TextInput ref={ref} {...props} />);
});

// OPTIONAL: You can mock "useColorScheme" if you want deterministic theming but not mandatory

// Now your tests

describe('Register screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all input fields, buttons and links', () => {
    const { getByPlaceholderText, getByText } = render(<Register />);
    expect(getByPlaceholderText('Username')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Register')).toBeTruthy();
    expect(getByText('Already have an account?')).toBeTruthy();
    expect(getByText('Login here')).toBeTruthy();
  });

  it('updates inputs on user typing', () => {
    const { getByPlaceholderText } = render(<Register />);
    fireEvent.changeText(getByPlaceholderText('Username'), 'johndoe');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@mail.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'securePass!');
    expect(getByPlaceholderText('Username').props.value).toBe('johndoe');
    expect(getByPlaceholderText('Email').props.value).toBe('john@mail.com');
    expect(getByPlaceholderText('Password').props.value).toBe('securePass!');
  });

  it('calls register and profile refetch, then navigates on success', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    mockRefetchProfile.mockResolvedValueOnce({ id: '123' });

    const { getByPlaceholderText, getByText } = render(<Register />);

    fireEvent.changeText(getByPlaceholderText('Username'), 'johndoe');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@mail.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'securePass!');
    fireEvent.press(getByText('Register'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('johndoe', 'john@mail.com', 'securePass!');
      expect(mockRefetchProfile).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/profile');
    });
  });

  it('shows error if profile not loaded after registration', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    mockRefetchProfile.mockResolvedValueOnce(null);

    const { getByPlaceholderText, getByText, findByText } = render(<Register />);
    fireEvent.changeText(getByPlaceholderText('Username'), 'johndoe');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@mail.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'securePass!');
    fireEvent.press(getByText('Register'));

    expect(await findByText('Profile not loaded. Please try again.')).toBeTruthy();
  });

  it('shows proper error message on register failure (Error instance)', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Registration failed'));

    const { getByPlaceholderText, getByText, findByText } = render(<Register />);
    fireEvent.changeText(getByPlaceholderText('Username'), 'johndoe');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@mail.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'securePass!');
    fireEvent.press(getByText('Register'));

    expect(await findByText('Registration failed')).toBeTruthy();
  });

  it('shows generic error on unknown failure', async () => {
    mockRegister.mockRejectedValueOnce({});

    const { getByPlaceholderText, getByText, findByText } = render(<Register />);
    fireEvent.changeText(getByPlaceholderText('Username'), 'johndoe');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@mail.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'securePass!');
    fireEvent.press(getByText('Register'));

    expect(await findByText('An unknown error has occurred')).toBeTruthy();
  });
});
