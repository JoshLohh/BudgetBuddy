import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { GroupsContext } from '@/contexts/GroupsContext';
import { useGroups } from '../../hooks/useGroups';

// Dummy value for testing context
const mockContextValue = {
  groups: [
    {
      id: '1',
      name: 'Test Group',
      $id: 'unique-id',
      title: 'Test Title',
      members: [],
      createdBy: 'user-id',
    },
  ],
  addGroup: jest.fn(),
  fetchGroups: jest.fn(),
  fetchGroupsById: jest.fn(),
  createGroup: jest.fn(),
  deleteGroup: jest.fn(),
};

describe('useGroups', () => {
    
  //correct return context value 
  it('returns context value when inside provider', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <GroupsContext.Provider value={mockContextValue}>{children}</GroupsContext.Provider>
    );
    const { result } = renderHook(() => useGroups(), { wrapper });
    expect(result.current).toBe(mockContextValue);
  });
  //throws error if used outside provider
  it('throws error if used outside provider', () => {
    // Suppress error output for this test
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => renderHook(() => useGroups())).toThrow(
      /useUser must be used within a GroupProvider/i
    );

    errorSpy.mockRestore();
  });

  //explicitly null context value
it('throws error if context value is null', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GroupsContext.Provider value={null as any}>{children}</GroupsContext.Provider>
    );
    expect(() => renderHook(() => useGroups(), { wrapper })).toThrow(
      /useUser must be used within a GroupProvider/i
    );
  });
  
  //explicitly undefined context value
  it('throws error if context value is undefined', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GroupsContext.Provider value={undefined as any}>{children}</GroupsContext.Provider>
    );
    expect(() => renderHook(() => useGroups(), { wrapper })).toThrow(
      /useUser must be used within a GroupProvider/i
    );
  });
  
  //returns minimal context without alteration
  it('returns minimal context value as-is', () => {
    const minimalContext = {};
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GroupsContext.Provider value={minimalContext as any}>{children}</GroupsContext.Provider>
    );
    const { result } = renderHook(() => useGroups(), { wrapper });
    expect(result.current).toBe(minimalContext);
  });
  
  // error message exact match
  it('throws error with the correct message', () => {
    expect(() => renderHook(() => useGroups())).toThrow(
      'useUser must be used within a GroupProvider'
    );
  });
  
});
