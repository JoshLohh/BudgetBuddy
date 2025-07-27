import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Collapsible } from '../../components/Collapsible';
import * as useColorSchemeModule from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';

// Mock IconSymbol
jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: jest.fn((props) => null),
}));

describe('Collapsible', () => {
  beforeEach(() => {
    jest.spyOn(useColorSchemeModule, 'useColorScheme').mockReturnValue('light');
    (IconSymbol as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders title and is initially collapsed', () => {
    const { getByText, queryByText } = render(
      <Collapsible title="Section Title">
        <Text>Hidden Content</Text>
      </Collapsible>
    );

    expect(getByText('Section Title')).toBeTruthy();
    expect(queryByText('Hidden Content')).toBeNull();

    const firstCallProps = (IconSymbol as jest.Mock).mock.calls[0][0];
    expect(firstCallProps).toEqual(
      expect.objectContaining({
        name: 'chevron.right',
        style: {
          transform: [{ rotate: '0deg' }]
        }
      })
    );
  });

  it('expands and collapses content on title press', () => {
    const { getByText, queryByText } = render(
      <Collapsible title="Section Title">
        <Text>Hidden Content</Text>
      </Collapsible>
    );

    const title = getByText('Section Title');

    fireEvent.press(title);
    expect(queryByText('Hidden Content')).toBeTruthy();

    const expandedCallProps = (IconSymbol as jest.Mock).mock.calls.at(-1)?.[0];
    expect(expandedCallProps).toEqual(
      expect.objectContaining({
        name: 'chevron.right',
        style: {
          transform: [{ rotate: '90deg' }]
        }
      })
    );

    fireEvent.press(title);
    expect(queryByText('Hidden Content')).toBeNull();

    const collapsedCallProps = (IconSymbol as jest.Mock).mock.calls.at(-1)?.[0];
    expect(collapsedCallProps).toEqual(
      expect.objectContaining({
        name: 'chevron.right',
        style: {
          transform: [{ rotate: '0deg' }]
        }
      })
    );
  });

  it('renders correctly on dark theme', () => {
    jest.spyOn(useColorSchemeModule, 'useColorScheme').mockReturnValue('dark');

    const { getByText, queryByText } = render(
      <Collapsible title="Dark Theme Section">
        <Text>Dark Mode Content</Text>
      </Collapsible>
    );

    expect(getByText('Dark Theme Section')).toBeTruthy();
    expect(queryByText('Dark Mode Content')).toBeNull();
  });

  it('renders title even if no children are provided', () => {
    const { getByText } = render(<Collapsible title="Title Only" />);
    expect(getByText('Title Only')).toBeTruthy();
  });

  //Snapshot test
  it('matches snapshot when collapsed', () => {
    const { toJSON } = render(
      <Collapsible title="Snapshot Section">
        <Text>Snapshot content</Text>
      </Collapsible>
    );
  
    expect(toJSON()).toMatchSnapshot();
  });

});
