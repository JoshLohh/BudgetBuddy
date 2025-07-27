/**
 * Tests for HomeScreen (index.tsx)
 * - Validates rendering of welcome message and navigation links
 * - Checks rendering of HelloWave and layout structure
 * - Mocks navigation and theming components for isolated testing
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../app/index';

// Mock child dependencies:
jest.mock('@/components/HelloWave', () => ({
  HelloWave: () => <></>, // render empty fragment (mock animation)
}));

jest.mock('@/components/ThemedText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text> };
});

jest.mock('@/components/ThemedView', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { ThemedView: ({ children, ...props }: any) => <View {...props}>{children}</View> };
});

jest.mock('@/components/Spacer', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ testID }: any) => <View testID={testID || 'spacer'} />;
});

jest.mock('expo-router', () => {
    const React = require('react');
    const { Text } = require('react-native');
  
    const router = {
      push: jest.fn(),
    };
  
    // Simulate Link: onPress will call router.push(href)
    const Link = ({ children, href, ...props }: any) => (
      <Text
        accessibilityRole="link"
        onPress={() => {
          if (href) router.push(href);
        }}
        {...props}
      >
        {children}
      </Text>
    );
  
    return {
      Link,
      router,
    };
});
  

describe('HomeScreen', () => {
  it('renders welcome message', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Welcome to BudgetBuddy')).toBeTruthy();
  });

  it('renders navigation links/buttons for Login, Register, Profile', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Login')).toBeTruthy();
    expect(getByText('Register')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  it('renders the HelloWave component', () => {
    const { UNSAFE_getByType } = render(<HomeScreen />);
    const HelloWave = require('@/components/HelloWave').HelloWave;
    expect(UNSAFE_getByType(HelloWave)).toBeTruthy();
  });

  it('includes Spacer components for layout spacing', () => {
    const { getAllByTestId } = render(<HomeScreen />);
    const spacers = getAllByTestId('spacer');
    expect(spacers.length).toBeGreaterThan(0);
  });

  it('calls router.push when profile link is pressed (simulate interaction)', () => {
    const { getByText } = render(<HomeScreen />);
    const { router } = require('expo-router');
    const profileLink = getByText('Profile');
    fireEvent.press(profileLink);
    expect(router.push).toHaveBeenCalledWith('/profile/profile');
  });

  // Add snapshot test for structural changes
  it('matches snapshot', () => {
    const { toJSON } = render(<HomeScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});
