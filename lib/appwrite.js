import { Client, Account, ID, Avatars, Databases } from 'react-native-appwrite';


export const client = new Client()
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setPlatform('dev.buddies.BudgetBuddy');

export const account = new Account(client)
export const avatars = new Avatars(client)
export const databases = new Databases(client)