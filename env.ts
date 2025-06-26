// env.ts
import Constants from 'expo-constants';

type Env = {
  APPWRITE_DATABASE_ID: string;
  APPWRITE_USERS_COLLECTION_ID: string;
};

const extra = Constants.expoConfig?.extra as Env | undefined;

if (!extra?.APPWRITE_DATABASE_ID || !extra?.APPWRITE_USERS_COLLECTION_ID) {
  throw new Error('Missing Appwrite environment variables in app.config.js/app.json');
}

export const APPWRITE_DATABASE_ID = extra.APPWRITE_DATABASE_ID;
export const APPWRITE_USERS_COLLECTION_ID = extra.APPWRITE_USERS_COLLECTION_ID;
