import type { PropsWithChildren, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from 'react-native-reanimated';

import { ThemedView } from '@/components/ThemedView';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage?: ReactElement;
  headerBackgroundColor?: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
  children = null,
  headerImage,
  headerBackgroundColor = { dark: '#222', light: '#fff' },
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  const bottom = useBottomTabOverflow();

  // Animate the header image for parallax effect
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
          [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
        ),
      },
      {
        scale: interpolate(
          scrollOffset.value,
          [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
          [2, 1, 1]
        ),
      },
    ],
  }));

  return (
    <ThemedView style={styles.container}>
      {/* Header Image */}
      <View style={[styles.header, { backgroundColor: headerBackgroundColor[colorScheme] }]}>
        {headerImage ? (
          <Animated.View style={[StyleSheet.absoluteFill, headerAnimatedStyle]}>
            {headerImage}
          </Animated.View>
        ) : null}
      </View>
      {/* Content */}
      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {children}
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
    width: '100%',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
    backgroundColor: 'transparent',
  },
});
