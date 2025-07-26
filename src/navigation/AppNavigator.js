// src/navigation/AppNavigator.js - CORRECTED VERSION
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AppSelectionScreen from '../screens/AppSelectionScreen';
import TimePickerScreen from '../screens/TimePickerScreen';
import ActiveSessionScreen from '../screens/ActiveSessionScreen';
import LockScreen from '../screens/LockScreen';
import PermissionSetupScreen from '../screens/PermissionSetupScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    // ❌ Remove this NavigationContainer - it's already in App.js
    <Stack.Navigator
      initialRouteName="AppSelection"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4A90E2',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="AppSelection"
        component={AppSelectionScreen}
        options={{ title: 'SaveYourChild From Mobile Addict' }}
      />

      <Stack.Screen
        name="PermissionSetup"
        component={PermissionSetupScreen}
        options={{ title: 'Setup Permissions' }}
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
        options={{
          headerShown: false,
          gestureEnabled: false, // Disable swipe back
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
