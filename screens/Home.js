import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import homeImg from '../img/currentHome.png';
import searchImg from '../img/searchImg2.png';
import defaultpfp from '../img/defaultpfp.png';
import chat from '../img/chat.png';
import defaultGroupImage from '../img/defaultpfp.png';

const screenWidth = Dimensions.get('window').width;

function Home({ navigation }) {
    const [profileImage, setProfileImage] = useState(null);
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [posts, setPosts] = useState([]);
    const [userId, setuserId] = useState(null);

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(user => {
            setUser(user);
            if (user) {
                fetchUserData(user.uid);
                setuserId(user.uid);
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
                fetchPostsFromFollowedGroups(uid);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchPostsFromFollowedGroups = async (uid) => {
        try {
            const joinedGroupsSnapshot = await firestore().collection('users').doc(uid).collection('joinedGroups').get();
            const groupIds = joinedGroupsSnapshot.docs.map(doc => doc.id);

            const postsData = [];
            for (const groupId of groupIds) {
                const groupDoc = await firestore().collection('groups').doc(groupId).get();
                const groupData = groupDoc.data();

                const groupPostsSnapshot = await firestore().collection('groups').doc(groupId).collection('posts').orderBy('timestamp', 'desc').get();
                groupPostsSnapshot.docs.forEach(doc => {
                    postsData.push({ id: doc.id, ...doc.data(), groupId, groupProfileImage: groupData.profileImage, groupName: groupData.name });
                });
            }

            setPosts(postsData.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()));
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const handleLikeToggle = async (postId, currentLikes, userHasLiked, groupId, userId) => {
        try {
            const postRef = firestore().collection('groups').doc(groupId).collection('posts').doc(postId);
            await firestore().runTransaction(async (transaction) => {
                const postDoc = await transaction.get(postRef);
                const newLikes = userHasLiked ? currentLikes - 1 : currentLikes + 1;
                transaction.update(postRef, { likes: newLikes });

                const userLikedPostRef = firestore().collection('users').doc(userId).collection('likedPosts').doc(postId);
                if (!userHasLiked) {
                    transaction.set(userLikedPostRef, { liked: true });
                } else {
                    transaction.delete(userLikedPostRef);
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

    const renderPost = ({ item }) => {
        return (
            <View style={styles.postContainer}>
                <View style={styles.postHeader}>
                    <Image source={item.groupProfileImage ? { uri: item.groupProfileImage } : defaultGroupImage} style={styles.postGroupImage} />
                    <Text style={styles.postGroupName}>{item.groupName}</Text>
                    <Text style={styles.postAuthor}>Posted by {item.authorId}</Text>
                </View>
                {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.postImage} />}
                <Text style={styles.postContent}>{item.content}</Text>
                <View style={styles.postFooter}>
                    <TouchableOpacity onPress={() => handleLikeToggle(item.id, item.likes, item.userHasLiked, item.groupId, userId)}>
                        <Image
                            source={item.userHasLiked ? require('../img/heart-filled.png') : require('../img/heart-empty.png')}
                            style={styles.likeIcon}
                        />
                    </TouchableOpacity>
                    <Text style={styles.likeCount}>{item.likes}</Text>
                    <TouchableOpacity onPress={() => goToComments(item.id, item.groupId, userId)}>
                        <Text style={styles.commentButton}>Comments</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const goToHome = () => {
        console.log('already on home');
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

    const goToComments = (postId, groupId) => {
        navigation.navigate('Comments', { postId, groupId, userId });
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.postsList}
            />
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
    },
    postsList: {
        padding: 10,
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
    likeIcon: {
        width: 24,
        height: 24,
    },
    postContent: {
        fontSize: 16,
        color: 'white',
    },
    postFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    likeCount: {
        color: 'white',
        marginLeft: 8,
        marginRight: 16,
    },
    commentButton: {
        color: 'white',
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
});

export default Home;