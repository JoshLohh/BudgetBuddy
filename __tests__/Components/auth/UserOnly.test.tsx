// UserOnly.test.tsx
// Tests the UserOnly component’s conditional rendering and redirect handling
// based on authentication state, using mocked hooks and router navigation.

import React from 'react'
import { render, screen } from '@testing-library/react-native'
import UserOnly from '../../../components/auth/UserOnly'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'expo-router'
import { Text } from 'react-native'

jest.mock('@/hooks/useUser')
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}))
jest.mock('../../../components/ThemedLoader', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
      __esModule: true,
      default: () => <Text>ThemedLoader</Text>
    };
  });

const mockReplace = jest.fn()
;(useRouter as jest.Mock).mockReturnValue({ replace: mockReplace })

describe('UserOnly', () => {
  const mockChildren = <Text>Protected Content</Text>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loader when auth is not checked', () => {
    (useUser as jest.Mock).mockReturnValue({ user: null, authChecked: false })
    render(<UserOnly>{mockChildren}</UserOnly>)
    expect(screen.getByText('ThemedLoader')).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('renders loader when user is not present and auth is not checked', () => {
    (useUser as jest.Mock).mockReturnValue({ user: null, authChecked: false })
    render(<UserOnly>{mockChildren}</UserOnly>)
    expect(screen.getByText('ThemedLoader')).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('redirects to /login when auth is checked and user is not present', () => {
    (useUser as jest.Mock).mockReturnValue({ user: null, authChecked: true })
    render(<UserOnly>{mockChildren}</UserOnly>)
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('renders children when user is present and auth is checked', () => {
    (useUser as jest.Mock).mockReturnValue({ user: { id: 1 }, authChecked: true })
    render(<UserOnly>{mockChildren}</UserOnly>)
    expect(screen.getByText('Protected Content')).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalled()
  })
  
  //Snapshot
  it('matches snapshot when user is present and auth is checked', () => {
    (useUser as jest.Mock).mockReturnValue({ user: { id: 1 }, authChecked: true })
    const tree = render(<UserOnly>{mockChildren}</UserOnly>).toJSON()
    expect(tree).toMatchSnapshot()
  })

})

