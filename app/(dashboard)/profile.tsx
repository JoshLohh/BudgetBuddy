import { StyleSheet } from 'react-native'

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import  Spacer  from '../../components/Spacer';

const Profile = () => {
    return ( 
        <ThemedView style={styles.container}>

            <ThemedText type = "title" style = {styles.heading}>
                Your Email
            </ThemedText>
            <Spacer />

            <ThemedText type = "subtitle" style={ {fontSize:15}}>
                Enjoy the app!
            </ThemedText>


        </ThemedView>
    )
}

export default Profile

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