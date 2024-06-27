import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';

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
    const [refreshing, setRefreshing] = useState(false); 

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
                    id: doc.id,
                    groupId: group.id,
                    groupName: group.name,
                    groupProfileImage: group.profileImage,
                    authorId: doc.data().authorId,
                    postImage: doc.data().imageUrl,
                    content: doc.data().content,
                    likes: doc.data().likes,
                    likers: doc.data().likers,
                    timestamp: doc.data().timestamp.toDate(),
                }));
                return groupPosts;
            });
    
            const allPosts = await Promise.all(postsPromises);
            const flattenedPosts = allPosts.flat();
    
            flattenedPosts.sort((a, b) => b.timestamp - a.timestamp);
    
            setPosts(flattenedPosts);
    
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchUserData(user.uid); 
        setRefreshing(false);
    }, [user]);


    const goToSearch = () => {
        navigation.navigate('Search');
    };

    const goToProfile = () => {
        navigation.navigate('Profile');
    };

    const goToChat = () => {
        navigation.navigate('Chat');
    };

    const handleLikeToggle = async (post) => {
        if (!user) return;

        const postRef = firestore().collection('groups').doc(post.groupId).collection('posts').doc(post.id);
        const postDoc = await postRef.get();
        const postData = postDoc.data();

        if (!postData) return;

        let newLikes = postData.likes;
        let newLikers = [...postData.likers];

        if (newLikers.includes(user.uid)) {
            newLikers = newLikers.filter(uid => uid !== user.uid);
            newLikes -= 1;
        } else {
            newLikers.push(user.uid);
            newLikes += 1;
        }

        await postRef.update({
            likes: newLikes,
            likers: newLikers
        });

        setPosts(posts.map(p => {
            if (p.id === post.id) {
                return {
                    ...p,
                    likes: newLikes,
                    likers: newLikers
                };
            }
            return p;
        }));
    };

    const goToComments = (postId, groupId) => {
        navigation.navigate('Comments', {
            postId,
            groupId,
            userId: user.uid,
        });
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.postsContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['white']} 
                        progressBackgroundColor="black" 
                    />
                }
            >
                {posts.map((post, index) => (
                    <View key={index} style={styles.postContainer}>
                        <View style={styles.postHeader}>
                        <TouchableOpacity onPress={() => navigation.navigate('GroupProfile', { groupId: post.groupId, userId: user.uid })}>
                            <View style={styles.groupInfo}>
                                    <Image source={{ uri: post.groupProfileImage }} style={styles.groupProfileImage} />
                                    <Text style={styles.groupName}>{post.groupName}</Text>
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.postAuthor}>Posted by {post.authorId}</Text>
                        </View>
                        {post.postImage && <Image source={{ uri: post.postImage }} style={styles.postImage} />}
                        <Text style={styles.postContent}>{post.content}</Text>
                        <View style={styles.postFooter}>
                            <TouchableOpacity onPress={() => handleLikeToggle(post)}>
                                <Image
                                    source={post.likers.includes(user?.uid) ? require('../img/heart-filled.png') : require('../img/heart-empty.png')}
                                    style={styles.likeIcon}
                                />
                            </TouchableOpacity>
                            <Text style={styles.likeCount}>{post.likes}</Text>
                            <TouchableOpacity onPress={() => goToComments(post.id, post.groupId)}>
                                <Text style={styles.commentButton}>Comments</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
            <View style={styles.bottomNavigation}>
                <TouchableOpacity onPress={onRefresh} style={styles.iconContainer}>
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
    bottomNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'black',
        borderTopWidth: 1,
        borderTopColor: 'gray',
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
    postsContainer: {
        paddingBottom: 70,
        alignItems: 'center',
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