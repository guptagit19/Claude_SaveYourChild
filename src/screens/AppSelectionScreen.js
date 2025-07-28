// src/screens/AppSelectionScreen.js
import React, { useState, useEffect, useRef } from 'react';
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
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AppCard } from '../components';
import { COLORS } from '../utils/constants';
import StorageService from '../services/StorageService';
import AppMonitorService from '../services/AppMonitorService';

const { width } = Dimensions.get('window');

const AppSelectionScreen = ({ navigation }) => {
  const [installedApps, setInstalledApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [selectedApps, setSelectedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [permissions, setPermissions] = useState({
    accessibility: false,
    overlay: false,
  });
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Animation values
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeScreen();
    startBubbleAnimation();
  }, []);

  useEffect(() => {
    filterAndSortApps();
  }, [installedApps, selectedApps, searchQuery]);

  const startBubbleAnimation = () => {
    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Breathing/Scaling animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  };

  const filterAndSortApps = () => {
    let filtered = installedApps.filter(app =>
      app.appName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort: selected apps first, then alphabetically
    filtered.sort((a, b) => {
      const aSelected = selectedApps.includes(a.packageName);
      const bSelected = selectedApps.includes(b.packageName);
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      return a.appName.localeCompare(b.appName);
    });

    setFilteredApps(filtered);
  };

  const initializeScreen = async () => {
    try {
      await checkPermissions();
      await loadPreviouslySelectedApps();
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
        setInstalledApps(apps);
      } else {
        setInstalledApps(MOCK_APPS);
      }
    } catch (error) {
      console.error('Error loading installed apps:', error);
      setInstalledApps(MOCK_APPS);
    }
  };

  const loadPreviouslySelectedApps = async () => {
    try {
      const activeSession = StorageService.getActiveSession();
      AppMonitorService.updateActiveSession(
        JSON.stringify(StorageService.getActiveSession()),
      );
      if (activeSession && Object.keys(activeSession).length > 0) {
        const selectedPackageNames = Object.keys(activeSession);
        setSelectedApps(selectedPackageNames);

        console.log(
          '✅ Loaded previously selected apps from activeSession:',
          selectedPackageNames,
        );
      }
    } catch (error) {
      console.error('Error loading previously selected apps:', error);
    }
  };

  const toggleAppSelection = async packageName => {
    try {
      let activeSession = {};
      try {
        const existingSession = StorageService.getActiveSession();
        if (existingSession) {
          activeSession =
            typeof existingSession === 'string'
              ? JSON.parse(existingSession)
              : existingSession;
        }
      } catch (error) {
        console.log('No existing active session found, creating new one');
        activeSession = {};
      }

      setSelectedApps(prev => {
        if (prev.includes(packageName)) {
          console.log(`🗑️ Removing ${packageName} from active session`);
          delete activeSession[packageName];
          StorageService.setActiveSession(activeSession);
          AppMonitorService.updateActiveSession(
            JSON.stringify(StorageService.getActiveSession()),
          );

          console.log(
            'Updated activeSession after removal:',
            JSON.stringify(StorageService.getActiveSession()),
          );

          return prev.filter(name => name !== packageName);
        } else {
          if (prev.length >= 5) {
            Alert.alert(
              'Limit Reached',
              'You can select maximum 5 apps in the MVP version.',
              [{ text: 'OK' }],
            );
            return prev;
          }

          console.log(`➕ Adding ${packageName} to active session`);

          const selectedApp = installedApps.find(
            app => app.packageName === packageName,
          );

          if (selectedApp) {
            activeSession[packageName] = {
              icon: selectedApp.icon || '',
              appName: selectedApp.appName || 'Unknown App',
              packageName: packageName,
              accessTime: 0,
              lockTime: 0,
              accessStartTime: '',
              accessEndTime: '',
              lockUpToTime: '',
              noreels: false,
              wallpaper: '',
              isActive: true,
            };

            StorageService.setActiveSession(activeSession);
            AppMonitorService.updateActiveSession(
              JSON.stringify(StorageService.getActiveSession()),
            );
            console.log(
              'Updated activeSession after addition:',
              JSON.stringify(StorageService.getActiveSession()),
            );
          }

          return [...prev, packageName];
        }
      });
    } catch (error) {
      console.error('Error in toggleAppSelection:', error);
      Alert.alert('Error', 'Failed to update app selection. Please try again.');
    }
  };

  const handleContinue = async () => {
    if (selectedApps.length === 0) {
      Alert.alert(
        'No Apps Selected',
        'Please select at least one app to continue.',
        [{ text: 'OK' }],
      );
      return;
    }

    const currentPerms = await AppMonitorService.checkPermissions();
    if (!currentPerms.accessibility || !currentPerms.overlay) {
      Alert.alert(
        'Permissions Required',
        'Please grant all required permissions to use app blocking features.',
        [
          { text: 'Cancel' },
          {
            text: 'Setup Permissions',
            onPress: () => setShowPermissionModal(true),
          },
        ],
      );
      return;
    }

    const appsToSave = installedApps
      .filter(app => selectedApps.includes(app.packageName))
      .map(app => ({
        ...app,
        isActive: true,
      }));

    AppMonitorService.startMonitoring();
    navigation.navigate('TimePicker', { selectedApps: appsToSave });
  };

  const handlePermissionSetup = () => {
    setShowPermissionModal(false);
    navigation.navigate('PermissionSetup');
  };

  const handleBubblePress = () => {
    // Add ripple effect
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setShowSearchModal(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const closeSearchModal = () => {
    setShowSearchModal(false);
    setSearchQuery('');
  };

  const renderAppItem = ({ item }) => (
    <AppCard
      appName={item.appName}
      packageName={item.packageName}
      icon={item.icon}
      isSelected={selectedApps.includes(item.packageName)}
      onPress={() => toggleAppSelection(item.packageName)}
      navigation={navigation}
      onSettingsPress={({ appName, packageName, icon }) => {
        console.log(`Settings pressed for ${appName}`);
      }}
    />
  );

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[styles.container, styles.centered]}
      >
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading installed apps...</Text>
      </LinearGradient>
    );
  }

  const floatInterpolate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      {/* Header with Bubble */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {/* Animated Water Bubble */}
          <TouchableOpacity
            onPress={handleBubblePress}
            style={styles.bubbleContainer}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.waterBubble,
                {
                  transform: [
                    { translateY: floatInterpolate },
                    { scale: scaleAnim },
                    { rotate: rotateInterpolate },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
                style={styles.bubbleGradient}
              >
                <Text style={styles.bubbleIcon}>🔍</Text>
                {/* Bubble shine effect */}
                <View style={styles.bubbleShine} />
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          <Text style={styles.title}>Choose Apps to Control</Text>
        </View>
        
        <Text style={styles.subtitle}>
          Select apps that distract you the most
        </Text>
        
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {selectedApps.length}/5 apps selected
          </Text>
        </View>

        {/* Permission Warning */}
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

      {/* Apps List */}
      <View style={styles.listContainer}>
        <FlatList
          data={filteredApps}
          renderItem={renderAppItem}
          keyExtractor={item => item.packageName}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedApps.length === 0 && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={selectedApps.length === 0}
        >
          <LinearGradient
            colors={
              selectedApps.length > 0
                ? ['#FF6B6B', '#FF8E53']
                : ['#CCC', '#AAA']
            }
            style={styles.buttonGradient}
          >
            <Text
              style={[
                styles.continueButtonText,
                selectedApps.length === 0 && styles.disabledButtonText,
              ]}
            >
              Continue ({selectedApps.length} apps) →
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeSearchModal}
      >
        <View style={styles.searchModalOverlay}>
          <View style={styles.searchModalContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.searchHeader}
            >
              <Text style={styles.searchTitle}>Search Apps</Text>
              <TouchableOpacity
                onPress={closeSearchModal}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.searchInputContainer}>
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Type app name to search..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                    <Text style={styles.clearText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Search Results */}
            <View style={styles.searchResults}>
              <FlatList
                data={filteredApps}
                renderItem={renderAppItem}
                keyExtractor={item => item.packageName}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.searchListContent}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Permission Setup Modal */}
      <Modal
        visible={showPermissionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPermissionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Permissions Required</Text>
            </LinearGradient>
            
            <View style={styles.modalBody}>
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
                  <LinearGradient
                    colors={['#FF6B6B', '#FF8E53']}
                    style={styles.setupButtonGradient}
                  >
                    <Text style={styles.modalSetupText}>Setup Permissions</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

// Mock Apps Data
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
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  header: {
    paddingTop: 5,
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bubbleContainer: {
    position: 'absolute',
    left: 0,
    top: 10,
    zIndex: 10,
  },
  waterBubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bubbleGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  bubbleIcon: {
    fontSize: 20,
    color: '#667eea',
    fontWeight: 'bold',
  },
  bubbleShine: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    //marginLeft: 0, // Space for bubble
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 15,
  },
  counterContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 10,
  },
  counterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  permissionWarning: {
    backgroundColor: 'rgba(255,243,205,0.95)',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    marginBottom: 8,
  },
  warningButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  warningButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 10,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 10,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 10,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  continueButton: {
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  disabledButton: {
    elevation: 0,
    shadowOpacity: 0,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#888',
  },

  // Search Modal Styles
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '95%',
    maxHeight: '90%',
    overflow: 'hidden',
    elevation: 15,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchInputContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
    color: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  clearButton: {
    padding: 5,
  },
  clearText: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 10,
  },
  searchListContent: {
    paddingBottom: 20,
  },

  // Permission Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 10,
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionList: {
    marginBottom: 24,
  },
  permissionItem: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  permissionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  modalSkipText: {
    color: '#333',
    fontWeight: 'bold',
  },
  modalSetupButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  setupButtonGradient: {
    padding: 12,
    alignItems: 'center',
  },
  modalSetupText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AppSelectionScreen;
