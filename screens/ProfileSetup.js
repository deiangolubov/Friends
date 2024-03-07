import React , { useState , useEffect } from 'react';
import { View, Text, Button , Image, StyleSheet, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'react-native-image-picker';

import defaultPfp from '../img/defaultpfp-overlay.png'

function ProfileSetup({ navigation }) {
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [isSetUpComplete, setIsSetUpComplete] = useState(false);

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
        ImagePicker.launchImageLibrary({}, async response => {
            console.log(response);
            if (response.assets && response.assets.length > 0) {
                const selectedImage = response.assets[0];
                try {
                    const imageRef = storage().ref(`profile_images/${user.uid}`);
    
                    await imageRef.putFile(selectedImage.uri);
    
                    const imageUrl = await imageRef.getDownloadURL();
    
                    setProfileImage({ uri: imageUrl });
   
                    await firestore().collection('users').doc(user.uid).update({
                        profileImage: imageUrl
                    });
    
                    console.log('Profile image uploaded successfully.');
                } catch (error) {
                    console.error('Error uploading profile image:', error);
                }
            } else {
                console.log('No image selected.');
            }
        });
        
    }

    const handleContinue = async () => {
        if(bio) {
            await firestore().collection('users').doc(user.uid).update({
                bio: bio
            });
        }

        setIsSetUpComplete(true);
        setTimeout(() => {
            navigation.navigate('Home'); 
        }, 2000);
    }

    return (
        <View style={styles.bigcontainer}>
            {isSetUpComplete && (
                <View style={styles.setupContainer}>
                    <Text style={styles.setupText}>You're all set up!</Text>
                </View>
            )} 
            {!isSetUpComplete && (
            <><Text style={styles.loginText}>Setup your profile</Text><View style={styles.formContainer}>
                    <TouchableOpacity onPress={handleImageUpload}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
                        ) : (
                            <Image source={defaultPfp} style={styles.profileImage} />
                        )}
                    </TouchableOpacity>
                    <Text style={styles.label}>Name: {name}</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={text => setBio(text)}
                        value={bio}
                        placeholder="Enter your bio" />
                    <TouchableOpacity style={styles.loginButton} onPress={handleContinue}>
                        <Text style={styles.buttonText}>CONTINUE</Text>
                    </TouchableOpacity>
                </View></>
            )}
        </View>
    );
}
  
  const styles = StyleSheet.create({
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
      backgroundColor: '#B1EEDB',
      padding: 10,
      alignItems: 'center',
      borderRadius: 20,
      borderColor: '#B1EEDB',
      borderWidth: 2,
      top: 200,
      marginTop: 15,
    },
    buttonText: {
      color: 'white',
      fontSize: 15
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 100,
        marginBottom: 20,
    },
    label: {
        color: 'white',
        alignSelf: 'flex-start',
        marginBottom: 5,
        fontSize: 20,
    },
    setupContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    setupText: {
        fontSize: 24,
        color: 'white',
    },
  });

export default ProfileSetup;