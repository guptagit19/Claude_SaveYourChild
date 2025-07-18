// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AppSelectionScreen from '../screens/AppSelectionScreen';
import TimePickerScreen from '../screens/TimePickerScreen';
import ActiveSessionScreen from '../screens/ActiveSessionScreen';
import LockScreen from '../screens/LockScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AppSelection">
        <Stack.Screen 
          name="AppSelection" 
          component={AppSelectionScreen}
          options={{ title: 'Select Apps to Control' }}
        />
        <Stack.Screen 
          name="TimePicker" 
          component={TimePickerScreen}
          options={{ title: 'Set Time Limits' }}
        />
        <Stack.Screen 
          name="ActiveSession" 
          component={ActiveSessionScreen}
          options={{ title: 'Active Session' }}
        />
        <Stack.Screen 
          name="LockScreen" 
          component={LockScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;