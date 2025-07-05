import React, { useCallback, useEffect } from 'react';
import { useGroups } from '@/hooks/useGroups';
import { useUser } from '@/hooks/useUser';
import { useState } from 'react';
import { ThemedButton } from '@/components/ThemedButton';
import { ActivityIndicator, FlatList, TouchableOpacity, StyleSheet, Pressable, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Spacer from '@/components/Spacer';
import ThemedCard from '@/components/ThemedCard';
import { Colors } from '@/constants/Colors';

export default function GroupsScreen() {
  const { groups, fetchGroups } = useGroups();
  const { user } = useUser();
  const router = useRouter();
  const[loading, setLoading] = useState(false)

  useEffect(() => {
    fetchGroups();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView>
      <ThemedText type="title" >My Groups</ThemedText>

      <FlatList
        scrollEnabled = {false}
        data={groups}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress = {() => router.push(`/group/${item.id}`)}
            >
            <ThemedCard style={styles.card}>
              <ThemedText type="subtitle">{item.title}</ThemedText>
              <ThemedText>{item.description}</ThemedText>
            </ThemedCard>
          </Pressable>
        )}
        ListEmptyComponent={<ThemedText type='subtitle' style={{textAlign: 'center'}}>No groups found. Create one!</ThemedText>}
      />
      <View style={{ alignItems: 'center'}}>
      <ThemedButton 
        onPress={() => router.push('/group/create')} 
        style={styles.createBtn}
      >
        <ThemedText style={{ color: '#f2f2f2' , textAlign: 'center'}}>Create Group</ThemedText>
      </ThemedButton>
      </View>
    </ThemedView>
 
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  list: {
    marginTop: 40
  },
  createBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
    width:'50%',
  },
  card: {
    width: "90%",
    marginHorizontal: "5%",
    marginVertical: 10,
    padding: 10,
    paddingLeft: 14,
    borderLeftColor: Colors.primary,
    borderLeftWidth: 4
  }
});
