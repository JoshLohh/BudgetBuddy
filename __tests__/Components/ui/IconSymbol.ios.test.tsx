// IconSymbol.ios.test.tsx

import React from 'react'
import { render } from '@testing-library/react-native'
import { SymbolView, SymbolViewProps } from 'expo-symbols'
import { ViewStyle } from 'react-native'
import { IconSymbol } from '../../../components/ui/IconSymbol.ios'

jest.mock('expo-symbols', () => ({
  SymbolView: jest.fn(() => null),
}))

describe('IconSymbol (iOS)', () => {
  const defaultProps = {
    name: 'star' as SymbolViewProps['name'],
    color: '#ff0',
  }

  beforeEach(() => {
    (SymbolView as jest.Mock).mockClear()
  })

  it('renders with required props and defaults', () => {
    render(<IconSymbol {...defaultProps} />)
    expect(SymbolView).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'star',
        tintColor: '#ff0',
        weight: 'regular',
        resizeMode: 'scaleAspectFit',
        style: expect.arrayContaining([
          expect.objectContaining({ height: 24, width: 24 }),
          undefined,
        ]),
      }),
      undefined // Fix here
    )
  })

  it('forwards size, color, style, weight', () => {
    const style: ViewStyle = { margin: 25 }
    render(
      <IconSymbol
        name={'bolt' as SymbolViewProps['name']}
        size={32}
        color="#123"
        style={style}
        weight="bold"
      />
    )
    expect(SymbolView).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'bolt',
        tintColor: '#123',
        weight: 'bold',
        resizeMode: 'scaleAspectFit',
        style: expect.arrayContaining([
          expect.objectContaining({ height: 32, width: 32 }),
          style,
        ]),
      }),
      undefined // Fix here
    )
  })

  it('handles absence of optional props', () => {
    render(<IconSymbol name={'cloud' as SymbolViewProps['name']} color="#00f" />)
    expect(SymbolView).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'cloud',
        tintColor: '#00f',
        weight: 'regular',
        resizeMode: 'scaleAspectFit',
        style: expect.arrayContaining([
          expect.objectContaining({ height: 24, width: 24 }),
          undefined,
        ]),
      }),
      undefined // Fix here
    )
  })

  //Snapshot
  it('matches snapshot with custom props', () => {
    const tree = render(
      <IconSymbol
        name={'wifi' as SymbolViewProps['name']}
        size={28}
        color="#aaa"
        style={{ alignSelf: 'center' }}
        weight="semibold"
      />
    ).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
