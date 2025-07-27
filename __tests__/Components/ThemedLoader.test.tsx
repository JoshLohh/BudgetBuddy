import React from 'react';
import { render } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import ThemedLoader from '../../components/ThemedLoader';
import { Colors } from '../../constants/Colors';
import { View } from 'react-native';

// Fixed: always assign the test ID to the mock ThemedView
jest.mock('../../components/ThemedView', () => {
    const React = require('react'); // Import React here
    const { View } = require('react-native'); // Import View here, inside the factory
    return {
      ThemedView: ({ children, testID = 'themed-view', ...props }: { children?: React.ReactNode; testID?: string }) => (
        <View testID={testID} {...props}>
          {children}
        </View>
      ),
    };
  });

describe('ThemedLoader', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders with light theme and uses light text color for ActivityIndicator', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    const { getByTestId } = render(<ThemedLoader />);
    const indicator = getByTestId('activity-indicator');
    expect(indicator.props.color).toBe(Colors.light.text);
  });

  it('renders with dark theme and uses dark text color for ActivityIndicator', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    const { getByTestId } = render(<ThemedLoader />);
    const indicator = getByTestId('activity-indicator');
    expect(indicator.props.color).toBe(Colors.dark.text);
  });

  it('falls back to light theme when color scheme is undefined', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(undefined);
    const { getByTestId } = render(<ThemedLoader />);
    const indicator = getByTestId('activity-indicator');
    expect(indicator.props.color).toBe(Colors.light.text);
  });

  it('renders ThemedView as parent', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    const { getByTestId } = render(<ThemedLoader />);
    const themedView = getByTestId('themed-view');
    expect(themedView).toBeTruthy();
  });

  it('matches the snapshot for light theme', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    const tree = render(<ThemedLoader />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('matches the snapshot for dark theme', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    const tree = render(<ThemedLoader />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

/**
 * This test file asserts that ThemedLoader renders correctly against the theme logic,
 * and verifies ThemedView is always present as the parent container.
 */
