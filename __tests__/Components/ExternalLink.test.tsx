import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ExternalLink } from '@/components/ExternalLink';
import * as ExpoWebBrowser from 'expo-web-browser';

jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    Link: jest.fn(({ children, ...props }) => <Text {...props}>{children}</Text>),
    __esModule: true,
  };
});

jest.mock('expo-web-browser');

describe('ExternalLink', () => {
  const openBrowserAsyncMock = ExpoWebBrowser.openBrowserAsync as jest.Mock;
  const LinkMock = require('expo-router').Link as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a Link component and passes all props', () => {
    LinkMock.mockImplementation(({ children, ...props }) => {
      const { Text } = require('react-native');
      return <Text {...props}>{children}</Text>;
    });

    const { getByText } = render(
      <ExternalLink href="https://example.com" testID="link">
        Go to Example
      </ExternalLink>
    );

    expect(getByText('Go to Example')).toBeTruthy();

    expect(LinkMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        href: 'https://example.com',
        testID: 'link',
        children: 'Go to Example',
      })
    );
  });

  // Snapshot Test
  it('matches the snapshot output', () => {
    LinkMock.mockImplementation(({ children, ...props }) => {
      const { Text } = require('react-native');
      return <Text {...props}>{children}</Text>;
    });

    const { toJSON } = render(
      <ExternalLink href="https://example.com" testID="link">
        Snapshot Test
      </ExternalLink>
    );

    expect(toJSON()).toMatchSnapshot();
  });

  describe('on web platform', () => {
    const originalPlatform = Platform.OS;
    beforeAll(() => {
      Object.defineProperty(Platform, 'OS', { value: 'web' });
    });
    afterAll(() => {
      Object.defineProperty(Platform, 'OS', { value: originalPlatform });
    });

    it('does NOT prevent default or call openBrowserAsync on press', () => {
      LinkMock.mockImplementation(({ children, onPress, ...props }) => {
        const { Text } = require('react-native');
        return <Text {...props} onPress={onPress}>{children}</Text>;
      });

      const { getByText } = render(
        <ExternalLink href="https://example.com">Link</ExternalLink>
      );

      fireEvent.press(getByText('Link'));
      expect(openBrowserAsyncMock).not.toHaveBeenCalled();
    });
  });

  describe('on native platforms', () => {
    const originalPlatform = Platform.OS;
    beforeAll(() => {
      Object.defineProperty(Platform, 'OS', { value: 'ios' });
    });
    afterAll(() => {
      Object.defineProperty(Platform, 'OS', { value: originalPlatform });
    });

    it('prevents default and calls openBrowserAsync with href', () => {
      const preventDefaultMock = jest.fn();

      LinkMock.mockImplementation(({ children, onPress, ...props }) => {
        const { Text } = require('react-native');
        return (
          <Text {...props} onPress={() => onPress?.({ preventDefault: preventDefaultMock })}>
            {children}
          </Text>
        );
      });

      const { getByText } = render(
        <ExternalLink href="https://example.com">Link</ExternalLink>
      );

      fireEvent.press(getByText('Link'));
      expect(preventDefaultMock).toHaveBeenCalled();
      expect(openBrowserAsyncMock).toHaveBeenCalledWith('https://example.com');
    });
  });
});
