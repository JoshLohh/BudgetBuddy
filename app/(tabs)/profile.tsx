import { Image } from 'expo-image';
import { Platform, StyleSheet, Text } from 'react-native';
import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useUser } from '@/hooks/useUser';
import { ThemedButton } from '@/components/ThemedButton';
import Spacer from '@/components/Spacer';

export default function Profile() {
const { logout, user } = useUser()


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


      <ThemedView style={styles.container}>
        <ThemedText type="title">
          {user.email}
          </ThemedText>
        
        <Spacer height = {10}/>

        <ThemedText>This app includes example code to help you get started.</ThemedText>

        <ThemedButton onPress={ logout }>
          <Text style={{ color: '#f2f2f2' }}> Logout </Text>
        </ThemedButton>
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
  container: {
    flex: 1,
    alignItems:'center',
    justifyContent:'center',
  }
});
