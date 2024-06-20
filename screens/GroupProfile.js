import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import firestore from '@react-native-firebase/firestore';
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
            if (isFollowing) {
                await firestore()
                    .collection('users')
                    .doc(userId)
                    .collection('joinedGroups')
                    .doc(groupId)
                    .delete();
            } else {
                await firestore()
                    .collection('users')
                    .doc(userId)
                    .collection('joinedGroups')
                    .doc(groupId)
                    .set({});
            }
            setIsFollowing(!isFollowing);
        } catch (error) {
            console.error('Error toggling follow status:', error);
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

    return (
        <>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Image source={group.profileImage ? { uri: group.profileImage } : defaultGroupImage} style={styles.groupImage} />
                    <View style={styles.groupStats}>
                        <Text style={styles.statsText}>Posts: N/A</Text>
                        <Text style={styles.statsText}>Followers: N/A</Text>
                    </View>
                </View>
                <Text style={styles.groupName}>{group.name}</Text>
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
    groupName: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'left',
        marginLeft: 20,
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
        backgroundColor: '#2196F3',
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
});

export default GroupProfile;
