import React from 'react';
import { render } from '@testing-library/react-native';
import { IconSymbol } from '../../../components/ui/IconSymbol.tsx';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Mock MaterialIcons to spy on its calls
jest.mock('@expo/vector-icons/MaterialIcons', () => {
  return jest.fn(() => null);
});

describe('IconSymbol tests using toHaveBeenCalledWith pattern', () => {
  beforeEach(() => {
    (MaterialIcons as unknown as jest.Mock).mockClear();
  });

  it('calls MaterialIcons with correct mapped names and props for house.fill', () => {
    render(<IconSymbol name="house.fill" color="#fff" size={24} />);
    expect(MaterialIcons).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'home',
        size: 24,
        style: undefined,
        color: '#fff'
      }),
      undefined
    );
  });

  it('calls MaterialIcons with correct mapped names and custom size', () => {
    render(<IconSymbol name="paperplane.fill" color="#000" size={30} />);
    expect(MaterialIcons).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'send',
        size: 30,
        style: undefined,
        color: '#000'
      }),
      undefined
    );
  });

  it('calls MaterialIcons with correct mapped names for chevron.left.forwardslash.chevron.right', () => {
    render(<IconSymbol name="chevron.left.forwardslash.chevron.right" color="#09f" size={32} />);
    expect(MaterialIcons).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'code',
        size: 32,
        style: undefined,
        color: '#09f'
      }),
      undefined
    );
  });

  it('calls MaterialIcons with correct mapped name for chevron.right', () => {
    render(<IconSymbol name="chevron.right" color="#123" size={20} />);
    expect(MaterialIcons).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'chevron-right',
        size: 20,
        style: undefined,
        color: '#123'
      }),
      undefined
    );
  });

  it('calls MaterialIcons with any custom style', () => {
    const customStyle = { margin: 14, opacity: 0.4 };
    render(<IconSymbol name="house.fill" color="#aab" style={customStyle} />);
    expect(MaterialIcons).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'home',
        size: 24,
        style: { margin: 14, opacity: 0.4 },
        color: '#aab'
      }),
      undefined
    );
  });

  it('calls MaterialIcons using default size and style when optional props are missing', () => {
    render(<IconSymbol name="paperplane.fill" color="#eee" />);
    expect(MaterialIcons).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'send',
        size: 24, // default size
        style: undefined,
        color: '#eee'
      }),
      undefined
    );
  });

  it('matches snapshot', () => {
    const tree = render(<IconSymbol name="house.fill" color="#000" />).toJSON();
    expect(tree).toMatchSnapshot();
  });
  
});

