import { useThemeColor } from '@/hooks/useThemeColor';
import { StyleSheet, View , ViewProps, useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors'

const ThemedCard = ({ style, ...props }: ViewProps) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme === "dark" ? "dark" : "light" ] ?? Colors.light
  
    return (
        <View
            style = {[
                {
                    backgroundColor: theme.uiBackGround,
                    padding: 20,
                    borderRadius: 5,
                },
                style
            ]}
            {...props}
        />
  )

}

export default ThemedCard