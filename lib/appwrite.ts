import { Client, Account, ID, Avatars } from 'react-native-appwrite';


export const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject("683b7b97000aae994ff5")
    .setPlatform('dev.buddies.BudgetBuddy');

export const account = new Account(client)
export const avatars = new Avatars(client)