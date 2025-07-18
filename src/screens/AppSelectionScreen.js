// src/screens/AppSelectionScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { AppCard } from '../components';
import { COLORS } from '../utils/constants';
import StorageService from '../services/StorageService';

// Mock data for now - will be replaced with actual installed apps
const MOCK_APPS = [
  {
    appName: 'Instagram',
    packageName: 'com.instagram.android',
    icon: null,
  },
  {
    appName: 'YouTube',
    packageName: 'com.google.android.youtube',
    icon: null,
  },
  {
    appName: 'Facebook',
    packageName: 'com.facebook.katana',
    icon: null,
  },
  {
    appName: 'TikTok',
    packageName: 'com.zhiliaoapp.musically',
    icon: null,
  },
  {
    appName: 'WhatsApp',
    packageName: 'com.whatsapp',
    icon: null,
  },
  {
    appName: 'Snapchat',
    packageName: 'com.snapchat.android',
    icon: null,
  },
  {
    appName: 'Twitter',
    packageName: 'com.twitter.android',
    icon: null,
  },
  {
    appName: 'Telegram',
    packageName: 'org.telegram.messenger',
    icon: null,
  },
];

const AppSelectionScreen = ({ navigation }) => {
  const [installedApps, setInstalledApps] = useState(MOCK_APPS);
  const [selectedApps, setSelectedApps] = useState([]);

  useEffect(() => {
    loadPreviouslySelectedApps();
  }, []);

  const loadPreviouslySelectedApps = async () => {
    try {
      const savedApps = StorageService.getLockedApps();
      if (savedApps.length > 0) {
        setSelectedApps(savedApps.map(app => app.packageName));
      }
    } catch (error) {
      console.error('Error loading previously selected apps:', error);
    }
  };

  const toggleAppSelection = (packageName) => {
    setSelectedApps(prev => {
      if (prev.includes(packageName)) {
        return prev.filter(name => name !== packageName);
      } else {
        // Limit to 5 apps for MVP
        if (prev.length >= 5) {
          Alert.alert(
            'Limit Reached',
            'You can select maximum 5 apps in the MVP version.',
            [{ text: 'OK' }]
          );
          return prev;
        }
        return [...prev, packageName];
      }
    });
  };

  const handleContinue = () => {
    if (selectedApps.length === 0) {
      Alert.alert(
        'No Apps Selected',
        'Please select at least one app to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Save selected apps to storage
    const appsToSave = installedApps
      .filter(app => selectedApps.includes(app.packageName))
      .map(app => ({
        ...app,
        isActive: true,
      }));

    StorageService.setLockedApps(appsToSave);

    // Navigate to time picker
    navigation.navigate('TimePicker', { selectedApps: appsToSave });
  };

  const renderAppItem = ({ item }) => (
    <AppCard
      appName={item.appName}
      packageName={item.packageName}
      icon={item.icon}
      isSelected={selectedApps.includes(item.packageName)}
      onPress={() => toggleAppSelection(item.packageName)}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Choose Apps to Control</Text>
        <Text style={styles.subtitle}>
          Select apps that distract you the most
        </Text>
        <Text style={styles.limit}>
          ({selectedApps.length}/5 selected)
        </Text>
      </View>

      <FlatList
        data={installedApps}
        renderItem={renderAppItem}
        keyExtractor={item => item.packageName}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedApps.length === 0 && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={selectedApps.length === 0}
        >
          <Text style={[
            styles.continueButtonText,
            selectedApps.length === 0 && styles.disabledButtonText
          ]}>
            Continue ({selectedApps.length} apps)
          </Text>
        </TouchableOpacity>
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  limit: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  continueButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#888',
  },
});

export default AppSelectionScreen;