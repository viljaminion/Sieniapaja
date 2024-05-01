import React from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';


//Etusivulla ainoastaan sovelluksen kansikuva,
//tehty itse Canva-sovelluksella

export default function HomeScreen() {
    return (
        <ImageBackground
            source={require('./images/Sieniapaja.png')}
            style={styles.background}
            resizeMode="stretch"
        >
            <View style={styles.container}>
                <Text style={styles.text}></Text>
                
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        width: '100%',
        height: '100%'
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
});