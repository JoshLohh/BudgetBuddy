import { databases } from "@/lib/appwrite";
import React, { createContext, useState, ReactNode, useEffect } from "react";
import { ID, Permission, Query, Role } from "react-native-appwrite";
import { useUser } from "@/hooks/useUser";
import type { Group, CreateGroupInput } from '@/types/group';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID ?? '';

export type GroupsContextType = {
  groups: Group[];
  fetchGroups: () => Promise<void>;
  fetchGroupsById: (id: string) => Promise<Group>;
  createGroup: (data: CreateGroupInput) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
};

export const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

interface GroupsProviderProps {
  children: ReactNode;
}

export function GroupsProvider({ children }: GroupsProviderProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const { user } = useUser()

    async function fetchGroups() {
        try {
            const res = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID,
                [
                    Query.contains('members', [user.$id])
                ]
            );

            const parsedGroups: Group[] = res.documents.map((doc) => ({
                $id: doc.$id,
                title: doc.title,
                description: doc.description,
                members: doc.members,
                createdBy: doc.createdBy,
                avatar: doc.avatar,
                }));

            setGroups(parsedGroups)
        } catch(error) {
            console.error('Failed to fetch groups:', error);
            throw Error((error as Error).message)  
        }
    }

    async function fetchGroupsById(id: string) {
        try {
            const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, id);
            return {
            $id: doc.$id,
            title: doc.title,
            description: doc.description,
            members: doc.members,
            createdBy: doc.createdBy,
            };
        } catch (error) {
            console.error('Failed to fetch groups: by Id', error);
            throw Error((error as Error).message);
        }
    }


    async function createGroup(data: CreateGroupInput) {
        try {
             if (!user) return Promise.reject(new Error("User not authenticated"));

            const docId = ID.unique(); // use this as documentId

            const groupData = {
                title: data.title,
                description: data.description ?? "",
                createdBy: user.$id,
                members: [user.$id],
            };

            const res = await databases.createDocument(
                DATABASE_ID,
                COLLECTION_ID,
                docId,
                groupData,
                [
                    Permission.read(Role.user(user.$id)),
                    Permission.update(Role.user(user.$id)),
                    Permission.delete(Role.user(user.$id)),
                ]

            );

            // Add returned group to state, with explicit `id` from `res`
            const newGroup: Group = {
                $id: res.$id,
                title: res.title,
                description: res.description,
                createdBy: res.createdBy,
                members: res.members,
            };

            // Add new group to state
            setGroups((prev) => [...prev, newGroup]);

        } catch(error) {
            throw Error((error as Error).message)  
        }
    }

    async function deleteGroup(id: string) {
        try {
            await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
            setGroups(prev => prev.filter(g => g.$id !== id));
        } catch (error) {
            throw Error((error as Error).message);
        }
    }


    useEffect(() => {

        if (user) {
            fetchGroups()
        } else {
            setGroups([])
        }

    }, [user])

    return (
        <GroupsContext.Provider
        value={{ groups, fetchGroups, fetchGroupsById, createGroup, deleteGroup }}
        >
            {children}
        </GroupsContext.Provider>
    )
}