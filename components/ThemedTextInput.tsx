import { useColorScheme, TextInput, TextInputProps } from 'react-native'
import React from 'react'
import { Colors } from '../constants/Colors'

const ThemedTextInput = ({ style, ...props }: TextInputProps) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme === "dark" ? "dark" : "light" ] ?? Colors.light
  
    return (
        <TextInput 
            style = {[
                {
                    backgroundColor: theme.uiBackGround,
                    color: theme.text,
                    padding: 20,
                    borderRadius: 6,
                },
                style
            ]}
            {...props}
        />
  )

}

export default ThemedTextInput

