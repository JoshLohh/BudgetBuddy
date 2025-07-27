import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BackButton from '../../components/BackButton';

// Mock expo-router's useRouter and back()
jest.mock('expo-router', () => {
  const backMock = jest.fn();
  return {
    useRouter: () => ({
      back: backMock,
    }),
    __esModule: true,
    _backMock: backMock,
  };
});

// ✅ Mock Ionicons with safe scoped factory using createElement
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: (props: any) => React.createElement('icon', props, null),
  };
});

const getBackMock = () => require('expo-router')._backMock;

describe('BackButton Component', () => {
  beforeEach(() => {
    getBackMock().mockClear();
  });

  it('renders correctly with default props', () => {
    const { getByRole } = render(<BackButton />);
    const pressable = getByRole('button');
    expect(pressable).toBeTruthy();
  });

  it('renders Ionicons with correct props when overridden', () => {
    const { getByTestId } = render(<BackButton color="red" size={30} />);
    const icon = getByTestId('back-icon');
    expect(icon.props.color).toBe('red');
    expect(icon.props.size).toBe(30);
  });

  it('merges custom and default styles', () => {
    const { getByRole } = render(<BackButton style={{ margin: 5 }} />);
    const { style } = getByRole('button').props;
    expect(style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ padding: 10 }),
        expect.objectContaining({ margin: 5 }),
      ])
    );
  });

  it('calls router.back when pressed', () => {
    const { getByRole } = render(<BackButton />);
    fireEvent.press(getByRole('button'));
    expect(getBackMock()).toHaveBeenCalledTimes(1);
  });

  it('matches the UI snapshot', () => {
    const { toJSON } = render(<BackButton color="blue" size={28} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
