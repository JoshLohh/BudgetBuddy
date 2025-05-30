import { Colors } from "@/constants/Colors";
import { Tabs } from "expo-router";
import React from "react";
import { StatusBar, useColorScheme } from "react-native";
import { Ionicons } from '@expo/vector-icons'; 

export default function DashBoardLayout() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme === "dark" ? "dark" : "light" ] ?? Colors.light

    return (
        <Tabs 
            screenOptions={{ 
                headerShown: false, 
                tabBarStyle: {
                    backgroundColor: theme.navBackground,
                    paddingTop: 10,
                    height: 90,
            },
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
     }}>

         <Tabs.Screen 
        name="CreateGroup" options={{ title: 'Create Group', tabBarIcon: ({ focused }) => (
            <Ionicons 
            size={24}
            name={focused ? 'create' : 'create-outline'}
            color={focused ? theme.tabIconSelected : theme.tabIconDefault}
        />
        ) }}

        /> 
        <Tabs.Screen 
        name="Groups" options={{ title: 'Groups', tabBarIcon: ({ focused }) => (
            <Ionicons 
            size={24}
            name={focused ? 'people' : 'people-outline'}
            color={focused ? theme.tabIconSelected : theme.tabIconDefault}
        />
        ) }}
        />
        <Tabs.Screen 
        name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => (
            <Ionicons 
                size={24}
                name={focused ? 'person' : 'person-outline'}
                color={focused ? theme.tabIconSelected : theme.tabIconDefault}
            />
        ) }}
        />

        </Tabs>
    )
}