/**
 * Tests for login.tsx
 * - Validates rendering of inputs, buttons, and link.
 * - Tests form input updates.
 * - Mocks login function to simulate success and failure.
 * - Validates error message rendering on failed login.
 * - Simulates submit and verifies login is called with correct params.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Login from '../../../app/(auth)/login';
import { useUser } from '@/hooks/useUser';

jest.mock('@/hooks/useUser');

describe('Login screen', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({
      login: mockLogin,
    });
  });

  it('renders login screen elements', () => {
    const { getByPlaceholderText, getByText } = render(<Login />);

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
    expect(getByText("Don't have an account?")).toBeTruthy();
    expect(getByText('Register here')).toBeTruthy();
  });

  it('updates email and password inputs', () => {
    const { getByPlaceholderText } = render(<Login />);
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'mypassword');

    expect((emailInput.props.value)).toBe('test@example.com');
    expect((passwordInput.props.value)).toBe('mypassword');
  });

  it('calls login with email and password on submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    const { getByPlaceholderText, getByText } = render(<Login />);
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const loginButton = getByText('Login');

    fireEvent.changeText(emailInput, 'user@example.com');
    fireEvent.changeText(passwordInput, 'secret123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'secret123');
    });
  });

  it('displays error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

    const { getByPlaceholderText, getByText, findByText } = render(<Login />);
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const loginButton = getByText('Login');

    fireEvent.changeText(emailInput, 'baduser@example.com');
    fireEvent.changeText(passwordInput, 'wrongpass');
    fireEvent.press(loginButton);

    expect(await findByText('Invalid credentials')).toBeTruthy();
  });

  it('displays generic error on unknown error', async () => {
    mockLogin.mockRejectedValueOnce({});

    const { getByPlaceholderText, getByText, findByText } = render(<Login />);
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const loginButton = getByText('Login');

    fireEvent.changeText(emailInput, 'user@example.com');
    fireEvent.changeText(passwordInput, 'password');
    fireEvent.press(loginButton);

    expect(await findByText('An unknown error has occurred')).toBeTruthy();
  });

  //Snapshots
  //default layout
  it('matches snapshot of login screen (initial state)', () => {
    const { toJSON } = render(<Login />);
    expect(toJSON()).toMatchSnapshot();
  });
  
  //error UI
  it('matches snapshot of login screen with error', async () => {
    const mockLogin = jest.fn().mockRejectedValueOnce(new Error('Snapshot error'));
    (useUser as jest.Mock).mockReturnValue({ login: mockLogin });
  
    const { getByPlaceholderText, getByText, findByText, toJSON } = render(<Login />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'fail@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'somepw');
    fireEvent.press(getByText('Login'));
    // Wait for error to render
    await findByText('Snapshot error');
    expect(toJSON()).toMatchSnapshot();
  });
});
