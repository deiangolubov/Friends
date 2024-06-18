import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import defaultGroupImage from '../img/defaultpfp.png'; 

function GroupProfile({ route, navigation }) {
    const { groupId } = route.params;
    const [group, setGroup] = useState(null);

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

        fetchGroupData();
    }, [groupId]);

    if (!group) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Image source={group.profileImage ? { uri: group.profileImage } : defaultGroupImage} style={styles.groupImage} />
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupDescription}>{group.description}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
    },
    groupImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    groupName: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 10,
    },
    groupDescription: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        margin: 20,
    },
    backButton: {
        backgroundColor: '#2196F3',
        padding: 10,
        borderRadius: 5,
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
    },
});

export default GroupProfile;