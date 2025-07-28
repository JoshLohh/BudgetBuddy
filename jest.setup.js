import { NativeModules } from 'react-native';

process.env.EXPO_PUBLIC_APPWRITE_API_KEY = 'standard_bd7af59b45f44af6df180d0e01b63906abef8309005ac9ef3707731dec63305bc7c50d3f3f31cd5';
process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1'
process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID = '683b7b97000aae994ff5';
process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID = '684bd404003542c8a2ac';
process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID = '685cf12e003976d23b39';
process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID = '684bd5ef0030ac0cc7f7';
process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID = '684bd42e0009b1e585e7';
process.env.EXPO_PUBLIC_APPWRITE_SETTLEMENTS_COLLECTION_ID = '684bd8a5003d02f9b84d';
process.env.EXPO_PUBLIC_APPWRITE_AVATAR_BUCKET_ID = '6868f2b90037aaf854c1';

NativeModules.RNGestureHandlerModule = {
    State: {},
    attachGestureHandler: jest.fn(),
    createGestureHandler: jest.fn(),
    dropGestureHandler: jest.fn(),
    updateGestureHandler: jest.fn(),
  };
  jest.mock('react-native-gesture-handler', () => {
    // List all the components you use or that navigation uses internally!
    const mockComponent = (name) => name && (() => null);
  
    return {
      // Components
      PanGestureHandler: mockComponent('PanGestureHandler'),
      TapGestureHandler: mockComponent('TapGestureHandler'),
      LongPressGestureHandler: mockComponent('LongPressGestureHandler'),
      State: {},
      Swipeable: mockComponent('Swipeable'),
      DrawerLayout: mockComponent('DrawerLayout'),
      // Views
      GestureHandlerRootView: ({ children }) => children,
      // HOCs & others
      gestureHandlerRootHOC: jest.fn((c) => c),
      Directions: {},
    };
});
