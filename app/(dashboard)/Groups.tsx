import { StyleSheet } from 'react-native'

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import  Spacer  from '../../components/Spacer';

const Groups = () => {
    return (
        <ThemedView style = {styles.container} safe = {true} >

            { <Spacer /> }
            <ThemedText style={styles.heading}>
                Your groups
            </ThemedText>

        </ThemedView>
    )
}

export default Groups

const styles = StyleSheet.create({ 
    container: {
        flex: 1,
    //    justifyContent: "center",
        alignItems: "center",
    },

    heading: {
        fontWeight: "bold",
        fontSize: 18,
        textAlign: "center",
    },
})