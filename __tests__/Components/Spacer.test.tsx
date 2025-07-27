import React from 'react';
import { render } from '@testing-library/react-native';
import Spacer from '@/components/Spacer';

describe('Spacer component', () => {
  it('renders a default spacer with width 100% and height 40', () => {
    const { getByTestId } = render(<Spacer testID="spacer" />);
    const spacer = getByTestId('spacer');

    expect(spacer.props.style).toEqual(
      expect.objectContaining({
        width: '100%',
        height: 40,
      })
    );
  });

  it('applies width and height when provided as numbers', () => {
    const { getByTestId } = render(<Spacer width={50} height={20} testID="spacer" />);
    const spacer = getByTestId('spacer');

    expect(spacer.props.style).toEqual(
      expect.objectContaining({
        width: 50,
        height: 20,
      })
    );
  });

  it('applies width and height when provided as percentage strings', () => {
    const { getByTestId } = render(<Spacer width="25%" height="15%" testID="spacer" />);
    const spacer = getByTestId('spacer');

    expect(spacer.props.style).toEqual(
      expect.objectContaining({
        width: '25%',
        height: '15%',
      })
    );
  });

  it('renders correctly with zero width or height', () => {
    const { getByTestId } = render(<Spacer width={0} height={0} testID="spacer" />);
    const spacer = getByTestId('spacer');

    expect(spacer.props.style).toEqual(
      expect.objectContaining({
        width: 0,
        height: 0,
      })
    );
  });

  it('renders correctly with large width and height', () => {
    const { getByTestId } = render(<Spacer width={1000} height={500} testID="spacer" />);
    const spacer = getByTestId('spacer');

    expect(spacer.props.style).toEqual(
      expect.objectContaining({
        width: 1000,
        height: 500,
      })
    );
  });

  //Snapshot test
  it('matches snapshot with custom width and height', () => {
    const { toJSON } = render(<Spacer width={200} height={100} testID="spacer" />);
    expect(toJSON()).toMatchSnapshot();
  });
});
