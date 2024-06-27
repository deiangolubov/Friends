import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TextInput, Dimensions, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import homeImg from '../img/home.png';
import searchImg from '../img/currentSearch.png';
import defaultpfp from '../img/defaultpfp.png';
import chat from '../img/chat.png';

const screenWidth = Dimensions.get('window').width;

function Search({ navigation }) {
    const [profileImage, setProfileImage] = useState(null);
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [posts, setPosts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);
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

    useEffect(() => {
        fetchAllGroups();
        fetchAllPosts();
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

    const fetchAllGroups = async () => {
        try {
            const groupsSnapshot = await firestore().collection('groups').where('visible', '==', true).get();
            const fetchedGroups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGroups(fetchedGroups);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const fetchAllPosts = async () => {
        try {
            const groupsSnapshot = await firestore().collection('groups').where('public', '==', true).get();
            const groups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
            let allPosts = [];
    
            for (const group of groups) {
                const postsSnapshot = await firestore().collection('groups').doc(group.id)
                    .collection('posts')
                    .orderBy('timestamp', 'desc')
                    .get();
                
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
    
                allPosts = [...allPosts, ...groupPosts];
            }
    
            allPosts.sort((a, b) => b.timestamp - a.timestamp);
    
            setPosts(allPosts); 
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
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

    const handleSearch = async (text) => {
        setSearchQuery(text);

        if (text.trim() === '') {
            fetchAllPosts();
            setFilteredGroups([]);
        } else {
            try {
                const groupsSnapshot = await firestore().collection('groups')
                    .where('name', '>=', text.trim())
                    .where('name', '<=', text.trim() + '\uf8ff')
                    .where('visible', '==', true)
                    .get();
                const fetchedGroups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFilteredGroups(fetchedGroups);
            } catch (error) {
                console.error('Error fetching groups:', error);
            }
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchUserData(user.uid);
        setRefreshing(false);
    }, [user]);

    const goToHome = () => {
        navigation.navigate('Home')
    };

    const goToProfile = () => {
        navigation.navigate('Profile');
    };

    const goToChat = () => {
        navigation.navigate('Chat');
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchInput}
                placeholder="Search for groups"
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={(text) => handleSearch(text)}
            />
            {searchQuery.trim() === '' ? (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.postContainer}>
                            <View style={styles.postHeader}>
                            <TouchableOpacity onPress={() => navigation.navigate('GroupProfile', { groupId: item.groupId, userId: user.uid })}>
                                <View style={styles.groupInfo}>
                                    <Image source={{ uri: item.groupProfileImage }} style={styles.groupProfileImage} />
                                    <Text style={styles.groupName}>{item.groupName}</Text>
                                </View>
                            </TouchableOpacity>
                                <Text style={styles.postAuthor}>Posted by {item.authorId}</Text>
                            </View>
                            {item.postImage && <Image source={{ uri: item.postImage }} style={styles.postImage} />}
                            <Text style={styles.postContent}>{item.content}</Text>
                            <View style={styles.postFooter}>
                                <TouchableOpacity onPress={() => handleLikeToggle(item)}>
                                    <Image
                                        source={item.likers.includes(user?.uid) ? require('../img/heart-filled.png') : require('../img/heart-empty.png')}
                                        style={styles.likeIcon}
                                    />
                                </TouchableOpacity>
                                <Text style={styles.likeCount}>{item.likes}</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Comments', { postId: item.id, groupId: item.groupId, userId: user.uid })}>
                                    <Text style={styles.commentButton}>Comments</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.noResultsText}>No posts found</Text>}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['white']}
                            progressBackgroundColor="black"
                        />
                    }
                />
            ) : (
                <FlatList
                    data={filteredGroups}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => navigation.navigate('GroupProfile', { groupId: item.id, userId: user.uid })}>
                            <View style={styles.groupContainer}>
                                <Image source={{ uri: item.profileImage }} style={styles.groupProfileImage} />
                                <Text style={styles.groupName}>{item.name}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.noResultsText}>No groups found</Text>}
                />
            )}
            <View style={styles.bottomNavigation}>
                <TouchableOpacity onPress={goToHome} style={styles.iconContainer}>
                    <Image source={homeImg} style={styles.iconImage} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onRefresh} style={styles.iconContainer}>
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
        paddingTop: 20,
    },
    searchInput: {
        width: '90%',
        height: 40,
        backgroundColor: '#333',
        color: 'white',
        borderRadius: 20,
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    postContainer: {
        marginBottom: 5,
        width: screenWidth,
        padding: 16,
        backgroundColor: 'black',
        borderBottomColor: 'gray',
        borderBottomWidth: 1,
    },
    groupContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        padding: 10,
        backgroundColor: 'black',
        borderBottomColor: 'gray',
        borderBottomWidth: 1,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
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
        width: '100%',
        height: 280,
        borderRadius: 10,
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
    noResultsText: {
        color: 'gray',
        marginTop: 20,
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

export default Search;