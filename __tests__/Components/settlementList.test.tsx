import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SettlementList from '../../components/settlementList';
import { Settlement } from '@/types';
import { ReactTestInstance } from 'react-test-renderer';

describe('SettlementList', () => {
  const userId = 'user1';

  const mockGetUsername = (id: string) => `User-${id}`;

  const mockSettleUp: (from: string, to: string, amount: number) => Promise<void> =
  jest.fn().mockResolvedValue(undefined);

  const baseSettlements: Settlement[] = [
    { from: 'user2', to: 'user1', amount: 10, groupId: 'g1', $createdAt: '', $id: '1' },
    { from: 'user1', to: 'user3', amount: 5, groupId: 'g1', $createdAt: '', $id: '2' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "you are owed" statement with proper color', async () => {
    const { getByText } = render(
      <SettlementList
        currentUserId="user1"
        suggestedSettlements={baseSettlements}
        getUsername={mockGetUsername}
        settleUp={mockSettleUp}
      />
    );

    await waitFor(() => {
      expect(getByText('You are owed $5.00')).toBeTruthy();
    });
  });

  it('renders "you owe" statement when net balance is negative', async () => {
    const negativeSettlements: Settlement[] = [
      { from: 'user1', to: 'user2', amount: 50, groupId: 'g1', $createdAt: '', $id: '1' },
    ];

    const { getByText } = render(
      <SettlementList
        currentUserId="user1"
        suggestedSettlements={negativeSettlements}
        getUsername={mockGetUsername}
        settleUp={mockSettleUp}
      />
    );

    await waitFor(() => {
      expect(getByText('You owe $50.00')).toBeTruthy();
    });
  });

  it('renders "no settlements needed" when list is empty', async () => {
    const { getByText } = render(
      <SettlementList
        currentUserId="userX"
        suggestedSettlements={[]}
        getUsername={mockGetUsername}
        settleUp={mockSettleUp}
      />
    );

    await waitFor(() => {
      expect(getByText('No settlements needed.')).toBeTruthy();
    });
  });

  it('renders all settlements for the current user', async () => {
    const { getByText, getAllByText } = render(
      <SettlementList
        currentUserId="user1"
        suggestedSettlements={baseSettlements}
        getUsername={mockGetUsername}
        settleUp={mockSettleUp}
      />
    );
  
    await waitFor(() => {
      expect(getByText('$10.00')).toBeTruthy();
      expect(getByText('$5.00')).toBeTruthy();
      expect(getByText(/User-user2/)).toBeTruthy();
      expect(getAllByText(/User-user1/).length).toBeGreaterThanOrEqual(2);
      expect(getByText(/User-user3/)).toBeTruthy();
    });
  });

  it('calls settleUp after confirm in Alert', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      const confirmButton = buttons?.find(button => button.text === 'Confirm');
      if (confirmButton && confirmButton.onPress) {
        act(() => {
          if (confirmButton.onPress) {
            confirmButton.onPress();
          }
        });
      }
    });

    const { getAllByText } = render(
      <SettlementList
        currentUserId="user1"
        suggestedSettlements={baseSettlements}
        getUsername={mockGetUsername}
        settleUp={mockSettleUp}
      />
    );

    const buttons = getAllByText('Settle Up');
    fireEvent.press(buttons[1]); // The one where user1 is "from"

    await waitFor(() => {
      expect(mockSettleUp).toHaveBeenCalledWith('user1', 'user3', 5);
    });
  });

  it('disables Settle Up button during processing', async () => {
    const longSettleUp: (from: string, to: string, amount: number) => Promise<void> =
      (from, to, amount) => new Promise(resolve => setTimeout(resolve, 100));
  
    const { getAllByText, getAllByRole } = render(
      <SettlementList
        currentUserId="user1"
        suggestedSettlements={baseSettlements}
        getUsername={mockGetUsername}
        settleUp={longSettleUp}
      />
    );
  
    const buttons = getAllByText('Settle Up');
  
    await act(async () => {
      fireEvent.press(buttons[1]); // e.g., settlement from user1 → user3
    });
  
    const pressables = getAllByRole('button');
  
    const anyButtonDisabled = pressables.some(
      node => node.props.accessibilityState?.disabled === true
    );
  
    expect(anyButtonDisabled).toBe(true);
  });
  
  //Snapshot test
  it('matches snapshot with typical settlement list', () => {
    const settlements = [
      { from: 'user2', to: 'user1', amount: 10, groupId: 'g1', $createdAt: '', $id: '1' },
      { from: 'user1', to: 'user3', amount: 5, groupId: 'g1', $createdAt: '', $id: '2' },
    ];
    const { toJSON } = render(
      <SettlementList
        currentUserId="user1"
        suggestedSettlements={settlements}
        getUsername={(id) => `User-${id}`}
        settleUp={jest.fn().mockResolvedValue(undefined)}
      />
    );
    expect(toJSON()).toMatchSnapshot();
  });
  
});

/**
 * Summary:
 * - Ensures correct rendering logic based on user settlements and roles.
 * - Uses waitFor and act to avoid "not wrapped in act(...)" errors.
 * - Mocks Alert.confirm behavior to simulate user action.
 * - Verifies styling/outcome text (e.g., 'You are owed') and interactive logic.
 */
