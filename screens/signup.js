import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TextInput, TouchableOpacity, StatusBar, Alert} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import logo from '../img/logo.png'

function Signup({ navigation }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
  
  
    const handleLogin = () => {
      navigation.navigate('Login')
    };
  
    const handleSignUp = async () => {
      if (!email.includes('@')) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return;
      }

      if(password.length < 6) {
        Alert.alert('Password must be at least 6 characters.')
        return;
      }

      if(phone.length < 2){ //this is for testing -> for production if(!/^\d{10,}$/.test(phone)) this test that it has 10 only digits
        Alert.alert('Please enter a valid phone number.') 
        return;
      }
      
      try {
        const usernameExists = await firestore()
          .collection('users')
          .where('username', '==', username)
          .get();

        if (!usernameExists.empty) {
          Alert.alert('Username already exists', 'Please choose a different username.');
          return;
        }

        const userCredential = await auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        await firestore().collection('users').doc(user.uid).set({
          username: username,
          email: email,
          phone: phone,
        });
        
        await auth().signInWithEmailAndPassword(email, password);
        navigation.navigate('ProfileSetup')

        console.log('User account created & signed in:', user.uid);
      } catch (error) {
        if(error.code === 'auth/email-already-in-use') {
          Alert.alert('Email already in use', 'Please use a different email address.');
        } else {
          console.error(error);
          Alert.alert('Signup failed', 'An error occurred during signup.');
        }
      }
    }
  
  
    return (
      <>
      <View style={styles.bigcontainer}>
      <Image source={logo} style={styles.logo}/>
      <Text style={styles.loginText}>Sign up</Text>
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            onChangeText={text => setUsername(text)}
            value={username}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            onChangeText={text => setEmail(text)}
            value={email}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            onChangeText={text => setPassword(text)}
            value={password}
            secureTextEntry={true}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            onChangeText={text => setPhone(text)}
            value={phone}
          />
          <TouchableOpacity style={styles.loginButton} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
        </View>
        </View>
      </>
    );
  }
  
  const styles = StyleSheet.create({
    logo: {
      width: '100%', 
      height: 96, 
      resizeMode: 'contain',
      top: 0,
      
    },
    bigcontainer: {
      flex: 1,
      backgroundColor: 'black',
      alignItems: 'center',
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'black',
      paddingTop: StatusBar.currentHeight,
    },
    loginText: {
      fontSize: 36,
      fontWeight: 'bold',
      marginTop: 30,
      color: '#B1EEDB',
      position: 'relative',
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 10,
    },
    formContainer: {
      marginTop: 20,
      width: '80%',
      padding: 30,
      borderWidth: 0,
      borderColor: '#ccc',
      borderRadius: 10,
      backgroundColor: '#000000',
    },
    input: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 10,
      paddingHorizontal: 10,
    },
    loginButton: {
      backgroundColor: '#000000',
      padding: 10,
      alignItems: 'center',
      borderRadius: 20,
      borderColor: '#B1EEDB',
      borderWidth: 2,
      top: 20,
      marginTop: 15,
    },
    buttonText: {
      color: 'white',
    },
  });

export default Signup;