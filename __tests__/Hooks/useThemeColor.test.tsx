import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';

// Mock useColorScheme so you control the scheme in each test
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(),
}));
const mockUseColorScheme = require('@/hooks/useColorScheme').useColorScheme as jest.Mock;

// Consumer component for testing useThemeColor
function ThemeColorDisplay({
  props,
  colorName = 'text',
}: {
  props?: { light?: string; dark?: string };
  colorName?: string;
}) {
  const color = useThemeColor(props || {}, colorName as keyof typeof Colors.light & keyof typeof Colors.dark);
  return <Text testID="theme-color">{color}</Text>;
}

describe('useThemeColor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns light override if provided and scheme is light', () => {
    mockUseColorScheme.mockReturnValue('light');
    const { getByTestId } = render(
      <ThemeColorDisplay props={{ light: '#11181C', dark: '#ECEDEE' }} colorName="text" />
    );
    expect(getByTestId('theme-color').props.children).toBe('#11181C');
  });

  it('returns dark override if provided and scheme is dark', () => {
    mockUseColorScheme.mockReturnValue('dark');
    const { getByTestId } = render(
      <ThemeColorDisplay props={{ light: '#11181C', dark: '#ECEDEE' }} colorName="text" />
    );
    expect(getByTestId('theme-color').props.children).toBe('#ECEDEE');
  });

  it('falls back to palette color if no override, light scheme', () => {
    mockUseColorScheme.mockReturnValue('light');
    const { getByTestId } = render(<ThemeColorDisplay props={{}} colorName="text" />);
    expect(getByTestId('theme-color').props.children).toBe(Colors.light.text);
  });

  it('falls back to palette color if no override, dark scheme', () => {
    mockUseColorScheme.mockReturnValue('dark');
    const { getByTestId } = render(<ThemeColorDisplay props={{}} colorName="text" />);
    expect(getByTestId('theme-color').props.children).toBe(Colors.dark.text);
  });

  it('defaults to light scheme if useColorScheme returns undefined', () => {
    mockUseColorScheme.mockReturnValue(undefined);
    const { getByTestId } = render(<ThemeColorDisplay props={{}} colorName="text" />);
    expect(getByTestId('theme-color').props.children).toBe(Colors.light.text);
  });

  it('returns override only for the correct scheme (no cross-scheme bleed)', () => {
    mockUseColorScheme.mockReturnValue('dark');
    const { getByTestId } = render(<ThemeColorDisplay props={{ light: '#onlylight' }} colorName="text" />);
    // No dark override, so should fall back to palette
    expect(getByTestId('theme-color').props.children).toBe(Colors.dark.text);
  });

  it('returns undefined when colorName is not in palette', () => {
    mockUseColorScheme.mockReturnValue('light');
    // purposely using an invalid colorName
    const { getByTestId } = render(<ThemeColorDisplay props={{}} colorName="notAColor" />);
    expect(getByTestId('theme-color').props.children).toBeUndefined();
  });
});
