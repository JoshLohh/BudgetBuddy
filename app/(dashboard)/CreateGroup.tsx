import { StyleSheet } from 'react-native'

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import  Spacer  from '../../components/Spacer';

const CreateGroup = () => {
    return (
        <ThemedView style = {styles.container}>

            <ThemedText type = "title" style={styles.heading}>
                Create a new group
            </ThemedText>

            <Spacer />
        </ThemedView>
    )
}

export default CreateGroup 

const styles = StyleSheet.create({ 
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    heading: {
        fontWeight: "bold",
        fontSize: 18,
        textAlign: "center",
    },
})