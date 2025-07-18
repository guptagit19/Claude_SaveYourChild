// App.js
import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/utils/constants';

const App = () => {
  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={COLORS.BACKGROUND} 
      />
      <AppNavigator />
    </>
  );
};

export default App;