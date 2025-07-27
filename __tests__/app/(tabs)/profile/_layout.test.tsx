import React from 'react';
import { render } from '@testing-library/react-native';
import ProfileLayout from '../../../../app/(tabs)/profile/_layout';
import * as UserHookModule from '@/hooks/useUser';
import * as RouterModule from 'expo-router';
import { Text } from 'react-native';
import renderer from 'react-test-renderer';


// 1. Mock inside jest.mock, and export the mock function for assertion
jest.mock('expo-router', () => {
  const stack = jest.fn((props) => <>{props.children}</>);
  const useRouter = jest.fn();
  return {
    Stack: stack,
    useRouter,
    __mock: {
      stack,
      useRouter
    }
  };
});

jest.mock('@/components/auth/UserOnly', () => {
  const userOnly = jest.fn((props) => <>{props.children}</>);
  return {
    __esModule: true,
    default: userOnly,
    __mock: {
      userOnly
    }
  };
});

describe('ProfileLayout', () => {
  // Use requireMock to retrieve internal mocks!
  const { __mock: { stack: stackMock } } = jest.requireMock('expo-router');
  const { __mock: { userOnly: userOnlyMock } } = jest.requireMock('@/components/auth/UserOnly');

  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    stackMock.mockImplementation((props: any)  => <>{props.children}</>);
    userOnlyMock.mockImplementation((props: any)  => <>{props.children}</>);

    jest.spyOn(UserHookModule, 'useUser').mockReturnValue({
      user: { id: 'user-1', name: 'Test User' },
      authChecked: true,
      profile: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      updateProfile: jest.fn(),
      refetchProfile: jest.fn(),
    });

    (RouterModule.useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
  });

  it('renders Stack and UserOnly wrappers when user is authenticated', () => {
    render(<ProfileLayout />);
    expect(stackMock).toHaveBeenCalled();
    expect(userOnlyMock).toHaveBeenCalled();
  });

  it('redirects to /login when user is unauthenticated', () => {
    jest.spyOn(UserHookModule, 'useUser').mockReturnValue({
      user: null,
      authChecked: true,
      profile: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      updateProfile: jest.fn(),
      refetchProfile: jest.fn(),
    });

    userOnlyMock.mockImplementation(() => {
      mockReplace('/login');
      return <></>;
    });

    render(<ProfileLayout />);
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('renders loading indicator when auth is not yet checked', () => {
    jest.spyOn(UserHookModule, 'useUser').mockReturnValue({
      user: null,
      authChecked: false,
      profile: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      updateProfile: jest.fn(),
      refetchProfile: jest.fn(),
    });

    userOnlyMock.mockImplementation(() => <Text testID="loading-spinner">Loading...</Text>);

    const { getByTestId } = render(<ProfileLayout />);
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });
});

//Snapshots
describe('ProfileLayout snapshots', () => {
    it('matches snapshot when authenticated', () => {
      const tree = renderer.create(<ProfileLayout />).toJSON();
      expect(tree).toMatchSnapshot();
    });
  
    it('matches snapshot when unauthenticated', () => {
      jest.spyOn(require('@/hooks/useUser'), 'useUser').mockReturnValue({
        user: null,
        authChecked: true,
        profile: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        updateProfile: jest.fn(),
        refetchProfile: jest.fn(),
      });
  
      // UserOnlyMock.mockImplementation(() => <></>);
  
      const tree = renderer.create(<ProfileLayout />).toJSON();
      expect(tree).toMatchSnapshot();
    });
  
    it('matches snapshot when loading', () => {
      jest.spyOn(require('@/hooks/useUser'), 'useUser').mockReturnValue({
        user: null,
        authChecked: false,
        profile: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        updateProfile: jest.fn(),
        refetchProfile: jest.fn(),
      });

      // UserOnlyMock.mockImplementation(() => <Text>Loading...</Text>);
  
      const tree = renderer.create(<ProfileLayout />).toJSON();
      expect(tree).toMatchSnapshot();
    });
});
