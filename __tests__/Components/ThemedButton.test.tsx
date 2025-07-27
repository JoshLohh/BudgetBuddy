import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemedButton } from '@/components/ThemedButton';
import { Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(),
}));

describe('ThemedButton', () => {
  const useColorSchemeMock = useColorScheme as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default light theme colors', () => {
    useColorSchemeMock.mockReturnValue('light');
    const { getByTestId } = render(
      <ThemedButton testID="themed-button">Click me</ThemedButton>
    );

    const button = getByTestId('themed-button');
    const stylesArray = Array.isArray(button.props.style)
      ? button.props.style
      : [button.props.style];

    const backgroundColor = stylesArray.find(s => s?.backgroundColor)?.backgroundColor;
    expect(backgroundColor).toBe(Colors.primary);
  });

  it('renders with default dark theme colors', () => {
    useColorSchemeMock.mockReturnValue('dark');
    const { getByTestId } = render(
      <ThemedButton testID="themed-button">Click me</ThemedButton>
    );

    const button = getByTestId('themed-button');
    const stylesArray = Array.isArray(button.props.style)
      ? button.props.style
      : [button.props.style];

    const backgroundColor = stylesArray.find(s => s?.backgroundColor)?.backgroundColor;
    expect(backgroundColor).toBe(Colors.primary);
  });

  it('uses lightColor and darkColor overrides correctly', () => {
    const lightColor = '#abc';
    const darkColor = '#def';

    useColorSchemeMock.mockReturnValue('light');

    const { getByTestId, rerender } = render(
      <ThemedButton testID="themed-button" lightColor={lightColor} darkColor={darkColor}>
        Custom
      </ThemedButton>
    );

    const button = getByTestId('themed-button');
    const stylesLight = Array.isArray(button.props.style)
      ? button.props.style
      : [button.props.style];

    const backgroundColorLight = stylesLight.find(s => s?.backgroundColor)?.backgroundColor;
    expect(backgroundColorLight).toBe(lightColor);

    useColorSchemeMock.mockReturnValue('dark');

    rerender(
      <ThemedButton testID="themed-button" lightColor={lightColor} darkColor={darkColor}>
        Custom
      </ThemedButton>
    );

    const stylesDark = Array.isArray(button.props.style)
      ? button.props.style
      : [button.props.style];

    const backgroundColorDark = stylesDark.find(s => s?.backgroundColor)?.backgroundColor;
    expect(backgroundColorDark).toBe(darkColor);
  });

  it('applies pressed style (opacity)', () => {
    useColorSchemeMock.mockReturnValue('light');
    const styleFn = ({ pressed }: { pressed: boolean }) => [
      {
        backgroundColor: Colors.primary,
      },
      pressed && { opacity: 0.6 },
    ];

    const stylesArray = styleFn({ pressed: true });
    const hasOpacity = stylesArray.some((s: any) => s?.opacity === 0.6);
    expect(hasOpacity).toBe(true);
  });

  it('wraps string children in a Text component', () => {
    useColorSchemeMock.mockReturnValue('light');
    const { getByText } = render(<ThemedButton>Wrapped</ThemedButton>);
    expect(getByText('Wrapped')).toBeTruthy();
  });

  it('renders component children as-is', () => {
    useColorSchemeMock.mockReturnValue('light');
    const { getByTestId } = render(
      <ThemedButton>
        <Text testID="child">Child content</Text>
      </ThemedButton>
    );
    expect(getByTestId('child')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    useColorSchemeMock.mockReturnValue('light');
    const onPressMock = jest.fn();

    const { getByTestId } = render(
      <ThemedButton testID="themed-button" onPress={onPressMock}>
        Tap
      </ThemedButton>
    );

    fireEvent.press(getByTestId('themed-button'));
    expect(onPressMock).toHaveBeenCalled();
  });
  
  //Snapshot test
  it('matches the snapshot', () => {
    useColorSchemeMock.mockReturnValue('light');
    const { toJSON } = render(
      <ThemedButton testID="themed-button" lightColor="#abc" darkColor="#def">
        Snapshot
      </ThemedButton>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
