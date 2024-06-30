import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import homeImg from '../img/home.png';
import searchImg from '../img/searchImg2.png';
import defaultpfp from '../img/defaultpfp.png';
import chat from '../img/currentChat.png';
import hasNotification from '../img/currentChatOn.png'

function Chat({ navigation }) {
    const [profileImage, setProfileImage] = useState(null);
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(user => {
            setUser(user);
            if (user) {
                fetchUserData(user.uid);
                fetchNotifications(user.uid);
            }
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        const unreadNotifications = notifications.some(notification => !notification.viewed);
        setHasUnreadNotifications(unreadNotifications);
    }, [notifications]);

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

    const fetchNotifications = async (uid) => {
        try {
            const notificationsSnapshot = await firestore()
                .collection('users')
                .doc(uid)
                .collection('notifications')
                .orderBy('timestamp', 'desc')
                .get();
            const notificationsData = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            notificationsData.sort((a, b) => {
                if (a.viewed === b.viewed) {
                    return b.timestamp.toDate() - a.timestamp.toDate();
                }
                return a.viewed ? 1 : -1;
            });
            setNotifications(notificationsData);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAllNotificationsViewed = async () => {
        const batch = firestore().batch();
        notifications.forEach(notification => {
            const notificationRef = firestore()
                .collection('users')
                .doc(user.uid)
                .collection('notifications')
                .doc(notification.id);
            batch.update(notificationRef, { viewed: true });
        });

        try {
            await batch.commit();
            fetchNotifications(user.uid); 
        } catch (error) {
            console.error('Error marking notifications as viewed:', error);
        }
    };

    const deleteAllNotifications = async () => {
        const batch = firestore().batch();
        notifications.forEach(notification => {
            const notificationRef = firestore()
                .collection('users')
                .doc(user.uid)
                .collection('notifications')
                .doc(notification.id);
            batch.delete(notificationRef);
        });

        try {
            await batch.commit();
            setNotifications([]);
        } catch (error) {
            console.error('Error deleting notifications:', error);
        }
    };

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
        console.log("on chat already");
    };

    const handleNotificationPress = async (notification) => {
        if (notification.type === 'commented') {
            navigation.navigate('Comments', { postId: notification.postId, groupId: notification.group_name, userId: user.uid });
        } else if (notification.type === 'requested') {
            navigation.navigate('GroupProfile', { groupId: notification.group_id, userId: user.uid, name: name, openRequestsModal: true});
        }

        await firestore()
            .collection('users')
            .doc(user.uid)
            .collection('notifications')
            .doc(notification.id)
            .update({ viewed: true });

        fetchNotifications(user.uid);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Notifications</Text>
            <View style={styles.buttonsContainer}>
                <TouchableOpacity onPress={markAllNotificationsViewed} style={[styles.button, styles.viewAllButton]}>
                    <Text style={styles.buttonText}>View all</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={deleteAllNotifications} style={[styles.button, styles.deleteAllButton]}>
                    <Text style={styles.buttonText}>Delete all</Text>
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.notificationsContainer}>
                {notifications.map((notification) => (
                    <TouchableOpacity
                         key={notification.id} 
                         style={[
                            styles.notification,
                            { backgroundColor: notification.viewed ? '#111' : '#555' } 
                        ]} 
                         onPress={() => handleNotificationPress(notification)}
                    >
                        <Image 
                            source={{ uri: notification.photoUrl || defaultpfp }} 
                            style={styles.notificationProfileImage} 
                        />
                        <View style={styles.notificationTextContainer}>
                            <Text style={styles.notificationName}>{notification.name}</Text>
                            <Text style={styles.notificationText}>
                                {notification.type === 'liked' && 'has liked your post'}
                                {notification.type === 'commented' && 'has commented on your post'}
                                {notification.type === 'requested' && `has requested to follow your group ${notification.group_name}`}
                                {notification.type === 'followed' && `has joined your group ${notification.group_name}`}
                            </Text>
                        </View>
                        {(notification.type === 'liked' || notification.type === 'commented') && (
                            <Image 
                                source={{ uri: notification.postImage }} 
                                style={styles.postImage} 
                            />
                        )}
                        {(notification.type === 'requested' || notification.type === 'followed' ) && (
                            <Image 
                                source={{ uri: notification.group_photo }} 
                                style={styles.postImage} 
                            />
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <View style={styles.bottomNavigation}>
                <TouchableOpacity onPress={goToHome} style={styles.iconContainer}>
                    <Image source={homeImg} style={styles.iconImage} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goToSearch} style={styles.iconContainer}>
                    <Image source={searchImg} style={styles.searchIconImage} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goToChat} style={styles.iconContainer}>
                    <Image source={hasUnreadNotifications ? hasNotification : chat} style={styles.searchIconImage} />
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
    title: {
        color: 'white',
        fontSize: 24,
        marginVertical: 20,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 10,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'white',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
    viewAllButton: {
        backgroundColor: 'lightgreen',
    },
    deleteAllButton: {
        backgroundColor: '#DC3545',
    },
    notificationsContainer: {
        width: '100%',
        paddingHorizontal: 20,
        marginBottom: 100,
    },
    notification: {
        backgroundColor: '#333',
        padding: 15,
        borderRadius: 5,
        marginVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationProfileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    notificationTextContainer: {
        flex: 1,
    },
    notificationName: {
        color: 'white',
        fontWeight: 'bold',
    },
    notificationText: {
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
    groupsStyles: {
        marginLeft: 50,
        top: -20,
    },
    postImage: {
        width: 40,
        height: 40,
        borderRadius: 5,
    },
});

export default Chat;