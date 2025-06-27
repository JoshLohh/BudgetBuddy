import { ThemedViewProps } from './ThemedView';
import { Colors } from '@/constants/Colors'
import { useThemeColor } from '@/hooks/useThemeColor';
import { Pressable , StyleSheet, PressableProps} from 'react-native';

type ThemedButtonProps = PressableProps & {
    lightColor?: string;
    darkColor?: string;
    style?: any;
  };

export function ThemedButton({ style, lightColor, darkColor, ...otherprops }: ThemedButtonProps) {

    return (
        <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.pressed,
        style]}
        {...otherprops}
        />

    )
}

const styles = StyleSheet.create({
    btn: {
        backgroundColor: Colors.primary,
        padding: 18,
        borderRadius: 6,
        marginVertical: 10
    },
    pressed: {
        opacity: 0.6
    }
})


