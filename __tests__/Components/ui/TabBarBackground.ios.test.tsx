/**
 * Test suite for BlurTabBarBackground component and useBottomTabOverflow hook.
 * Uses jest mock of BlurView and asserts it was called with expected props.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import BlurTabBarBackground, { useBottomTabOverflow } from '../../../components/ui/TabBarBackground.ios';
import * as BottomTabs from '@react-navigation/bottom-tabs';

// Mock useBottomTabBarHeight hook
jest.mock('@react-navigation/bottom-tabs', () => ({
  ...jest.requireActual('@react-navigation/bottom-tabs'),
  useBottomTabBarHeight: jest.fn(),
}));

// Mock expo-blur's BlurView component
jest.mock('expo-blur', () => {
  return {
    BlurView: jest.fn(() => null),  // Mock component returns null for rendering
  };
});

import { BlurView } from 'expo-blur';

describe('BlurTabBarBackground component', () => {
  beforeEach(() => {
    (BottomTabs.useBottomTabBarHeight as jest.Mock).mockReturnValue(50);
    (BlurView as jest.Mock).mockClear();  // Clear previous calls
  });

  it('renders BlurView with the correct props', () => {
    render(<BlurTabBarBackground />);

    expect(BlurView).toHaveBeenCalledWith(
      expect.objectContaining({
        intensity: 100,
        tint: 'systemChromeMaterial',
        style: expect.anything(),  // Adjust if you want detailed style matching
        testID: 'blur-tab-bar-background',
      }),
      undefined  // Second argument is usually 'context', we can ignore or assert as undefined
    );
  });
  
  //Snapshot to test 
  it('matches snapshot', () => {
    const tree = render(<BlurTabBarBackground />).toJSON();
    expect(tree).toMatchSnapshot();
  });


});

describe('useBottomTabOverflow hook', () => {
  it('returns the tab bar height from useBottomTabBarHeight hook', () => {
    (BottomTabs.useBottomTabBarHeight as jest.Mock).mockReturnValue(42);
    const height = useBottomTabOverflow();
    expect(height).toBe(42);
  });
});
