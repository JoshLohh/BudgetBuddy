import React, { createContext, ReactNode, useState } from 'react'
import { account } from "../lib/appwrite"
import { ID } from "react-native-appwrite"
import { Models } from 'react-native-appwrite';

type UserContextType = {
    user: any; // Replace 'any' with your user type if you have one
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
  };

export const UserContext = createContext<UserContextType | undefined>(undefined)

type UserProviderProps = {
  children: ReactNode;
};


export function UserProvider({ children } : UserProviderProps) {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)

    async function login(email: string, password: string) {
      try{
        await account.createEmailPasswordSession(email, password)
        const response = await account.get()
        setUser(response)
      } catch (error) {
        console.log((error as Error).message)
      }
    }

    async function register(email: string, password: string) {
        try{
          await account.create(ID.unique(), email, password)
          await login(email, password)
        } catch (error) {
          console.log((error as Error).message)
        }
    }

    async function logout() {
        
    }

    return (
        <UserContext.Provider value={{ user, login, register, logout }}>
            {children}
        </UserContext.Provider>
    )
}