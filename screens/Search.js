import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import homeImg from '../img/home.png';
import searchImg from '../img/currentSearch.png';
import defaultpfp from '../img/defaultpfp.png';
import chat from '../img/chat.png';

function Search({ navigation }) {
    const [profileImage, setProfileImage] = useState(null);
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

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
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length > 0) {
            try {
                const groupsQuerySnapshot = await firestore()
                    .collection('groups')
                    .where('name', '>=', query)
                    .where('name', '<=', query + '\uf8ff')
                    .get();
                const groups = groupsQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSearchResults(groups);
            } catch (error) {
                console.error('Error searching for groups:', error);
            }
        } else {
            setSearchResults([]);
        }
    };

    const goToHome = () => {
        navigation.navigate('Home');
    };

    const goToSearch = () => {
        console.log('on search already');
    };

    const goToProfile = () => {
        navigation.navigate('Profile');
    };

    const goToChat = () => {
        navigation.navigate('Chat');
    };

    const goToGroupProfile = (group) => {
        navigation.navigate('GroupProfile', { groupId: group.id, userId: user.uid});
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchInput}
                placeholder="Search for groups"
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={handleSearch}
            />
            {searchQuery.length > 0 ? (
                <FlatList
                    data={searchResults}
                    keyExtractor={(item, index) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.groupItem} onPress={() => goToGroupProfile(item)}>
                            <Image
                                source={{ uri: item.profileImage || 'https://via.placeholder.com/150' }}
                                style={styles.groupImage}
                            />
                            <Text style={styles.groupName}>{item.name}</Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.noResultsText}>No groups found</Text>}
                />
            ) : (
                <Text style={styles.searchPrompt}></Text>
            )}
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
    groupItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    groupImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    groupName: {
        color: 'white',
        fontSize: 16,
    },
    noResultsText: {
        color: 'gray',
        marginTop: 20,
    },
    searchPrompt: {
        color: 'gray',
        marginTop: 20,
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
});

export default Search;