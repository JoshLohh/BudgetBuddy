import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { HapticTab } from '@/components/HapticTab';

// ✅ Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

// ✅ Mock PlatformPressable with valid react-native Pressable
jest.mock('@react-navigation/elements', () => {
  const { Pressable } = require('react-native');
  return {
    PlatformPressable: jest.fn(({ onPressIn, ...props }) => (
      <Pressable onPressIn={onPressIn} {...props} testID="platform-pressable" />
    )),
  };
});

describe('HapticTab component', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { value: originalPlatform });
  });

  it('renders a PlatformPressable with passed props', () => {
    const onPressInMock = jest.fn();
    const { getByTestId } = render(
      <HapticTab onPressIn={onPressInMock} testID="custom-tab" children={undefined} />
    );
    expect(getByTestId('platform-pressable')).toBeTruthy();
  });

  // Snapshot test
  it('matches the snapshot output', () => {
    const { toJSON } = render(
      <HapticTab testID="snapshot-tab" accessibilityLabel="tab-button" children={undefined} />
    );
    expect(toJSON()).toMatchSnapshot(); // Creates __snapshots__ if not exists
  });

  describe('triggers haptic feedback and calls onPressIn on iOS', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', { value: 'ios' });
    });

    it('calls haptics.impactAsync and onPressIn', () => {
      const onPressInMock = jest.fn();
      const { getByTestId } = render(<HapticTab onPressIn={onPressInMock} children={undefined} />);
      fireEvent(getByTestId('platform-pressable'), 'pressIn');
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
      expect(onPressInMock).toHaveBeenCalled();
    });
  });

  describe('does NOT trigger haptic feedback on non-iOS', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', { value: 'android' });
    });

    it('does NOT call haptics.impactAsync', () => {
      const onPressInMock = jest.fn();
      const { getByTestId } = render(<HapticTab onPressIn={onPressInMock} children={undefined} />);
      fireEvent(getByTestId('platform-pressable'), 'pressIn');
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
      expect(onPressInMock).toHaveBeenCalled();
    });
  });

  describe('handles missing onPressIn without error', () => {
    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', { value: 'ios' });
    });

    it('does not throw error and calls haptics', () => {
      const { getByTestId } = render(<HapticTab children={undefined} />);
      expect(() => {
        fireEvent(getByTestId('platform-pressable'), 'pressIn');
      }).not.toThrow();
      expect(Haptics.impactAsync).toHaveBeenCalled();
    });
  });
});
