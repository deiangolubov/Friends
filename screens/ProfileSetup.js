import React , { useState , useEffect } from 'react';
import { View, Text, Button , Image, StyleSheet, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import defaultPfp from '../img/defaultpfp.png'

function ProfileSetup({ navigation }) {
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(user => {
            setUser(user);
            if (user) {
                fetchUserData(user.uid);
            }
        });

        return unsubscribe;
    }, []);

    const fetchUserData = async (uid) => {
        try {
            const userDoc = await firestore().collection('users').doc(uid).get();
            const userData = userDoc.data();
            if (userData) {
                setName(userData.username);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const handleImageUpload = () => {
        console.log("image upload")
    };

    return (
      <>
      <View style={styles.bigcontainer}>
      <Text style={styles.loginText}>Setup your profile</Text>
        <View style={styles.formContainer}>
        <TouchableOpacity onPress={handleImageUpload}>
            <Image source={defaultPfp} style={styles.profileImage} />
        </TouchableOpacity>
        <Text style={styles.label}>Name: {name}</Text>
        <TextInput
            style={styles.input}
            onChangeText={text => setBio(text)}
            value={bio}
            placeholder="Enter your bio"/>
        </View>
        </View>
      </>
    );
  }
  
  const styles = StyleSheet.create({
    logo: {
      width: '100%', 
      height: 96, 
      resizeMode: 'contain',
      top: 0,
      
    },
    bigcontainer: {
      flex: 1,
      backgroundColor: 'black',
      alignItems: 'center',
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'black',
      paddingTop: StatusBar.currentHeight,
    },
    loginText: {
      fontSize: 36,
      fontWeight: 'bold',
      marginTop: 30,
      color: '#B1EEDB',
      position: 'relative',
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 10,
    },
    formContainer: {
      marginTop: 20,
      width: '80%',
      padding: 30,
      borderWidth: 0,
      borderColor: '#ccc',
      borderRadius: 10,
      backgroundColor: '#000000',
      alignItems: 'center'
    },
    input: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
        width: '100%',
        marginTop: 50,
        fontSize: 15,
    },
    loginButton: {
      backgroundColor: '#000000',
      padding: 10,
      alignItems: 'center',
      borderRadius: 20,
      borderColor: '#B1EEDB',
      borderWidth: 2,
      top: 20,
      marginTop: 15,
    },
    buttonText: {
      color: 'white',
    },
    forgotPasswordText: {
      color: '#B1EEDB',
      marginTop: 50,
      textAlign: 'center',
      textDecorationLine: 'underline',
    },
    profileImage: {
        width: 140,
        height: 140,
        borderRadius: 100,
        marginBottom: 20,
    },
    label: {
        color: 'white',
        alignSelf: 'flex-start',
        marginBottom: 5,
        fontSize: 20,
    },
  });

export default ProfileSetup;