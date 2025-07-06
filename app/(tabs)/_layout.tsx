import { Tabs } from 'expo-router';
import UserOnly from '@/components/auth/UserOnly';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <UserOnly>  
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        {/* <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        /> */}
        <Tabs.Screen
          name="group/groups"
          options={{
            title: 'Groups',
            tabBarIcon: ({ color }) => <IconSymbol size={38} name="person.3.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="group/create"
          options={{
            title: 'Create',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.square.fill.on.square.fill" color={color} />,
          }}
        />        
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          }}
        />

        <Tabs.Screen
          name="group/[groupId]"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="group/expenseList"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="group/[groupId]/addExpense"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="group/membersDropdown"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="group/settlementList"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="groups"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="home"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="settings"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="group/[groupId]/history"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="group/[groupId]/expense/[expenseId]"
          options={{ href: null }}
        />

        <Tabs.Screen
          name="user/[userId]"
          options={{ href: null }}
        />
      </Tabs>
    </UserOnly>  
  );
}
