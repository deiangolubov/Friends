import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet,Dimensions, TouchableOpacity } from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import homeImg from '../img/currentHome.png';
import searchImg from '../img/searchImg2.png';
import defaultpfp from '../img/defaultpfp.png';
import chat from '../img/chat.png';

const screenWidth = Dimensions.get('window').width;

function Home({ navigation }) {
    const [profileImage, setProfileImage] = useState(null);
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [groupCount, setGroupCount] = useState(0);
    const [userGroupsInfo, setUserGroupsInfo] = useState([]);
    const [posts, setPosts] = useState([]);

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

            const joinedGroupsSnapshot = await firestore().collection('users').doc(uid).collection('joinedGroups').get();
            const groups = joinedGroupsSnapshot.docs.map(doc => doc.id);

            const groupsPromises = groups.map(async (groupId) => {
                const groupDoc = await firestore().collection('groups').doc(groupId).get();
                return { id: groupId, ...groupDoc.data() };
            });

            const groupsData = await Promise.all(groupsPromises);
            setUserGroupsInfo(groupsData);
            setGroupCount(groupsData.length);

            const postsPromises = groupsData.map(async (group) => {
                const postsSnapshot = await firestore().collection('groups').doc(group.id).collection('posts').get();
                const groupPosts = postsSnapshot.docs.map(doc => ({
                    groupId: group.id,
                    groupName: group.name,
                    groupProfileImage: group.profileImage,
                    authorId: doc.data().authorId,
                    postImage: doc.data().imageUrl,
                    content: doc.data().content,
                    likes: doc.data().likes,
                    likers: doc.data().likers,
                }));
                return groupPosts;
            });

            const allPosts = await Promise.all(postsPromises);
            const flattenedPosts = allPosts.flat();
            setPosts(flattenedPosts);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
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

    const handleLikeToggle = () => {
        console.log("?");
    }

    const goToComments = () => {
        console.log("?");
    }

    return (
        <View style={styles.container}>
            <View style={styles.postsContainer}>
                {posts.map((post, index) => (
                    <View key={index} style={styles.postContainer}>
                        <View style={styles.postHeader}>
                            <View style={styles.groupInfo}>
                                <Image source={{ uri: post.groupProfileImage }} style={styles.groupProfileImage} />
                                <Text style={styles.groupName}>{post.groupName}</Text>
                            </View>
                            <Text style={styles.postAuthor}>Posted by {post.authorId}</Text>
                        </View>
                        {post.postImage && <Image source={{ uri: post.postImage }} style={styles.postImage} />}
                        <Text style={styles.postContent}>{post.content}</Text>
                        <View style={styles.postFooter}>
                        <TouchableOpacity onPress={() => handleLikeToggle(post.groupId, post.likes, /*item.userHasLiked*/)}>
                            <Image
                                source={/*item.userHasLiked*/1 ? require('../img/heart-filled.png') : require('../img/heart-empty.png')}
                                style={styles.likeIcon}
                            />
                        </TouchableOpacity>
                        <Text style={styles.likeCount}>{post.likes}</Text>
                            <TouchableOpacity onPress={() => goToComments(post.groupId)}>
                                <Text style={styles.commentButton}>Comments</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
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
    postFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    likeIcon: {
        width: 24,
        height: 24,
        top: 10,
    },
    likeCount: {
        color: 'white',
        marginLeft: 8,
        marginRight: 16,
        top: 7,
    },
    commentButton: {
        color: 'white',
        top: 7,
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
    postContainer: {
        marginBottom: 20,
        width: screenWidth,
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
    postContent: {
        top: 10,
        fontSize: 16,
        color: 'white',
    },
    groupInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    groupProfileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 8,
    },
    groupName: {
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
        top: 10,
        width: '100%',
        height: 280,
        borderRadius: 10,
    },
});

export default Home;