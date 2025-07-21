// App.js - This is CORRECT
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native'; // ✅ Only one NavigationContainer here
import AppNavigator from './src/navigation/AppNavigator';
import AppMonitorService from './src/services/AppMonitorService';
import { COLORS } from './src/utils/constants';

const App = () => {
  const navigationRef = useRef();

  useEffect(() => {
    AppMonitorService.setNavigationRef(navigationRef);

    const subscription = AppMonitorService.addBlockedAppListener(data => {
      console.log('🚫 App blocked in App.js:', data);
      
      if (data.action === 'NAVIGATE_TO_LOCK_SCREEN') {
        console.log('📱 Handling navigation to lock screen');
      }
    });

    return () => {
      subscription.remove();
      console.log('🧹 Cleaned up event listeners');
    };
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND} />
      <NavigationContainer ref={navigationRef}>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
};

export default App;
