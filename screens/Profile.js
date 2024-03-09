import React, { useState , useEffect } from 'react';
import { View, Text, Button, Image, StyleSheet, TextInput, TouchableOpacity, StatusBar} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import homeImg from '../img/home.png'
import searchImg from '../img/searchImg2.png'
import defaultpfp from '../img/defaultpfp.png'

function Profile({ navigation }) {
    const [profileImage, setProfileImage] = useState(null);
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('')

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
                setBio(userData.bio);
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

    const editProfile = () => {
        console.log("edit profile");
    }

    return (
        <View style={styles.container}>
            <View style={styles.topContainer}>
            <View style={styles.profileHeader}>
                <View style={styles.profileImageContainer}>
                    {profileImage ? (
                        <Image source={{ uri: profileImage }} style={styles.topProfileImage} />
                    ) : (
                        <Image source={defaultpfp} style={styles.topProfileImage} />
                    )}
                </View>
                <Text style={styles.userName}>{name}</Text>
                <Text style={styles.bio}>{bio}</Text>
            </View>
            <View style={styles.groupsStyles}>
                <Text>0 groups following</Text>
            </View>
            </View>
            <View style={styles.editContainer}>
                <TouchableOpacity onPress={editProfile} style={styles.editProfile}>
                  <Text style={styles.editButton}>Edit profile</Text>
                </TouchableOpacity>
            </View>
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
    topContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -450,
        marginLeft: 20,
    },
    profileHeader: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    profileImageContainer: {
        marginBottom: 10,
    },
    topProfileImage: {
        width: 90,
        height: 90,
        borderRadius: 60,
    },
    userName: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
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
    groupsStyles: {
        marginLeft: 50,
        top: -20,
    },
    editProfile: {
        top: -450,
        width: '80%',
        borderWidth: 1,
        borderColor: 'white',
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 5,
    },
    editContainer: {
        width: '125%',
        alignItems: 'center',
    },
    editButton: {
        fontSize: 17,
        fontWeight: 'bold',
    },
});

export default Profile;