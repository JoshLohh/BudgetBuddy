import { Client, Account, ID, Avatars } from 'react-native-appwrite';


export const client = new Client
    .setProject("6838ad0d003d2a0754a0")
    .setPlatform('dev.Buddies.budgetbuddy');

export const account = new Account(client)
export const avatars = new Avatars(client)