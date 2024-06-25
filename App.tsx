import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from './screens/login'
import Signup from './screens/signup'
import FP from './screens/ForgottenPassword'
import ProfileSetup from './screens/ProfileSetup'
import Home from './screens/Home'
import Profile from './screens/Profile'
import Search from './screens/Search'
import Chat from './screens/Chat'
import CreateGroup from './screens/CreateGroup'
import GroupProfile from './screens/GroupProfile'
import Comments from './screens/Comments'

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
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Search" component={Search} />
        <Stack.Screen name="Chat" component={Chat} />
        <Stack.Screen name="CreateGroup" component={CreateGroup} />
        <Stack.Screen name="GroupProfile" component={GroupProfile} />
        <Stack.Screen name="Comments" component={Comments} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;