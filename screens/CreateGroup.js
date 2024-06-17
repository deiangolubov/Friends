import React , { useState , useEffect } from 'react';
import { View, Text, Button , Image, StyleSheet, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'react-native-image-picker';

import defaultPfp from '../img/defaultpfp.png'

function CreateGroup({ navigation }) {
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [isSetUpComplete, setIsSetUpComplete] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setDescription] = useState('');
    const [groupId, setGroupId] = useState('');

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

    useEffect(() => {
        setGroupId(generateGroupId());
    }, []);

    const generateGroupId = () => {
        return Math.random().toString(36).substring(7);
    };

    const handleImageUpload = () => {
        ImagePicker.launchImageLibrary({}, async response => {
            if (response.assets && response.assets.length > 0) {
                const selectedImage = response.assets[0];
                try {
                    const imageRef = storage().ref(`group_profile_images/${groupId}`);
    
                    await imageRef.putFile(selectedImage.uri);
    
                    const imageUrl = await imageRef.getDownloadURL();
    
                    setProfileImage({ uri: imageUrl });
    
                    await firestore().collection('groups').doc(groupId).update({
                        profileImage: imageUrl,
                    });
    
                    console.log('Group profile image uploaded successfully.');
                } catch (error) {
                    console.error('Error uploading group profile image:', error);
                }
            } else {
                console.log('No image selected.');
            }
        });
    }

    const handleContinue = async () => {
        try {
            await firestore().collection('groups').doc(groupId).set({
                name: groupName,
                description: groupDescription,
                profileImage: profileImage.uri, 
                admin: name, 
            });
    
            await firestore().collection('users').doc(user.uid).collection('joinedGroups').doc(groupId).set({
                groupId: groupId,
            });
    
            setIsSetUpComplete(true);
            setTimeout(() => {
                navigation.navigate('Home');
            }, 2000);
        } catch (error) {
            console.error('Error creating group:', error);
        }
    }

    const handleCancel = async () => {
        navigation.navigate('Profile')
    }

    return (
        <View style={styles.bigcontainer}>
            {isSetUpComplete && (
                <View style={styles.setupContainer}>
                    <Text style={styles.setupText}>The group was created!</Text>
                </View>
            )} 
            {!isSetUpComplete && (
            <><Text style={styles.loginText}>Create a group</Text><View style={styles.formContainer}>
                    <TouchableOpacity onPress={handleImageUpload}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
                        ) : (
                            <Image source={defaultPfp} style={styles.profileImage} />
                        )}
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        onChangeText={text => setGroupName(text)}
                        value={groupName}
                        placeholder="Group name" />
                    <TextInput
                        style={styles.input}
                        onChangeText={text => setDescription(text)}
                        value={groupDescription}
                        placeholder="Group description" />
                    <TouchableOpacity style={styles.loginButton} onPress={handleContinue}>
                        <Text style={styles.buttonText}>CONTINUE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.loginButton} onPress={handleCancel}>
                        <Text style={styles.buttonText}>   CANCEL  </Text>
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
        marginBottom: 5,
        paddingHorizontal: 10,
        width: '100%',
        marginTop: 20,
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

export default CreateGroup;