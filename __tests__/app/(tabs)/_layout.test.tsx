import React from 'react';
import { render } from '@testing-library/react-native';
import TabLayout from '../../../app/(tabs)/_layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Platform, Text } from 'react-native';

jest.mock('@/hooks/useColorScheme');

jest.mock('expo-router', () => {
    const React = require('react');
    const { Text, View } = require('react-native');
  
    const Tabs = jest.fn(({ children, screenOptions }) => {
      const TabBarButton = screenOptions?.tabBarButton ?? (() => null);
      const TabBarBackground = screenOptions?.tabBarBackground ?? (() => null);
  
      return (
        <>
          {children}
          <TabBarButton testID="mock-haptic-tab" />
          <TabBarBackground testID="mock-tab-bar-background" />
        </>
      );
    }) as any;
  
    Tabs.Screen = (props: any) => {
      // Render title and invoke tabBarIcon prop which renders IconSymbol mock
      return (
        <>
          <Text testID={props.name}>{props?.options?.title || 'No Title'}</Text>
          {props?.options?.tabBarIcon && (
            <View testID="mock-icon-container">
              {props.options.tabBarIcon({ color: 'black' })}
            </View>
          )}
        </>
      );
    };
  
    return { Tabs };
});
  

jest.mock('@/components/auth/UserOnly', () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

jest.mock('@/components/HapticTab', () => ({
  __esModule: true,
  HapticTab: (props: any) => {
    const { View } = require('react-native');
    return <View testID="mock-haptic-tab" {...props} />;
  },
}));

jest.mock('@/components/ui/IconSymbol', () => ({
  __esModule: true,
  IconSymbol: (props: any) => {
    const { View } = require('react-native');
    return <View testID="mock-icon" {...props} />;
  },
}));

jest.mock('@/components/ui/TabBarBackground', () => ({
  __esModule: true,
  default: (props: any) => {
    const { View } = require('react-native');
    return <View testID="mock-tab-bar-background" {...props} />;
  },
}));

jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: { tint: '#123', background: '#abc' },
    dark: { tint: '#456', background: '#def' },
  },
}));

describe('TabLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all Tabs.Screen with correct titles', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');
    const { getByText } = render(<TabLayout />);
    expect(getByText('Groups')).toBeTruthy();
    expect(getByText('Create')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  it('renders custom tab bar background and button', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');
    const { getAllByTestId } = render(<TabLayout />);
    expect(getAllByTestId('mock-haptic-tab').length).toBeGreaterThan(0);
    expect(getAllByTestId('mock-tab-bar-background').length).toBeGreaterThan(0);
  });

  it('passes correct color scheme to Tabs (light)', () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    const { Tabs } = require('expo-router');
    (useColorScheme as jest.Mock).mockReturnValue('light');
    render(<TabLayout />);
    const lastScreenOptions = Tabs.mock.calls[Tabs.mock.calls.length - 1][0]?.screenOptions;
    expect(lastScreenOptions.tabBarActiveTintColor).toEqual('#123');
    //expect(lastScreenOptions.tabBarStyle.backgroundColor).toEqual('#abc');
  });

  it('passes correct color scheme to Tabs (dark)', () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    const { Tabs } = require('expo-router');
    (useColorScheme as jest.Mock).mockReturnValue('dark');
    render(<TabLayout />);
    const lastScreenOptions = Tabs.mock.calls[Tabs.mock.calls.length - 1][0]?.screenOptions;
    expect(lastScreenOptions.tabBarActiveTintColor).toEqual('#456');
    //expect(lastScreenOptions.tabBarStyle.backgroundColor).toEqual('#def');
  });

  it('renders icons on tabs', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');
    const { getAllByTestId } = render(<TabLayout />);
    expect(getAllByTestId('mock-icon').length).toBeGreaterThan(0);
  });

  it('applies iOS-specific tabBarStyle', () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    const { Tabs } = require('expo-router');
    (useColorScheme as jest.Mock).mockReturnValue('light');
    render(<TabLayout />);
    const lastScreenOptions = Tabs.mock.calls[Tabs.mock.calls.length - 1][0]?.screenOptions;
    expect(lastScreenOptions.tabBarStyle.position).toBe('absolute');
  });

  it('applies android-specific tabBarStyle', () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    
    // Mock Platform.select to behave properly
    jest.spyOn(Platform, 'select').mockImplementation((obj: any) => {
        return obj.android ?? (obj as any).default ?? {};
    });
  
    const { Tabs } = require('expo-router');
    (useColorScheme as jest.Mock).mockReturnValue('light');
    render(<TabLayout />);
    const lastScreenOptions = Tabs.mock.calls[Tabs.mock.calls.length - 1][0]?.screenOptions;
  
    expect(lastScreenOptions.tabBarStyle).toEqual({});
  });

  it('handles null color scheme gracefully', () => {
    const { Tabs } = require('expo-router');
    (useColorScheme as jest.Mock).mockReturnValue(null);
    render(<TabLayout />);
    const lastScreenOptions = Tabs.mock.calls[Tabs.mock.calls.length - 1][0]?.screenOptions;
    expect(lastScreenOptions.tabBarActiveTintColor).toEqual('#123'); // fallback to light theme
  });

  it('applies light mode correctly (snapshot)', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');
    const { toJSON } = render(<TabLayout />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('applies dark mode correctly (snapshot)', () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');
    const { toJSON } = render(<TabLayout />);
    expect(toJSON()).toMatchSnapshot();
  });

  /*it('does not render tabs if unauthenticated', () => {
    jest.resetModules();
    jest.doMock('@/components/auth/UserOnly', () => ({
      __esModule: true,
      default: () => null, // simulating unauthenticated user hides content
    }));
    const { getByTestId } = require('@testing-library/react-native');
    const TabLayoutReloaded = require('../../../app/(tabs)/_layout').default;
    const tree = getByTestId ? render(<TabLayoutReloaded />).toJSON() : null;
    expect(tree).toBeNull();
  });*/
});



describe('TabLayout (unauthenticated)', () => {
    let TabLayoutReloaded: React.ComponentType;
    beforeAll(() => {
        jest.resetModules();
        jest.doMock('@/components/auth/UserOnly', () => ({
          __esModule: true,
          default: () => null,
        }));
        TabLayoutReloaded = require('../../../app/(tabs)/_layout').default; // load after mock
      });
      
      afterAll(() => {
        jest.resetModules();
      });
      
      it('does not render tabs if unauthenticated', () => {
        const tree = render(<TabLayoutReloaded />).toJSON();
        expect(tree).toBeNull();
      });
});
