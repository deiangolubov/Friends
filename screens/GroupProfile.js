import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Modal, TextInput, Button, FlatList, Switch } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';
import defaultGroupImage from '../img/defaultpfp.png';

import homeImg from '../img/home.png';
import searchImg from '../img/searchImg2.png';
import chat from '../img/chat.png';
import defaultpfp from '../img/defaultpfp.png';

const screenWidth = Dimensions.get('window').width;

function GroupProfile({ route, navigation }) {
    const { groupId, userId, name, openRequestsModal} = route.params;
    const [group, setGroup] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [rightToPost, setRightToPost] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [optionsModal, setOptionsModal] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [postImage, setPostImage] = useState(null);
    const [posts, setPosts] = useState([]);
    const [numberOfPosts, setNumberOfPosts] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState('Requests'); 
    const [isVisible, setIsVisible] = useState(true); 
    const [requestd, setRequested] = useState(false);
    const [isPublic, setIsPublic] = useState(null);
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                const groupDoc = await firestore().collection('groups').doc(groupId).get();
                if (groupDoc.exists) {
                    setGroup(groupDoc.data());
                    setIsAdmin(groupDoc.data().admin === name);
                    setIsPublic(groupDoc.data().public)
                    fetchRequests();
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
                    setRightToPost(false);
                }
            } catch (error) {
                console.error('Error checking if following group:', error);
            }
        };

        const checkIfRequested = async () => {
            try {
                const requestRef = await firestore()
                    .collection('groups')
                    .doc(groupId)
                    .collection('requests')
                    .doc(userId)
                    .get();
        
                if (requestRef.exists) {
                    setRequested(true); 
                } else {
                    setRequested(false);
                }
            } catch (error) {
                console.error('Error checking if requested:', error);
            }
        };

        if (userId) {
            fetchProfileImage(userId);
            checkIfFollowing();
            checkIfRequested();
        }
        fetchGroupData();
        fetchPosts();

        if (openRequestsModal) {
            setOptionsModal(true);
        }

    }, [groupId, userId, name, openRequestsModal]);

    const checkIfLiked = async (postId) => {
        try {
            const postDoc = await firestore().collection('groups').doc(groupId).collection('posts').doc(postId).get();
            const likers = postDoc.data().likers || [];
            return likers.includes(userId);
        } catch (error) {
            console.error('Error checking if post is liked:', error);
            return false;
        }
    };

    const fetchPosts = async () => {
        try {
            const postsSnapshot = await firestore()
                .collection('groups')
                .doc(groupId)
                .collection('posts')
                .orderBy('timestamp', 'desc')
                .get();

            const postsData = await Promise.all(
                postsSnapshot.docs.map(async (postDoc) => {
                    const postData = postDoc.data();
                    const userLikedPost = await checkIfLiked(postDoc.id);
                    return {
                        id: postDoc.id,
                        ...postData,
                        userHasLiked: userLikedPost,
                    };
                })
            );

            setPosts(postsData);
            const no = postsSnapshot.size;
            setNumberOfPosts(no);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const fetchRequests = async () => {
        try {
            const requestsSnapshot = await firestore()
                .collection('groups')
                .doc(groupId)
                .collection('requests')
                .get();
    
            const requestsData = requestsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
    
            setRequests(requestsData);
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    const handleFollowToggle = async () => {
        try {
            const groupRef = firestore().collection('groups').doc(groupId);
            const userRef = firestore().collection('users').doc(userId).collection('joinedGroups').doc(groupId);
            
            const groupDoc = await groupRef.get();
            const adminName = groupDoc.data().admin;
            const adminQuerySnapshot = await firestore().collection('users').where('username', '==', adminName).get();
            const adminDoc = adminQuerySnapshot.docs[0]
            const notificationsRef = adminDoc.ref.collection('notifications');

            if (isPublic) {
                await firestore().runTransaction(async (transaction) => {
                    const groupDoc = await transaction.get(groupRef);
                    const userJoinedGroupDoc = await transaction.get(userRef);
    
                    if (userJoinedGroupDoc.exists) {
                        transaction.delete(userRef);
                        transaction.update(groupRef, { followers: firestore.FieldValue.increment(-1) });
                        setIsFollowing(false);
                    } else {
                        transaction.set(userRef, { rightToPost: 'No' });
                        transaction.update(groupRef, { followers: firestore.FieldValue.increment(1) });
                        setIsFollowing(true); 
                        transaction.set(notificationsRef.doc(), {
                            photoUrl: profileImage || defaultpfp,
                            name: name,
                            group_name: group.name,
                            group_photo: group.profileImage,
                            type: 'followed',
                            timestamp: firestore.FieldValue.serverTimestamp(),
                            viewed: false,
                        });
                    }
                });
    
                setGroup((prevGroup) => ({
                    ...prevGroup,
                    followers: isFollowing ? prevGroup.followers - 1 : prevGroup.followers + 1,
                }));
            } else {
                if (isFollowing) {
                    await firestore().runTransaction(async (transaction) => {
                        const groupDoc = await transaction.get(groupRef);
                        const userJoinedGroupDoc = await transaction.get(userRef);
    
                        if (userJoinedGroupDoc.exists) {
                            transaction.delete(userRef);
                            transaction.update(groupRef, { followers: firestore.FieldValue.increment(-1) });
                            setIsFollowing(false); 
                        }
                    });
                } else {
                    if (requestd) {
                        await groupRef.collection('requests').doc(userId).delete();
                        setRequested(false);
                    } else {
                        await groupRef.collection('requests').doc(userId).set({
                            profileImage: profileImage || defaultpfp,
                            name: name,
                        });
                        setRequested(true);
                        await notificationsRef.add({
                            photoUrl: profileImage || defaultpfp,
                            name: name,
                            group_name: group.name,
                            group_id: groupId,
                            group_photo: group.profileImage,
                            type: 'requested',
                            timestamp: firestore.FieldValue.serverTimestamp(),
                            viewed: false,
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error toggling follow status:', error);
        }
    };

    const handleCreatePost = async () => {
        if (postContent.trim() === '') return;

        try {
            const userDoc = await firestore().collection('users').doc(userId).get();
            const username = userDoc.data().username;

            await firestore().collection('groups').doc(groupId).collection('posts').add({
                content: postContent,
                imageUrl: postImage,
                authorId: username,
                likes: 0,
                likers: [],
                timestamp: firestore.FieldValue.serverTimestamp(),
            });

            setPostContent('');
            setPostImage(null);
            setIsModalVisible(false);
            fetchPosts();
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

    const handleLikeToggle = async (postId, currentLikes, userHasLiked) => {
        try {
            const postRef = firestore().collection('groups').doc(groupId).collection('posts').doc(postId);

            await firestore().runTransaction(async (transaction) => {
                const postDoc = await transaction.get(postRef);
                const postData = postDoc.data();
                const newLikers = userHasLiked
                    ? postData.likers.filter((uid) => uid !== userId)
                    : [...postData.likers, userId];
                const newLikes = newLikers.length;
                transaction.update(postRef, { likes: newLikes, likers: newLikers });

                const authorQuerySnapshot = await firestore().collection('users').where('username', '==', postData.authorId).get();
                const authorDoc = authorQuerySnapshot.docs[0];
                const notificationsRef = authorDoc.ref.collection('notifications');

                if (!userHasLiked) { 
                    const existingNotificationsSnapshot = await notificationsRef
                    .where('name', '==', name)
                    .where('postId', '==', postId)
                    .get();

                    if(existingNotificationsSnapshot.empty){
                        transaction.set(notificationsRef.doc(), {
                            photoUrl: profileImage || defaultpfp,
                            name: name,
                            type: 'liked',
                            postId: postId,
                            group_name: group.name,
                            postImage: postData.imageUrl,
                            timestamp: firestore.FieldValue.serverTimestamp(),
                            viewed: false,
                        })
                    }
                }
            });

            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === postId
                        ? { ...post, likes: userHasLiked ? post.likes - 1 : post.likes + 1, userHasLiked: !userHasLiked }
                        : post
                )
            );
        } catch (error) {
            console.error('Error toggling like status:', error);
        }
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

    const goToComments = (postId) => {
        navigation.navigate('Comments', { postId, groupId, userId });
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const togglePrivate = async () => {
        try {
            await firestore().collection('groups').doc(groupId).update({
                public: !isPublic,
            });
            setIsPublic(!isPublic);
        } catch (error) {
            console.error('Error updating private status:', error);
        }
    };
    
    const toggleVisible = async () => {
        try {
            await firestore().collection('groups').doc(groupId).update({
                visible: !isVisible,
            });
            setIsVisible(!isVisible);
        } catch (error) {
            console.error('Error updating visibility status:', error);
        }
    };


    const renderPost = ({ item }) => {
        return (
            <View style={styles.postContainer}>
                <View style={styles.postHeader}>
                    <Image
                        source={group.profileImage ? { uri: group.profileImage } : defaultGroupImage}
                        style={styles.postGroupImage}
                    />
                    <Text style={styles.postGroupName}>{group.name}</Text>
                    <Text style={styles.postAuthor}>Posted by {item.authorId}</Text>
                </View>
                {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.postImage} />}
                <Text style={styles.postContent}>{item.content}</Text>
                <View style={styles.postFooter}>
                    <TouchableOpacity onPress={() => handleLikeToggle(item.id, item.likes, item.userHasLiked)}>
                        <Image
                            source={item.userHasLiked ? require('../img/heart-filled.png') : require('../img/heart-empty.png')}
                            style={styles.likeIcon}
                        />
                    </TouchableOpacity>
                    <Text style={styles.likeCount}>{item.likes}</Text>
                    <TouchableOpacity onPress={() => goToComments(item.id)}>
                        <Text style={styles.commentButton}>Comments</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderRequestItem = ({ item }) => {
        return (
            <View style={styles.requestItem}>
                <Image
                    source={{ uri: item.profileImage }}
                    style={styles.requestProfileImage}
                />
                <Text style={styles.requestText}>{item.name}</Text>
                <View style={styles.requestButtons}>
                    <TouchableOpacity
                        style={[styles.requestButton, styles.acceptButton]}
                        onPress={() => handleAcceptRequest(item.name, item.id)}
                    >
                        <Text style={styles.requestButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.requestButton, styles.declineButton]}
                        onPress={() => handleDeclineRequest(item.id)}
                    >
                        <Text style={styles.requestButtonText}>Decline</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const handleAcceptRequest = async (username, requestId) => {
        try {
            const groupRef = firestore().collection('groups').doc(groupId);
            const usersRef = firestore().collection('users');
    
            const querySnapshot = await usersRef.where('username', '==', username).get();
    
            const userDoc = querySnapshot.docs[0];
            const userId = userDoc.id;
    
            await usersRef.doc(userId).collection('joinedGroups').doc(groupId).set({
                groupId: groupId,
                rightToPost: 'No'
            });
    
            await groupRef.update({
                followers: firestore.FieldValue.increment(1)
            });
    
            await groupRef.collection('requests').doc(requestId).delete();

            fetchRequests();
        } catch (error) {
            console.error('Error accepting request:', error);
        }
    };

    const handleDeclineRequest = async (requestId) => {
        try {
            await firestore()
                .collection('groups')
                .doc(groupId)
                .collection('requests')
                .doc(requestId)
                .delete();

            fetchRequests();
        } catch (error) {
            console.error('Error declining request:', error);
        }
    };

    return (
        <>
            <View style={styles.container}>
                <FlatList
                    data={!isPublic && !isFollowing ? [] : posts}
                    renderItem={renderPost}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={
                        <>
                            <View style={styles.header}>
                                <Image
                                    source={group.profileImage ? { uri: group.profileImage } : defaultGroupImage}
                                    style={styles.groupImage}
                                />
                                <View style={styles.groupStats}>
                                    <Text style={styles.statsText}>Posts: {numberOfPosts}</Text>
                                    <Text style={styles.statsText}>Followers: {group.followers}</Text>
                                </View>
                            </View>
                            <View style={styles.groupInfo}>
                                <Text style={styles.groupName}>{group.name}</Text>
                                {isFollowing && rightToPost && (
                                    <TouchableOpacity
                                        style={styles.createPostButton}
                                        onPress={() => setIsModalVisible(true)}
                                    >
                                        <Text style={styles.createPostButtonText}>Create Post</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.followButton,
                                    isFollowing ? styles.followingButton : styles.notFollowingButton,
                                    requestd && !isFollowing && { backgroundColor: 'gray' },
                                ]}
                                onPress={handleFollowToggle}
                            >
                                <Text style={styles.followButtonText}>
                                    {requestd ? 'Requested' : isFollowing ? 'Following' : 'Follow'}
                                </Text>
                            </TouchableOpacity>
                            {isAdmin && (
                                <TouchableOpacity
                                    style={styles.ellipsisButton}
                                    onPress={() => setOptionsModal(true)}
                                >
                                    <Text style={styles.ellipsisText}>...</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    }
                    contentContainerStyle={{ paddingBottom: 100 }} 
                    ListEmptyComponent={
                        <Text style={styles.noPostsText}>
                            {!isPublic && !isFollowing ? 'This group is private.' : 'No posts yet.'}
                        </Text>
                    }
                />
                <Modal visible={isModalVisible} animationType="slide">
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Create Post</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="What's on your mind?"
                            value={postContent}
                            onChangeText={setPostContent}
                            multiline
                        />
                        {postImage && (
                            <Image
                                source={{ uri: postImage }}
                                style={styles.postImagePreview}
                            />
                        )}
                        <Button
                            title="Pick Image"
                            onPress={handleImagePick}
                            color="lightgreen"
                        />
                        <Button
                            title="Post"
                            onPress={handleCreatePost}
                            color="lightgreen"
                        />
                        <Button
                            title="Cancel"
                            onPress={() => setIsModalVisible(false)}
                            color="red"
                        />
                    </View>
                </Modal>
                <Modal visible={optionsModal} animationType="slide">
                    <View style={styles.modalContainer}>
                        <View style={styles.tabButtons}>
                            <TouchableOpacity
                                style={[styles.tabButton, activeTab === 'Options' && styles.activeTab]}
                                onPress={() => handleTabChange('Options')}
                            >
                                <Text style={styles.tabText}>Options</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabButton, activeTab === 'Requests' && styles.activeTab]}
                                onPress={() => handleTabChange('Requests')}
                            >
                                <Text style={styles.tabText}>Requests</Text>
                            </TouchableOpacity>
                        </View>
                        {activeTab === 'Options' && (
                            <View style={styles.optionsContainer}>
                                <View style={styles.switchContainer}>
                                    <Text style={styles.switchLabel}>Public:</Text>
                                    <Switch
                                        value={isPublic}
                                        onValueChange={togglePrivate}
                                    />
                                </View>
                                <View style={styles.switchContainer}>
                                    <Text style={styles.switchLabel}>Visible:</Text>
                                    <Switch
                                        value={isVisible}
                                        onValueChange={toggleVisible}
                                    />
                                </View>
                                <Button
                                    style={styles.cancelButton}
                                    title="Go back"
                                    onPress={() => setOptionsModal(false)}
                                    color="lightgreen"
                                />
                            </View>
                        )}
                        {activeTab === 'Requests' && (
                            <View style={styles.requestsContainer}>
                                <Text style={styles.requestsTitle}>Requests to join the group</Text>
                                <FlatList
                                    data={requests}
                                    renderItem={renderRequestItem}
                                    keyExtractor={(item) => item.id}
                                    ListEmptyComponent={<Text style={styles.noRequestsText}>No pending requests</Text>}
                                />
                                <Button
                                    style={styles.cancelButton}
                                    title="Go back"
                                    onPress={() => setOptionsModal(false)}
                                    color="lightgreen"
                                />
                            </View>
                        )}
                    </View>
                </Modal>
            </View>
            <View style={styles.footer}>
                <TouchableOpacity onPress={goToHome}>
                    <Image source={homeImg} style={styles.footerIcon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goToSearch}>
                    <Image source={searchImg} style={styles.footerIcon2} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goToChat}>
                    <Image source={chat} style={styles.footerIcon2} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goToProfile}>
                    <Image
                        source={profileImage ? { uri: profileImage } : defaultpfp}
                        style={styles.footerIcon}
                    />
                </TouchableOpacity>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'black',
    },
    groupImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 16,
    },
    groupStats: {
        justifyContent: 'center',
    },
    statsText: {
        color: 'white',
    },
    groupInfo: {
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'black',
    },
    groupName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    followButton: {
        alignSelf: 'center',
        paddingVertical: 8,
        paddingHorizontal: 22,
        borderRadius: 16,
        marginTop: 16,
    },
    followingButton: {
        backgroundColor: 'gray',
    },
    notFollowingButton: {
        backgroundColor: 'lightgray',
    },
    followButtonText: {
        color: 'black',
    },
    createPostButton: {
        backgroundColor: 'lightgreen',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginTop: 16,
    },
    createPostButtonText: {
        color: 'black',
    },
    postContainer: {
        padding: 16,
        backgroundColor: 'black',
        borderBottomColor: 'gray',
        borderBottomWidth: 1,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    postGroupImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 8,
    },
    postGroupName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    postAuthor: {
        fontSize: 12,
        color: 'gray',
        marginLeft: 'auto',
    },
    postImage: {
        width: '100%',
        height: screenWidth,
        marginBottom: 8,
    },
    postContent: {
        fontSize: 16,
        color: 'white',
    },
    postFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    likeIcon: {
        width: 24,
        height: 24,
    },
    likeCount: {
        color: 'white',
        marginLeft: 8,
        marginRight: 16,
    },
    commentButton: {
        color: 'white',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: 'white',
    },
    modalInput: {
        height: 100,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 16,
        padding: 8,
        textAlignVertical: 'top',
        color: 'white',
    },
    postImagePreview: {
        width: '100%',
        height: screenWidth,
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: 'black',
        borderTopWidth: 1,
        borderTopColor: 'gray',
    },
    footerIcon: {
        width: 35,
        height: 35,
        borderRadius: 20,
    },
    footerIcon2: {
        width: 25,
        height: 25,
    },
    ellipsisButton: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    ellipsisText: {
        fontSize: 24,
        color: 'white',
    },
    tabButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'black',
        zIndex: 1,
    },
    tabButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent', 
    },
    activeTab: {
        borderBottomColor: 'white', 
    },
    tabText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    optionsContainer: {
        backgroundColor: '#1a1a1a', 
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 70,
    },
    switchLabel: {
        color: 'white',
        fontSize: 16,
    },
    switch: {
        transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    },
    cancelButton: {
        backgroundColor: 'red',
        paddingVertical: 12,
        borderRadius: 10,
        width: '100%',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'black',
    },
    noPostsText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
        backgroundColor: 'black',
        padding: 15,
        borderRadius: 10,
    },
    requestsContainer: {
        backgroundColor: '#1a1a1a',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
    },
    requestsTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: 'white',
    },
    noRequestsText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
    },
    requestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    requestProfileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 8,
    },
    requestText: {
        flex: 1,
        color: 'white',
        marginLeft: 8,
    },
    requestButtons: {
        flexDirection: 'row',
    },
    requestButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginLeft: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButton: {
        backgroundColor: 'lightgreen',
    },
    declineButton: {
        backgroundColor: 'red',
    },
    requestButtonText: {
        color: 'black',
    },
});

export default GroupProfile;
