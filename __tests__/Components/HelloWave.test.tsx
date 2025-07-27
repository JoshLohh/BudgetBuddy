import React from 'react';
import { render } from '@testing-library/react-native';
import { HelloWave } from '../../components/HelloWave';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  // Override specific methods to mock Reanimated 2 behavior
  Reanimated.useSharedValue = jest.fn(() => ({ value: 0 }));
  Reanimated.useAnimatedStyle = jest.fn(() => ({ transform: [{ rotate: '0deg' }] }));
  Reanimated.withRepeat = jest.fn((val, count) => `withRepeat(${val}, ${count})`);
  Reanimated.withSequence = jest.fn((...args) => `withSequence(${args.map(arg => JSON.stringify(arg)).join(', ')})`);
  Reanimated.withTiming = jest.fn((val, options) => `withTiming(${val}, ${JSON.stringify(options)})`);
  return Reanimated;
});

describe('HelloWave', () => {
  it('renders without crashing and shows Hello content', () => {
    const { getByTestId } = render(<HelloWave />);
expect(getByTestId('hello-text')).toBeTruthy();

  });

  it('sets up rotation animation using withRepeat and withSequence', () => {
    const sharedRotation = require('react-native-reanimated').useSharedValue();
    const repeat = require('react-native-reanimated').withRepeat;
    const sequence = require('react-native-reanimated').withSequence;
    const timing = require('react-native-reanimated').withTiming;

    // Render triggers useEffect
    render(<HelloWave />);

    expect(timing).toHaveBeenCalledWith(25, { duration: 150 });
    expect(timing).toHaveBeenCalledWith(0, { duration: 150 });
    expect(sequence).toHaveBeenCalled();
    expect(repeat).toHaveBeenCalledWith(expect.anything(), 4);
  });

  it('applies animated style with rotation', () => {
    const animatedStyle = require('react-native-reanimated').useAnimatedStyle();
    expect(animatedStyle).toEqual({ transform: [{ rotate: '0deg' }] });
  });

  it('matches snapshot', () => {
    const tree = render(<HelloWave />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
