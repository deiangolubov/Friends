import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import homeImg from '../img/currentHome.png';
import searchImg from '../img/searchImg2.png';
import defaultpfp from '../img/defaultpfp.png';
import chat from '../img/chat.png';

function Home({ navigation }) {
    const [profileImage, setProfileImage] = useState(null);
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
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
                const groupPostsSnapshot = await firestore().collection('groups').doc(groupId).collection('posts').orderBy('timestamp', 'desc').get();
                groupPostsSnapshot.docs.forEach(doc => {
                    postsData.push({ id: doc.id, ...doc.data() });
                });
            }

            setPosts(postsData.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()));
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const renderPost = ({ item }) => {
        return (
            <View style={styles.postContainer}>
                <Text style={styles.postAuthor}>{item.authorId}</Text>
                {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.postImage} />}
                <Text style={styles.postContent}>{item.content}</Text>
                <View style={styles.postFooter}>
                    <Text style={styles.likeCount}>Likes: {item.likes}</Text>
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
        backgroundColor: '#333',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    postAuthor: {
        color: 'white',
        fontWeight: 'bold',
    },
    postImage: {
        width: '100%',
        height: 200,
        marginTop: 10,
    },
    postContent: {
        color: 'white',
        marginTop: 10,
    },
    postFooter: {
        marginTop: 10,
    },
    likeCount: {
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