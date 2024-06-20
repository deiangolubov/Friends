import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Modal, TextInput, Button } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';
import defaultGroupImage from '../img/defaultpfp.png';

import homeImg from '../img/home.png';
import searchImg from '../img/searchImg2.png';
import chat from '../img/chat.png';
import defaultpfp from '../img/defaultpfp.png';

const screenWidth = Dimensions.get('window').width;

function GroupProfile({ route, navigation }) {
    const { groupId, userId } = route.params;
    const [group, setGroup] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [rightToPost, setRightToPost] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [postImage, setPostImage] = useState(null);

    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                const groupDoc = await firestore().collection('groups').doc(groupId).get();
                if (groupDoc.exists) {
                    setGroup(groupDoc.data());
                }
            } catch (error) {
                console.error('Error fetching group data:', error);
            }
        };

        const fetchProfileImage = async (uid) => {
            try {
                const userDoc = await firestore().collection('users').doc(uid).get();
                const userData = userDoc.data();
                if (userData && userData.profileImage) {
                    setProfileImage(userData.profileImage);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        const checkIfFollowing = async () => {
            try {
                const userJoinedGroups = await firestore()
                    .collection('users')
                    .doc(userId)
                    .collection('joinedGroups')
                    .doc(groupId)
                    .get();

                if (userJoinedGroups.exists) {
                    setIsFollowing(true);
                    setRightToPost(userJoinedGroups.data().rightToPost === 'Yes');
                } else {
                    setIsFollowing(false);
                }
            } catch (error) {
                console.error('Error checking if following group:', error);
            }
        };

        fetchGroupData();
        if (userId) {
            fetchProfileImage(userId);
            checkIfFollowing();
        }
    }, [groupId, userId]);

    const handleFollowToggle = async () => {
        try {
            const groupRef = firestore().collection('groups').doc(groupId);
            const userRef = firestore().collection('users').doc(userId).collection('joinedGroups').doc(groupId);

            await firestore().runTransaction(async (transaction) => {
                const groupDoc = await transaction.get(groupRef);
                const userJoinedGroupDoc = await transaction.get(userRef);

                if (userJoinedGroupDoc.exists) {
                    transaction.delete(userRef);
                    transaction.update(groupRef, { followers: firestore.FieldValue.increment(-1) });
                } else {
                    transaction.set(userRef, { rightToPost: 'No' });
                    transaction.update(groupRef, { followers: firestore.FieldValue.increment(1) });
                }
            });

            setIsFollowing(!isFollowing);
            setGroup((prevGroup) => ({
                ...prevGroup,
                followers: isFollowing ? prevGroup.followers - 1 : prevGroup.followers + 1,
            }));
        } catch (error) {
            console.error('Error toggling follow status:', error);
        }
    };

    const handleCreatePost = async () => {
        if (postContent.trim() === '') return;

        try {
            await firestore().collection('groups').doc(groupId).collection('posts').add({
                content: postContent,
                imageUrl: postImage,
                authorId: userId,
                timestamp: firestore.FieldValue.serverTimestamp(),
            });

            setPostContent('');
            setPostImage(null);
            setIsModalVisible(false);
        } catch (error) {
            console.error('Error creating post:', error);
        }
    };

    const handleImagePick = () => {
        launchImageLibrary({ mediaType: 'photo' }, (response) => {
            if (!response.didCancel && !response.error) {
                setPostImage(response.assets[0].uri);
            }
        });
    };

    if (!group) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    const goToHome = () => {
        navigation.navigate('Home');
    };

    const goToSearch = () => {
        navigation.navigate('Search');
    };

    const goToProfile = () => {
        navigation.navigate('Profile');
    };

    const goToChat = () => {
        navigation.navigate('Chat');
    };

    return (
        <>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Image source={group.profileImage ? { uri: group.profileImage } : defaultGroupImage} style={styles.groupImage} />
                    <View style={styles.groupStats}>
                        <Text style={styles.statsText}>Posts: N/A</Text>
                        <Text style={styles.statsText}>Followers: {group.followers}</Text>
                    </View>
                </View>
                <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {rightToPost && (
                        <TouchableOpacity style={styles.createPostButton} onPress={() => setIsModalVisible(true)}>
                            <Text style={styles.createPostButtonText}>Create Post</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.followButton, isFollowing ? styles.following : styles.notFollowing]}
                    onPress={handleFollowToggle}
                >
                    <Text style={styles.followButtonText}>{isFollowing ? 'Following' : 'Follow'}</Text>
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
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Create Post</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="What's on your mind?"
                            placeholderTextColor="#888"
                            multiline
                            value={postContent}
                            onChangeText={setPostContent}
                        />
                        <Button title="Upload Image" onPress={handleImagePick} color="#B1EEDB" />
                        {postImage && (
                            <Image source={{ uri: postImage }} style={styles.postImagePreview} />
                        )}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setIsModalVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.postButton]} onPress={handleCreatePost}>
                                <Text style={styles.modalButtonText}>Post</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    groupImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginRight: 20,
    },
    groupStats: {
        justifyContent: 'center',
    },
    statsText: {
        color: 'white',
        fontSize: 16,
        marginVertical: 5,
    },
    groupInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    groupName: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    createPostButton: {
        backgroundColor: '#B1EEDB',
        padding: 10,
        borderRadius: 5,
    },
    createPostButtonText: {
        color: 'white',
        fontSize: 16,
    },
    groupDescription: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginVertical: 20,
    },
    followButton: {
        width: screenWidth - 40,
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    following: {
        backgroundColor: 'grey',
    },
    notFollowing: {
        backgroundColor: '#B1EEDB',
    },
    followButtonText: {
        color: 'white',
        fontSize: 16,
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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '80%',
        backgroundColor: 'black',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        borderColor: 'black'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    textInput: {
        width: '100%',
        height: 100,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        textAlignVertical: 'top',
        color: 'black',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: 'red',
    },
    postButton: {
        backgroundColor: '#B1EEDB',
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
    },
    postImagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 5,
        marginTop: 10,
    },
});

export default GroupProfile;