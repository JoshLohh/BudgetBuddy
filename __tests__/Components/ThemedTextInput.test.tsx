import React from 'react';
import { render } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { Colors } from '../../constants/Colors';
import ThemedTextInput from '../../components/ThemedTextInput';

describe('ThemedTextInput', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('applies correct styles in light mode', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');

    const { getByPlaceholderText } = render(
      <ThemedTextInput placeholder="Light input" />
    );
    const input = getByPlaceholderText('Light input');
    const styles = Array.isArray(input.props.style) ? input.props.style : [input.props.style];

    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: Colors.light.uiBackGround,
          color: Colors.light.text,
          padding: 20,
          borderRadius: 6,
        }),
      ])
    );
  });

  it('applies correct styles in dark mode', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');

    const { getByPlaceholderText } = render(
      <ThemedTextInput placeholder="Dark input" />
    );
    const input = getByPlaceholderText('Dark input');
    const styles = Array.isArray(input.props.style) ? input.props.style : [input.props.style];

    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: Colors.dark.uiBackGround,
          color: Colors.dark.text,
          padding: 20,
          borderRadius: 6,
        }),
      ])
    );
  });

  it('falls back to light theme if useColorScheme returns undefined', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(undefined);

    const { getByPlaceholderText } = render(
      <ThemedTextInput placeholder="Fallback input" />
    );
    const input = getByPlaceholderText('Fallback input');
    const styles = Array.isArray(input.props.style) ? input.props.style : [input.props.style];

    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: Colors.light.uiBackGround,
          color: Colors.light.text,
          padding: 20,
          borderRadius: 6,
        }),
      ])
    );
  });

  it('merges custom styles with default styles', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');

    const customStyle = { margin: 12, borderWidth: 2 };
    const { getByPlaceholderText } = render(
      <ThemedTextInput placeholder="Styled input" style={customStyle} />
    );
    const input = getByPlaceholderText('Styled input');
    const styles = Array.isArray(input.props.style) ? input.props.style : [input.props.style];

    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle),
      ])
    );
  });

  it('matches snapshot for light theme', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');

    const tree = render(<ThemedTextInput placeholder="Snapshot input" />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('matches snapshot for dark theme', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    const tree = render(<ThemedTextInput placeholder="Dark mode snapshot" />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  
});

/**
 * This test suite validates ThemedTextInput's behavior under different theme conditions.
 * It ensures that default and merged styles are applied correctly, theme detection works
 * via useColorScheme, and the rendered structure remains stable over time via snapshot testing.
 */
