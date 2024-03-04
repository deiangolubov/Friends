import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, TextInput, TouchableOpacity, StatusBar, Alert} from 'react-native';
import auth from '@react-native-firebase/auth';
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
      auth()
      .createUserWithEmailAndPassword(email, password)
      .then(() => {
        console.log('User account created & signed in!');
      })
      .catch(error => {
        console.error(error);
      });
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