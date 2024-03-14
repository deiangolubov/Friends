import React, { useState , useEffect } from 'react';
import { View, Text, Button, Image, StyleSheet, TextInput, TouchableOpacity, StatusBar, Modal } from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import homeImg from '../img/currentHome.png'
import searchImg from '../img/searchImg2.png'
import defaultpfp from '../img/defaultpfp.png'
import chat from '../img/chat.png'

function Home({ navigation }) {
    const [profileImage, setProfileImage] = useState(null);
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [joinedGroups, setJoinedGroups] = useState([]);

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(user => {
            setUser(user);
            if (user) {
                fetchUserData(user.uid);
                checkJoinedGroups(user.uid);
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
    
    const checkJoinedGroups = async (uid) => {
        try {
            const querySnapshot = await firestore().collection(`users/${uid}/joinedGroups`).get();
            const groups = [];
            querySnapshot.forEach(doc => {
                groups.push(doc.data());
            });
            setJoinedGroups(groups);
        } catch (error) {
            console.error('Error checking joined groups:', error);
        }
    };

    const goToHome = () => {
        console.log('already on home')
    };
  
    const goToSearch = () => {
        navigation.navigate('Search')
    };
  
    const goToProfile = () => {
        navigation.navigate("Profile");
    };

    const goToChat = () => {
        navigation.navigate('Chat');
    };

    const joinGroup = () => {
        console.log('Join a group');
    };

    const createGroup = () => {
        navigation.navigate('CreateGroup');
    };

    return (
        <View style={styles.container}>
            {joinedGroups.length === 0 && (
                <View style={styles.messageContainer}>
                    <Text style={styles.noGroupText}>You are not part of any group.</Text>
                    <TouchableOpacity onPress={joinGroup}>
                        <Text style={styles.linkText}>Join a group</Text>
                    </TouchableOpacity>
                    <Text style={styles.noGroupText}> or </Text>
                    <TouchableOpacity onPress={createGroup}>
                        <Text style={styles.linkText}>Create a new group</Text>
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.bottomNavigation}>
                <TouchableOpacity onPress={goToHome} style={styles.iconContainer}>
                    <Image source={homeImg} style={styles.iconImage} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goToSearch} style={styles.iconContainer}>
                    <Image source={searchImg} style={styles.searchIconImage} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goToChat} style={styles.iconContainer}>
                    <Image source={chat} style={styles.searchIconImage} />
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
    noGroupText: {
        color: 'white',
        marginBottom: 10,
        textAlign: 'center',
        marginTop: 10,
    },
    messageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    linkText: {
        color: '#B1EEDB',
        marginTop: 5,
    },
});

export default Home;