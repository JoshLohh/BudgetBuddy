import { databases } from "@/lib/appwrite";
import React, { createContext, useState, ReactNode } from "react";
import { ID, Permission, Role } from "react-native-appwrite";
import { useUser } from "@/hooks/useUser";

const DATABASE_ID = '684bd404003542c8a2ac'
const COLLECTION_ID = '684bd42e0009b1e585e7'

export interface Group {
    id: string;
    title: string;
    members: string[]
    createdBy: string;
    description?: string;
}


interface CreateGroupInput {
  title: string;
  description?: string;
  // Add more fields as needed
}

interface GroupsContextType {
  groups: Group[];
  fetchGroups: () => Promise<void>;
  fetchGroupsById: (id: string) => Promise<void>;
  createGroup: (data: CreateGroupInput) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
}

export const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

interface GroupsProviderProps {
  children: ReactNode;
}

export function GroupsProvider({ children }: GroupsProviderProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const { user } = useUser()

    async function fetchGroups() {
        try {

        } catch(error) {
            throw Error((error as Error).message)  
        }
    }

    async function fetchGroupsById(id: string) {
        try {

        } catch(error) {
            throw Error((error as Error).message)  
        }
    }

    async function createGroup(data: CreateGroupInput) {
        try {
            if (!user) throw new Error("User not authenticated");

            const docId = ID.unique(); // ✅ use this as documentId

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
                id: res.$id,
                title: res.title,
                description: res.description,
                createdBy: res.createdBy,
                members: res.members,
            };

        } catch(error) {
            throw Error((error as Error).message)  
        }
    }

    async function deleteGroup(id: string) {
        try {

        } catch(error) {
            throw Error((error as Error).message)        
        }
    }

    return (
        <GroupsContext.Provider
        value={{ groups, fetchGroups, fetchGroupsById, createGroup, deleteGroup }}
        >
            {children}
        </GroupsContext.Provider>
    )
}