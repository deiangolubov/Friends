import React, { useState , useEffect } from 'react';
import { View, Text, Button, Image, StyleSheet, TextInput, TouchableOpacity, StatusBar, Modal } from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import * as ImagePicker from 'react-native-image-picker';

import homeImg from '../img/home.png'
import searchImg from '../img/searchImg2.png'
import defaultpfp from '../img/defaultpfp.png'
import chat from '../img/chat.png'

function Profile({ navigation }) {
    const [profileImage, setProfileImage] = useState(null);
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(false);

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

    const goToHome = () => {
        navigation.navigate('Home')
    };
  
    const goToSearch = () => {
        navigation.navigate('Search')
    };
  
    const goToProfile = () => {
        navigation.navigate('Profile');
    };

    const goToChat = () => {
        navigation.navigate('Chat')
    };

    const logout = async () => {
        try {
            await auth().signOut();
            navigation.navigate('Login');
        } catch (error) {
            console.log("Log out failed: %s", error);
        }
    }

    const deleteAccount = () => {
        console.log("delete account");
    }

    const changeProfilePic = async () => {
        ImagePicker.launchImageLibrary({}, async response => {
            console.log(response);
            if (response.assets && response.assets.length > 0) {
                const selectedImage = response.assets[0];
                try {
                    const imageRef = storage().ref(`profile_images/${user.uid}`);
    
                    await imageRef.putFile(selectedImage.uri);
    
                    const imageUrl = await imageRef.getDownloadURL();
    
                    setProfileImage(imageUrl);
   
                    await firestore().collection('users').doc(user.uid).update({
                        profileImage: imageUrl
                    });
    
                    console.log('Profile image uploaded successfully.');
                    setForceUpdate(prevState => !prevState);
                    console.log('rerender')
                } catch (error) {
                    console.error('Error uploading profile image:', error);
                }
            } else {
                console.log('No image selected.');
            }
        });
    }

    return (
        <View style={styles.container}>
            <View style={styles.topContainer}>
                <View style={styles.profileHeader}>
                    <View style={styles.profileImageContainer}>
                    <TouchableOpacity  onPress={changeProfilePic}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.topProfileImage} />
                        ) : (
                            <Image source={defaultpfp} style={styles.topProfileImage} />
                        )}
                    </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{name}</Text>
                    <Text style={styles.bio}>{bio}</Text>
                </View>
                <View style={styles.groupsStyles}>
                    <Text>0 groups following</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.iconContainer}>
                    <Text style={styles.moreIcon}>...</Text>
                </TouchableOpacity>
            </View>
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

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <TouchableOpacity style={{ ...styles.modalOption, backgroundColor: "red"}} onPress={logout}>
                            <Text style={styles.modalText}>Logout</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ ...styles.modalOption, backgroundColor: "red"}} onPress={deleteAccount}>
                            <Text style={styles.modalText}>Delete Account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ ...styles.modalOption, backgroundColor: "#2196F3" }}
                            onPress={() => setModalVisible(!modalVisible)}
                        >
                            <Text style={styles.modalText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    moreIcon: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        top: -100,
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },
    modalView: {
        margin: 20,
        backgroundColor: "black",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center",
    },
    modalOption: {
        marginBottom: 10,
        padding: 10,
        width: 200,
        alignItems: "center",
        backgroundColor: "black",
        borderRadius: 10,
    }
});

export default Profile;