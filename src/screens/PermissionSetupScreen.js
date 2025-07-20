// src/screens/PermissionSetupScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import AppMonitorService from '../services/AppMonitorService';
import { COLORS } from '../utils/constants';

const PermissionSetupScreen = ({ navigation }) => {
  const [permissions, setPermissions] = useState({
    accessibility: false,
    overlay: false
  });
  
  useEffect(() => {
    checkPermissions();
  }, []);
  
  const checkPermissions = async () => {
    const perms = await AppMonitorService.checkPermissions();
    setPermissions(perms);
  };
  
  const handleAccessibilitySetup = () => {
    Alert.alert(
      'Accessibility Service Required',
      'Please enable "SaveYourChild" accessibility service to monitor app usage.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => AppMonitorService.openAccessibilitySettings() }
      ]
    );
  };
  
  const handleOverlaySetup = () => {
    Alert.alert(
      'Display Over Other Apps',
      'Please allow "SaveYourChild" to display over other apps to show lock screens.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => AppMonitorService.openOverlaySettings() }
      ]
    );
  };
  
  const handleContinue = () => {
    if (permissions.accessibility && permissions.overlay) {
      AppMonitorService.startMonitoring();
      navigation.navigate('AppSelection');
    } else {
      Alert.alert('Permissions Required', 'Please grant all required permissions to continue.');
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Setup Required Permissions</Text>
      <Text style={styles.subtitle}>
        For system-level app blocking, we need special permissions
      </Text>
      
      <View style={styles.permissionCard}>
        <Text style={styles.permissionTitle}>Accessibility Service</Text>
        <Text style={styles.permissionDesc}>
          Monitors which apps are opened to provide blocking functionality
        </Text>
        <TouchableOpacity 
          style={[styles.button, permissions.accessibility ? styles.enabled : styles.disabled]}
          onPress={handleAccessibilitySetup}
        >
          <Text style={styles.buttonText}>
            {permissions.accessibility ? '✓ Enabled' : 'Enable'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.permissionCard}>
        <Text style={styles.permissionTitle}>Display Over Other Apps</Text>
        <Text style={styles.permissionDesc}>
          Shows lock screen overlay when blocked apps are opened
        </Text>
        <TouchableOpacity 
          style={[styles.button, permissions.overlay ? styles.enabled : styles.disabled]}
          onPress={handleOverlaySetup}
        >
          <Text style={styles.buttonText}>
            {permissions.overlay ? '✓ Enabled' : 'Enable'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.continueButton, 
          (permissions.accessibility && permissions.overlay) ? styles.enabled : styles.disabled
        ]}
        onPress={handleContinue}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.refreshButton} onPress={checkPermissions}>
        <Text style={styles.refreshButtonText}>Refresh Permission Status</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.BACKGROUND,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT,
    marginBottom: 30,
    opacity: 0.7,
  },
  permissionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  permissionDesc: {
    fontSize: 14,
    color: COLORS.TEXT,
    opacity: 0.7,
    marginBottom: 15,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  enabled: {
    backgroundColor: COLORS.SUCCESS,
  },
  disabled: {
    backgroundColor: COLORS.PRIMARY,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  continueButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: COLORS.WARNING,
  },
  refreshButtonText: {
    color: COLORS.BACKGROUND,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PermissionSetupScreen;
