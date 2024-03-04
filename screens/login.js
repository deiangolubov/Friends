import React , { useState } from 'react';
import { View, Text, Button , Image, StyleSheet, TextInput, TouchableOpacity, StatusBar } from 'react-native';

import logo from '../img/logo.png'

function Login({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
  
    const handleLogin = () => {
      // Implement your login logic here
      console.log('Username:', username);
      console.log('Password:', password);
    };
  
    const handleSignUp = () => {
      navigation.navigate('Signup')
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
          <TouchableOpacity onPress={() => navigation.navigate('FP')}>
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