import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TextInput, Button, FlatList, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';

function CommentsScreen({ route, navigation }) {
    const { postId, groupId, userId } = route.params;
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        fetchComments();
    }, [postId, groupId, userId]);

    const fetchComments = async () => {
        try {
            const commentsSnapshot = await firestore()
                .collection('groups')
                .doc(groupId)
                .collection('posts')
                .doc(postId)
                .collection('comments')
                .orderBy('timestamp', 'desc')
                .get();

            const commentsData = commentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setComments(commentsData);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const handleAddComment = async () => {
        if (commentText.trim() === '') return;

        try {
            const userDoc = await firestore().collection('users').doc(userId).get();
            const username = userDoc.data().username;
            const userProfileImage = userDoc.data().profileImage;

            await firestore().collection('groups').doc(groupId).collection('posts').doc(postId).collection('comments').add({
                text: commentText,
                authorId: userId,
                authorName: username,
                authorProfileImage: userProfileImage,
                timestamp: firestore.FieldValue.serverTimestamp(),
            });

            setCommentText('');
            fetchComments();
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const renderComment = ({ item }) => (
        <View style={styles.commentContainer}>
            <Image source={item.authorProfileImage ? { uri: item.authorProfileImage } : require('../img/defaultpfp.png')} style={styles.commentProfileImage} />
            <View style={styles.commentTextContainer}>
                <Text style={styles.commentAuthor}>{item.authorName}</Text>
                <Text style={styles.commentText}>{item.text}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
            <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.commentsList}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Leave a comment..."
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                />
                <Button title="Post" onPress={handleAddComment} color="lightgreen" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: 10,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 18,
    },
    commentsList: {
        padding: 16,
    },
    commentContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    commentProfileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 8,
    },
    commentTextContainer: {
        flex: 1,
    },
    commentAuthor: {
        color: 'white',
        fontWeight: 'bold',
    },
    commentText: {
        color: 'white',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'gray',
    },
    input: {
        flex: 1,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 4,
        padding: 8,
        marginRight: 8,
        color: 'white',
    },
});

export default CommentsScreen;