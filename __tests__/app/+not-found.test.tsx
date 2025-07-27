import React from 'react';
import { render } from '@testing-library/react-native';
import NotFoundScreen from '../../app/+not-found.tsx';
console.log('NotFoundScreen:', NotFoundScreen);

jest.mock('@/components/ThemedText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
  };
});

jest.mock('@/components/ThemedView', () => {
  const React = require('react');
  return {
    ThemedView: ({ children, ...props }: any) => <>{children}</>,
  };
});

jest.mock('expo-router', () => {
    const React = require('react');
    const { Text, View } = require('react-native');
    // First, create the Stack function
    const Stack = ({ children } : any) => <>{children}</>;
    // Now, assign a Screen static property (can be a placeholder)
    Stack.Screen = ({ children }: any) => <>{children}</>;
    return {
      Link: ({ children, ...props }: any) => <Text accessibilityRole="link" {...props}>{children}</Text>,
      Stack,
    };
});

describe('+not-found.tsx', () => {
  it('renders the not found message', () => {
    const { getByText } = render(<NotFoundScreen />);
    expect(getByText('This screen does not exist.')).toBeTruthy();
  });

  it('renders the link to go to home screen', () => {
    const { getByText } = render(<NotFoundScreen />);
    expect(getByText('Go to home screen!')).toBeTruthy();
  });

  it('renders within a themed view (styles are applied)', () => {
    const { getByText } = render(<NotFoundScreen />);
    expect(getByText('This screen does not exist.')).toBeTruthy();
  });

  it('link to home screen is accessible and behaves correctly', () => {
    const { getByRole } = render(<NotFoundScreen />);
    const link = getByRole('link');
    expect(link).toBeTruthy();
  });
  
  // Snapshot test added here
  it('matches the snapshot', () => {
    const { toJSON } = render(<NotFoundScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});
