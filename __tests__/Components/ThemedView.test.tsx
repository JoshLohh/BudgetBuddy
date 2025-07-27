import React from 'react';
import { render } from '@testing-library/react-native';
import * as ThemeHook from '@/hooks/useThemeColor';
import * as SafeArea from 'react-native-safe-area-context';
import { ThemedView } from '../../components/ThemedView';

// Mock SafeArea context
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');

  return {
    ...actual,
    useSafeAreaInsets: jest.fn().mockReturnValue({ top: 10, bottom: 20, left: 0, right: 0 }),
  };
});

describe('ThemedView', () => {
  beforeEach(() => {
    jest.spyOn(ThemeHook, 'useThemeColor').mockImplementation(() => '#abcdef');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a View when safe is false (default)', () => {
    const { getByTestId } = render(<ThemedView testID="themed-view" />);
    const view = getByTestId('themed-view');

    expect(view.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#abcdef' }),
      ])
    );
  });

  it('renders a SafeAreaView when safe is true and respects insets', () => {
    const { getByTestId } = render(<ThemedView safe testID="safe-view" />);
    const safeView = getByTestId('safe-view');

    expect(safeView.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: '#abcdef',
          paddingTop: 10,
          paddingBottom: 20,
        }),
      ])
    );
  });

  it('merges custom style with themed background', () => {
    const customStyle = { borderRadius: 8 };
    const { getByTestId } = render(
      <ThemedView style={customStyle} testID="styled-view" />
    );
    const view = getByTestId('styled-view');

    expect(view.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderRadius: 8 }),
        expect.objectContaining({ backgroundColor: '#abcdef' }),
      ])
    );
  });

  it('uses lightColor and darkColor props in useThemeColor call', () => {
    const spy = jest
      .spyOn(ThemeHook, 'useThemeColor')
      .mockImplementation(({ light, dark }) => light ?? '#123456');

    render(
      <ThemedView
        testID="view-with-custom-colors"
        lightColor="#aabbcc"
        darkColor="#ddeeff"
      />
    );

    expect(spy).toHaveBeenCalledWith(
      { light: '#aabbcc', dark: '#ddeeff' },
      'background'
    );
  });

  it('matches snapshot for View (safe = false)', () => {
    const tree = render(<ThemedView testID="snapshot-view" />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('matches snapshot for SafeAreaView (safe = true)', () => {
    const tree = render(<ThemedView safe testID="snapshot-safe-view" />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

/**
 * Test Summary:
 * - Confirms correct conditional rendering between View and SafeAreaView.
 * - Mocks useThemeColor and useSafeAreaInsets to isolate theming and layout logic.
 * - Tests merging of theme-derived and custom styles.
 * - Snapshot tests ensure output stability as component evolves.
 */
