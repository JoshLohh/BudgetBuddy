import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText, ThemedTextProps } from '../../components/ThemedText';
import * as useThemeColorModule from '@/hooks/useThemeColor';

describe('ThemedText', () => {
  beforeEach(() => {
    jest
      .spyOn(useThemeColorModule, 'useThemeColor')
      .mockImplementation(({ light }) => light || '#000');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the default type with default color', () => {
    const { getByText } = render(<ThemedText>Sample Text</ThemedText>);
    const text = getByText('Sample Text');

    expect(text.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#000' }),
        expect.objectContaining({ fontSize: 16 }),
      ])
    );
  });

  it('applies the correct styles for "title" type', () => {
    const { getByText } = render(<ThemedText type="title">Title Text</ThemedText>);
    const text = getByText('Title Text');

    expect(text.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontSize: 28 }),
        expect.objectContaining({ fontWeight: 'bold' }),
      ])
    );
  });

  it('applies custom lightColor and darkColor overrides', () => {
    const customLightColor = '#123456';
    jest
      .spyOn(useThemeColorModule, 'useThemeColor')
      .mockImplementation(() => customLightColor);

    const { getByText } = render(
      <ThemedText lightColor={customLightColor}>Custom Color</ThemedText>
    );
    const text = getByText('Custom Color');

    expect(text.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: customLightColor }),
      ])
    );
  });

  it('merges custom style correctly', () => {
    const customStyle: { fontStyle?: 'italic' | 'normal' } = { fontStyle: 'italic' };
    const { getByText } = render(
      <ThemedText style={customStyle}>Styled Text</ThemedText>
    );
    const text = getByText('Styled Text');

    expect(text.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle),
      ])
    );
  });

  it('renders gracefully when invalid type is passed (falls back with only color)', () => {
    const invalidType = 'invalid_type' as ThemedTextProps['type'];
    const { getByText } = render(
      <ThemedText type={invalidType}>Fallback Text</ThemedText>
    );
    const text = getByText('Fallback Text');
  
    expect(text.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#000' }), // provided by mock useThemeColor
      ])
    );
  });
  it('matches the snapshot for default type', () => {
    const tree = render(<ThemedText>Snapshot Text</ThemedText>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('matches the snapshot for title type', () => {
    const tree = render(<ThemedText type="title">Snapshot Title</ThemedText>).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

/**
 * This test suite verifies that ThemedText correctly applies theme-based text color,
 * predefined typography variants (based on 'type'), style merging, and fallback behavior
 * for invalid input. It mocks `useThemeColor` to consistently test color resolution logic.
 */
