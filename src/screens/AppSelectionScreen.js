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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { AppCard } from '../components';
import { COLORS } from '../utils/constants';
import StorageService from '../services/StorageService';
import AppMonitorService from '../services/AppMonitorService';

const AppSelectionScreen = ({ navigation }) => {
  const [installedApps, setInstalledApps] = useState([]);
  const [selectedApps, setSelectedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({
    accessibility: false,
    overlay: false
  });
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      // Check permissions first
      await checkPermissions();
      
      // Load previously selected apps
      await loadPreviouslySelectedApps();
      
      // Get installed apps (fallback to mock if native fails)
      await loadInstalledApps();
      
    } catch (error) {
      console.error('Error initializing screen:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      const perms = await AppMonitorService.checkPermissions();
      setPermissions(perms);
      
      // Show permission modal if not granted
      if (!perms.accessibility || !perms.overlay) {
        setShowPermissionModal(true);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const loadInstalledApps = async () => {
    try {
      const apps = await AppMonitorService.getInstalledApps();
      
      if (apps && apps.length > 0) {
        // Filter popular social media apps
        const socialApps = apps.filter(app => 
          app.packageName.includes('instagram') ||
          app.packageName.includes('facebook') ||
          app.packageName.includes('whatsapp') ||
          app.packageName.includes('youtube') ||
          app.packageName.includes('tiktok') ||
          app.packageName.includes('snapchat') ||
          app.packageName.includes('twitter') ||
          app.packageName.includes('telegram') ||
          app.packageName.includes('musically')
        );
        
        setInstalledApps(socialApps.length > 0 ? socialApps : apps.slice(0, 20));
      } else {
        // Fallback to mock data
        setInstalledApps(MOCK_APPS);
      }
    } catch (error) {
      console.error('Error loading installed apps:', error);
      // Fallback to mock data
      setInstalledApps(MOCK_APPS);
    }
  };

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

  const handleContinue = async () => {
    if (selectedApps.length === 0) {
      Alert.alert(
        'No Apps Selected',
        'Please select at least one app to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check permissions again before continuing
    const currentPerms = await AppMonitorService.checkPermissions();
    
    if (!currentPerms.accessibility || !currentPerms.overlay) {
      Alert.alert(
        'Permissions Required',
        'Please grant all required permissions to use app blocking features.',
        [
          { text: 'Cancel' },
          { text: 'Setup Permissions', onPress: () => setShowPermissionModal(true) }
        ]
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

    // Start app monitoring service
    AppMonitorService.startMonitoring();

    // Navigate to time picker
    navigation.navigate('TimePicker', { selectedApps: appsToSave });
  };

  const handlePermissionSetup = () => {
    setShowPermissionModal(false);
    navigation.navigate('PermissionSetup');
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading installed apps...</Text>
      </View>
    );
  }

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
        
        {/* Permission Status */}
        {(!permissions.accessibility || !permissions.overlay) && (
          <View style={styles.permissionWarning}>
            <Text style={styles.warningText}>
              ⚠️ Some permissions are missing. App blocking may not work properly.
            </Text>
            <TouchableOpacity 
              style={styles.warningButton}
              onPress={() => setShowPermissionModal(true)}
            >
              <Text style={styles.warningButtonText}>Setup Permissions</Text>
            </TouchableOpacity>
          </View>
        )}
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

      {/* Permission Setup Modal */}
      <Modal
        visible={showPermissionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPermissionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Permissions Required</Text>
            <Text style={styles.modalText}>
              To block other apps, we need special permissions:
            </Text>
            
            <View style={styles.permissionList}>
              <View style={styles.permissionItem}>
                <Text style={styles.permissionName}>
                  {permissions.accessibility ? '✅' : '❌'} Accessibility Service
                </Text>
                <Text style={styles.permissionDesc}>Monitor app launches</Text>
              </View>
              
              <View style={styles.permissionItem}>
                <Text style={styles.permissionName}>
                  {permissions.overlay ? '✅' : '❌'} Display Over Apps
                </Text>
                <Text style={styles.permissionDesc}>Show lock screen overlay</Text>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalSkipButton}
                onPress={() => setShowPermissionModal(false)}
              >
                <Text style={styles.modalSkipText}>Skip for Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSetupButton}
                onPress={handlePermissionSetup}
              >
                <Text style={styles.modalSetupText}>Setup Permissions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Mock data fallback
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.TEXT,
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
  permissionWarning: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    marginBottom: 8,
  },
  warningButton: {
    backgroundColor: COLORS.WARNING,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  warningButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: COLORS.TEXT,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionList: {
    marginBottom: 24,
  },
  permissionItem: {
    marginBottom: 12,
  },
  permissionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  permissionDesc: {
    fontSize: 12,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalSkipButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  modalSkipText: {
    color: COLORS.TEXT,
    fontWeight: 'bold',
  },
  modalSetupButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: COLORS.PRIMARY,
  },
  modalSetupText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AppSelectionScreen;
