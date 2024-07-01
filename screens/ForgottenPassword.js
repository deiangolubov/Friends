import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TextInput, TouchableOpacity, StatusBar, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import logo from '../img/logo.png';

function ForgottenPassword({ navigation }) {
  const [email, setEmail] = useState('');

  const handleSendEmail = async () => {
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert('An email has been sent to reset your password.');
      setTimeout(() => {
        navigation.navigate('Login'); // Navigate to the login page or any other page
      }, 3000);
    } catch (error) {
      if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid email address.');
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert('No user found with the given email.');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again later.');
      }
    }
  };

  return (
    <View style={styles.bigcontainer}>
      <Image source={logo} style={styles.logo} />
      <Text style={styles.loginText}>Forgotten Password</Text>
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          onChangeText={text => setEmail(text)}
          value={email}
        />
        <TouchableOpacity style={styles.loginButton} onPress={handleSendEmail}>
          <Text style={styles.buttonText}>Send email</Text>
        </TouchableOpacity>
      </View>
    </View>
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

export default ForgottenPassword;