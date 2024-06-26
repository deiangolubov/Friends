import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Modal, TextInput, Button, FlatList } from 'react-native';
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
    const [posts, setPosts] = useState([]);
    const [numberOfPosts, setNumberOfPosts] = useState(0);

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
        fetchPosts();
    }, [groupId, userId]);

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
            const no = postsSnapshot.size
            setNumberOfPosts(no);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

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

    return (
        <>
            <View style={styles.container}>
                <FlatList
                    data={posts}
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
                                {rightToPost && (
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
                                ]}
                                onPress={handleFollowToggle}
                            >
                                <Text style={styles.followButtonText}>
                                    {isFollowing ? 'Following' : 'Follow'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    }
                    contentContainerStyle={{ paddingBottom: 100 }} 
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
        padding: 16,
        backgroundColor: 'black',
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
        width: 30,
        height: 30,
        borderRadius: 20,
    },
    footerIcon2: {
        width: 20,
        height: 20,
    },
});

export default GroupProfile;