import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { account, databases } from "../lib/appwrite";
import { APPWRITE_DATABASE_ID, APPWRITE_USERS_COLLECTION_ID } from '@/env';


type UserContextType = {
  user: any;
  profile: any;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: { username?: string; email?: string; avatar?: string; bio?: string }) => Promise<void>;
  authChecked: boolean;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

type UserProviderProps = { children: ReactNode };

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Fetch profile by document ID (which is userId)
  const fetchProfile = async (userId: string) => {
    try {
      const doc = await databases.getDocument(
        APPWRITE_DATABASE_ID!,
        APPWRITE_USERS_COLLECTION_ID!,
        userId
      );
      setProfile(doc);
      return doc;
    } catch (err) {
      setProfile(null);
      return null;
    }
  };

  async function register(username: string, email: string, password: string) {
    await account.create('unique()', email, password, username);
    await login(email, password);
  }

  async function login(email: string, password: string) {
    await account.createEmailPasswordSession(email, password);
    const authUser = await account.get();
    setUser(authUser);
    await fetchProfile(authUser.$id);
    setAuthChecked(true);
  }

  async function logout() {
    await account.deleteSession("current");
    setUser(null);
    setProfile(null);
    setAuthChecked(false);
    // Optionally: navigate to login page here if needed
  }

  async function updateProfile(updates: { username?: string; email?: string; avatar?: string; bio?: string }) {
    if (!profile) throw new Error('No profile loaded');
    // 1. Update Appwrite Auth email if changed
    if (updates.email && updates.email !== user.email) {
      const password = prompt('Enter your password to confirm email change:');
      if (!password) throw new Error('Password is required to change email');
      await account.updateEmail(updates.email, password);
      const updatedUser = await account.get();
      setUser(updatedUser);
    }
    // 2. Update in custom users collection
    const updated = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_USERS_COLLECTION_ID,
      profile.$id,
      {
        username: updates.username ?? profile.username,
        email: updates.email ?? profile.email,
        bio: updates.bio ?? profile.bio,
        avatar: updates.avatar ?? profile.avatar,
      }
    );
    setProfile(updated);
  }

  // On mount: check for session and fetch profile
  useEffect(() => {
    (async () => {
      try {
        const authUser = await account.get();
        setUser(authUser);
        await fetchProfile(authUser.$id);
      } catch {
        setUser(null);
        setProfile(null);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      profile,
      login,
      register,
      logout,
      updateProfile,
      authChecked
    }}>
      {children}
    </UserContext.Provider>
  );
}
