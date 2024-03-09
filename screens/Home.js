import React , { useState, useEffect } from 'react';
import { View, Text, Button , Image, StyleSheet, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import homeImg from '../img/home.png'
import searchImg from '../img/searchImg2.png'
import defaultpfp from '../img/defaultpfp.png'

function Home({ navigation }) {
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [profileImage, setProfileImage] = useState(null);

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
                setProfileImage(userData.profileImage);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };
  
    const reloadPage = () => {
      console.log("page reloaded");
    };

    const goToSearch = () => {
      console.log('go to search'); 
    };

    const goToProfile = () => {
      navigation.navigate("Profile");
    };

    return (
      <View style={styles.container}>
            <View style={styles.bottomNavigation}>
                <TouchableOpacity onPress={reloadPage} style={styles.iconContainer}>
                  <Image source={homeImg} style={styles.iconImage} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goToSearch} style={styles.iconContainer}>
                  <Image source={searchImg} style={styles.searchIconImage} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goToProfile} style={styles.iconContainer}>
                    {profileImage ? (
                        <Image source={{ uri: profileImage }} style={styles.profileImage} />
                    ) : (
                        <Image source={defaultpfp} style={styles.profileImage} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',
      alignItems: 'center',
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
    label: {
      color: 'white',
      fontSize: 20,
      marginTop: 20,
    },
    bottomNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
    },
    iconContainer: {
      alignItems: 'center',
    },
    icon: {
      color: 'white',
      fontSize: 20,
      fontWeight: 'bold',
    },
    iconImage: {
      width: 35,
      height: 35,
    },
    searchIconImage: {
      width: 25,
      height: 25,
    },
    profileImage: {
      width: 30,
      height: 30,
      borderRadius: 20,
    },
  });

export default Home;