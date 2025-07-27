import React from 'react';
import { render } from '@testing-library/react-native';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import * as useColorSchemeModule from '@/hooks/useColorScheme';
import * as useBottomTabOverflowModule from '@/components/ui/TabBarBackground';
import { Text } from 'react-native';

// PROPERLY FIXED ANIMATED MOCK
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Image } = require('react-native');
  const Animated = {
    View,
    Image,
    ScrollView: View,
  };
  return {
    ...Animated,
    useAnimatedRef: jest.fn(() => React.createRef()),
    useScrollViewOffset: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn((fn) => fn()),
    interpolate: jest.fn((value) => value),
    __esModule: true,
    default: Animated, // Enables ES "default" import style
  };
});

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

jest.mock('@/components/ui/TabBarBackground', () => ({
  useBottomTabOverflow: jest.fn(() => 0),
}));

describe('ParallaxScrollView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header image and content as children', () => {
    const headerImage = <Text testID="header-img">HEADER</Text>;

    const { getByTestId, getByText } = render(
      <ParallaxScrollView headerImage={headerImage}>
        <Text>Content Section</Text>
      </ParallaxScrollView>
    );

    expect(getByTestId('header-img')).toBeTruthy();
    expect(getByText('Content Section')).toBeTruthy();
  });
  
  //Snapshot
  it('applies default background color in light mode', () => {
    (useColorSchemeModule.useColorScheme as jest.Mock).mockReturnValue('light');

    const { toJSON } = render(
      <ParallaxScrollView>
        <Text>Default Color</Text>
      </ParallaxScrollView>
    );

    expect(toJSON()).toMatchSnapshot();
  });
  
  //Snapshot
  it('applies header background color override', () => {
    (useColorSchemeModule.useColorScheme as jest.Mock).mockReturnValue('dark');

    const { toJSON } = render(
      <ParallaxScrollView
        headerBackgroundColor={{ dark: '#222', light: '#fff' }}
      >
        <Text>Test</Text>
      </ParallaxScrollView>
    );

    expect(toJSON()).toMatchSnapshot();
  });

  it('renders without header image if not provided', () => {
    const { queryByTestId, getByText } = render(
      <ParallaxScrollView>
        <Text>Without Header</Text>
      </ParallaxScrollView>
    );

    expect(queryByTestId('header-img')).toBeNull();
    expect(getByText('Without Header')).toBeTruthy();
  });

  //Snapshot
  it('renders correctly with no children or header (edge case)', () => {
    const { toJSON } = render(<ParallaxScrollView />);
    expect(toJSON()).toMatchSnapshot();
  });
});

/**
 * Test Summary:
 * - Confirms headerImage and children render correctly
 * - Applies dark/light background color based on useColorScheme
 * - Handles header absence gracefully
 * - Snapshot coverage protects layout and modifications
 */
