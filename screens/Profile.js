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
    const [editBio, setEditBio] = useState(false);
    const [newBio, setNewBio] = useState('');
    const [groupCount, setGroupCount] = useState(0);
    const [groups, setGroups] = useState([]);
    const [groupModal, setGroupModal] = useState(false);

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

            const joinedGroupsSnapshot = await firestore().collection('users').doc(uid).collection('joinedGroups').get();
            const groupPromises = joinedGroupsSnapshot.docs.map(doc => 
                firestore().collection('groups').doc(doc.id).get()
            );

            const groupDocs = await Promise.all(groupPromises);
            const groups = groupDocs.map(groupDoc => ({ id: groupDoc.id, ...groupDoc.data() }));
            setGroups(groups); 
            setGroupCount(joinedGroupsSnapshot.size);
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

    const saveBio = async () => {
        try {
            await firestore().collection('users').doc(user.uid).update({
                bio: newBio
            });
            setBio(newBio); // Update local state with new bio
            setEditBio(false); // Disable bio editing mode
        } catch (error) {
            console.error('Error saving bio:', error);
        }
    }

    const createGroup = () => {
        navigation.navigate('CreateGroup');
    };

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
                    {editBio ? (
                        <View style={styles.bioInputContainer}>
                            <TextInput
                                style={styles.bioInput}
                                value={newBio}
                                onChangeText={text => setNewBio(text)}
                                placeholder="Enter new bio"
                            />
                            <TouchableOpacity onPress={saveBio}>
                                <Text style={styles.saveButton}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={() => setEditBio(true)}>
                            <Text style={styles.bio}>{bio ? bio : "No bio"}</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.groupsStyles}>
                    <TouchableOpacity onPress={() => setGroupModal(true)}>
                        <Text>{groupCount} groups following</Text>
                    </TouchableOpacity>
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
                            onPress={() => {
                                setModalVisible(!modalVisible);
                                createGroup();
                            }}
                        >           
                            <Text style={styles.modalText}>Create group</Text>
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
            <Modal
                animationType="slide"
                transparent={true}
                visible={groupModal}
                onRequestClose={() => {
                    setGroupModal(!groupModal);
                }}
                >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Following Groups</Text>
                        {groups.map(group => (
                            <View key={group.id} style={styles.groupItem}>
                                <Image source={{ uri: group.photoUrl }} style={styles.groupImage} />
                                <Text style={styles.groupName}>{group.name}</Text>
                                <TouchableOpacity 
                                    style={styles.leaveButton} 
                                    onPress={() => leaveGroup(group.id)}
                                >
                                    <Text style={styles.leaveButtonText}>Leave Group</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TouchableOpacity
                            style={{ ...styles.modalOption, backgroundColor: "#2196F3" }}
                            onPress={() => setGroupModal(!groupModal)}
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
    saveButton: {
        marginLeft: 5,
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
    },
});

export default Profile;