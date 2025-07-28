// src/screens/AppSettingsScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { COLORS } from '../utils/constants';

const AppSettingsScreen = ({ route, navigation }) => {
  const { appName, packageName, icon } = route.params;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{appName} Settings</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.packageName}>{packageName}</Text>
        {/* Add your settings options here */}
        <Text style={styles.placeholder}>Settings coming soon...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  packageName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  placeholder: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default AppSettingsScreen;
