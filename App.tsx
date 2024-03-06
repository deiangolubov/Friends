import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from './screens/login'
import Signup from './screens/signup'
import FP from './screens/ForgottenPassword'
import ProfileSetup from './screens/ProfileSetup'

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false, 
          //cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="ForgottenPassword" component={FP} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetup} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;