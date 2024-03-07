import React , { useState } from 'react';
import { View, Text, Button , Image, StyleSheet, TextInput, TouchableOpacity, StatusBar, Alert} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import logo from '../img/logo.png'

function Login({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSignUp = () => {
      
      navigation.navigate('Signup')
    };
  
    const handleLogin = async () => {
      if(username.includes("@")) {
        await auth().signInWithEmailAndPassword(email, password);
        navigation.navigate('Home')
      }
      else {
        const userSnapshot = await firestore()
                .collection('users')
                .where('username', '==', username)
                .get();
        
        console.log(userSnapshot)
        if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data();
                const userEmail = userData.email;
                await auth().signInWithEmailAndPassword(userEmail, password);
                navigation.navigate('Home')
        }
        else {
          Alert.alert('User not found')
        }
      }
    }
  
    return (
      <>
      <View style={styles.bigcontainer}>
      <Image source={logo} style={styles.logo}/>
      <Text style={styles.loginText}>Welcome Back</Text>
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username or Email"
            onChangeText={text => setUsername(text)}
            value={username}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            onChangeText={text => setPassword(text)}
            value={password}
            secureTextEntry={true}
          />
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginButton} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.forgotPasswordText}></Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.forgotPasswordText}></Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.forgotPasswordText}></Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ForgottenPassword')}>
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
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
    forgotPasswordText: {
      color: '#B1EEDB',
      marginTop: 50,
      textAlign: 'center',
      textDecorationLine: 'underline',
    },
  });

export default Login;