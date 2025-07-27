import React from 'react';
import { render } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import ThemedCard from '../../components/ThemedCard';
import { Colors } from '../../constants/Colors';

describe('ThemedCard', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly with light theme background', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    const { getByTestId } = render(<ThemedCard testID="card" />);
    const card = getByTestId('card');
    const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];

    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: Colors.light.uiBackGround }),
      ]),
    );
  });

  it('renders correctly with dark theme background', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    const { getByTestId } = render(<ThemedCard testID="card" />);
    const card = getByTestId('card');
    const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];

    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: Colors.dark.uiBackGround }),
      ]),
    );
  });

  it('defaults to light theme when scheme is undefined', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(undefined);
    const { getByTestId } = render(<ThemedCard testID="card" />);
    const card = getByTestId('card');
    const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];

    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: Colors.light.uiBackGround }),
      ]),
    );
  });

  it('applies additional custom styles', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    const extraStyle = { margin: 20, padding: 99 };
    const { getByTestId } = render(<ThemedCard testID="card" style={extraStyle} />);
    const card = getByTestId('card');
    const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];

    expect(styles).toEqual(
      expect.arrayContaining([
        expect.objectContaining(extraStyle),
      ]),
    );
  });

  it('matches the snapshot for light theme', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    const tree = render(<ThemedCard testID="card" />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('matches the snapshot for dark theme', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    const tree = render(<ThemedCard testID="card" />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

/**
 * This test file verifies that ThemedCard renders with the correct UI background
 * color (from Colors.light.uiBackGround or Colors.dark.uiBackGround), depending on the
 * color scheme. It also checks proper merging of custom styles, and uses snapshot
 * tests to monitor unintended output changes for both themes.
 */
