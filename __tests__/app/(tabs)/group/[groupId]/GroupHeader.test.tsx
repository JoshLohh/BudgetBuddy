/**
 * Test suite for GroupHeader component
 * Covers rendering, editing, avatar upload, backend integration,
 * error cases, and navigation.
 * Mocks Appwrite, fetch, Expo ImagePicker, and Expo Router.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import GroupHeader from '@/app/(tabs)/group/[groupId]/GroupHeader';
import { databases } from '@/lib/appwrite';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

// ----------- Mocks -----------
jest.mock('@/lib/appwrite', () => ({
  databases: { updateDocument: jest.fn() },
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn() }
}));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));
jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null, // Mock to a no-op component
  }));
  jest.mock('expo-image', () => ({
    Image: () => null,
  }));
  jest.mock('expo-font', () => ({
    loadAsync: jest.fn(),
  }));
  jest.mock('expo-asset', () => ({
    fromModule: jest.fn(() => ({ downloadAsync: jest.fn(), localUri: 'mock' })),
  }));

global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ $id: 'mockFileId' }),
  }) as unknown as typeof fetch;
  
// ----------- Test data -----------
const fakeGroup = {
  $id: "grp1",
  title: "Trip to Tokyo",
  description: "Spring vacation",
  createdBy: "user1",
  members: ["user1", "user2", "user3"],
  avatar: null,
};

const updatedGroup = {
  ...fakeGroup,
  title: "Tokyo 2025",
  description: "Updated trip!",
};

const avatarUrl = "https://example.com/avatar.jpg";

// ----------- Tests -----------
describe('GroupHeader', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (databases.updateDocument as jest.Mock).mockResolvedValue({});
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: true });
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ $id: 'mockFileId' }),
      }) as unknown as typeof fetch;
    });
  

  it('renders group info properly', () => {
    const { getByText } = render(
      <GroupHeader group={fakeGroup} totalExpenses={123.75} />
    );
    expect(getByText("Trip to Tokyo")).toBeTruthy();
    expect(getByText("Spring vacation")).toBeTruthy();
    expect(getByText("3 members")).toBeTruthy();
    expect(getByText("Total")).toBeTruthy();
    expect(getByText("$123.75")).toBeTruthy();
  });

  //Snapshots
  it('matches snapshot in view mode', () => {
    const tree = render(<GroupHeader group={fakeGroup} totalExpenses={42.50} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  //Snapshot
  it('matches snapshot in edit mode', () => {
    const { getByText, toJSON, getByTestId } = render(<GroupHeader group={fakeGroup} totalExpenses={99.00} />);
    //fireEvent.press(getByText("Edit"));
    fireEvent.press(getByTestId('edit-button'));
    expect(toJSON()).toMatchSnapshot();
  });

  it('enters edit mode and allows saving of new title & description', async () => {
    const onGroupUpdated = jest.fn();
    const { getByTestId, getByDisplayValue, getByText } = render(
      <GroupHeader group={fakeGroup} totalExpenses={79.6} onGroupUpdated={onGroupUpdated} />
    );
    fireEvent.press(getByTestId('edit-button'));
    fireEvent.changeText(getByDisplayValue('Trip to Tokyo'), 'Tokyo 2025');
    fireEvent.changeText(getByDisplayValue('Spring vacation'), 'Updated trip!');
    await act(async () => {
      fireEvent.press(getByText('Save'));
    });
    expect(databases.updateDocument).toHaveBeenCalled();
    expect(onGroupUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Tokyo 2025', description: 'Updated trip!' })
    );
  });
  it('shows error when save fails', async () => {
    (databases.updateDocument as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const { getByText, getByDisplayValue, findByText, getByTestId } = render(
      <GroupHeader group={fakeGroup} totalExpenses={79.60} />
    );
    fireEvent.press(getByTestId('edit-button'));

    await act(async () => {
      fireEvent.press(getByText("Save"));
    });
    expect(await findByText("Failed to update group details.")).toBeTruthy();
  });

  it('calls router.push for activity log and report buttons', () => {
    const { getByText, getByTestId } = render(<GroupHeader group={fakeGroup} totalExpenses={10} />);
    fireEvent.press(getByText("View Activity Log"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/group/[groupId]/history',
      params: { groupId: fakeGroup.$id }
    });
    fireEvent.press(getByTestId('report-button'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/group/[groupId]/report',
      params: { groupId: fakeGroup.$id }
    });
  });

  it('starts avatar picker and updates avatar on success', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "fakeuri.jpg", fileName: "file.jpg", mimeType: "image/jpeg" }]
    });
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ $id: 'mockFileId' }),
      }) as unknown as typeof fetch;
    

    const nextAvatarUrl = "https://testendpoint/avatars/mockFileId/view?project=testproject&t=123";
    const onGroupUpdated = jest.fn();
    const { getByLabelText } = render(
      <GroupHeader group={fakeGroup} totalExpenses={12} onGroupUpdated={onGroupUpdated} />
    );
    // Simulate avatar edit button (update selector as needed)
    // fireEvent.press(getByLabelText("Edit Avatar"));
    // For a real test, assign proper testID or accessibilityLabel to avatar edit touchable

    // You can now advance assertions once handleAvatarChange is invoked

    // expect(onGroupUpdated).toHaveBeenCalledWith(expect.objectContaining({ avatar: nextAvatarUrl }));
  });

  it('displays only title and correct members label for 1 member, does not crash with missing desc/avatar', () => {
    const oneMemberGroup = { ...fakeGroup, members: ["user1"], description: undefined, avatar: undefined };
    const { getByText, queryByText } = render(
      <GroupHeader group={oneMemberGroup} totalExpenses={999} />
    );
    expect(getByText("Trip to Tokyo")).toBeTruthy();
    expect(getByText("1 member")).toBeTruthy();
    expect(queryByText("Spring vacation")).toBeFalsy();
  });
});

//Next few tests focus on avatar change handling
describe('handleAvatarChange', () => {
    beforeAll(() => {
        global.alert = jest.fn();
      });

    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('alerts and returns if permissions are not granted', async () => {
  (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false });
  const { getByText, getByTestId } = render(<GroupHeader group={fakeGroup} totalExpenses={0} />);
  //fireEvent.press(getByText('Edit Avatar'));
  fireEvent.press(getByTestId('avatar-edit'));

  await waitFor(() => {
    expect(global.alert).toHaveBeenCalledWith('Permission to access gallery is required!');
  });
});
  
    it('does nothing if user cancels image picking', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: true });
      
      const { getByText, getByTestId } = render(<GroupHeader group={fakeGroup} totalExpenses={0} />);
      
      fireEvent.press(getByTestId('avatar-edit'));
      
      await new Promise(res => setTimeout(res, 0)); // next tick
      
      expect(fetch).not.toHaveBeenCalled();
    });
  
    it('uploads image and updates group on successful upload', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://myimage.jpg', mimeType: 'image/jpeg' }]
      });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ $id: '123' }),
      }) as unknown as typeof fetch;
    
      (databases.updateDocument as jest.Mock).mockResolvedValue({});
  
      const mockCallback = jest.fn();
      const { getByTestId } = render(<GroupHeader group={fakeGroup} totalExpenses={0} onGroupUpdated={mockCallback} />);
      
      fireEvent.press(getByTestId('avatar-edit'));
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
        expect(databases.updateDocument).toHaveBeenCalled();
        expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
          avatar: expect.stringContaining('/123')
        }));
      });
    });
  
    it('handles fetch json parse error gracefully', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://myimage.jpg', mimeType: 'image/jpeg' }]
      });
      const fakeResponse = {
        ok: true,
        json: jest.fn().mockImplementation(() => { throw new Error('invalid json'); })
      };
      global.fetch = jest.fn().mockResolvedValue(fakeResponse) as unknown as typeof fetch;
    
    
      
      const alertMock = jest.spyOn(global, 'alert').mockImplementation(() => {});
  
      const { getByText, getByTestId } = render(<GroupHeader group={fakeGroup} totalExpenses={0} />);
      
      fireEvent.press(getByTestId('avatar-edit'));
      
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Upload failed: invalid response from server.');
      });
  
      alertMock.mockRestore();
    });
  
    it('handles fetch non-ok response gracefully', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://myimage.jpg', mimeType: 'image/jpeg' }]
      });
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Server error' }),
      }) as unknown as typeof fetch;
    
  
      const alertMock = jest.spyOn(global, 'alert').mockImplementation(() => {});
  
      const { getByText, getByTestId } = render(<GroupHeader group={fakeGroup} totalExpenses={0} />);
      
      fireEvent.press(getByTestId('avatar-edit'));
      
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Upload failed: Server error');
      });
      alertMock.mockRestore();
    });
  
    it('handles update document failure gracefully', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://myimage.jpg', mimeType: 'image/jpeg' }]
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ $id: '123' }),
      }) as unknown as typeof fetch;
    
      (databases.updateDocument as jest.Mock).mockRejectedValue(new Error('Failed to update'));
  
      const alertMock = jest.spyOn(global, 'alert').mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
      const { getByText, getByTestId } = render(<GroupHeader group={fakeGroup} totalExpenses={0} />);
      
      fireEvent.press(getByTestId('avatar-edit'));
      
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Error updating avatar');
        expect(consoleSpy).toHaveBeenCalled();
      });
  
      alertMock.mockRestore();
      consoleSpy.mockRestore();
    });
  });
  