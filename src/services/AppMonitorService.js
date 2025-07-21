// src/services/AppMonitorService.js
import { NativeModules, NativeEventEmitter, DeviceEventEmitter } from 'react-native';

const { AppMonitorModule } = NativeModules;
const AppMonitorEmitter = new NativeEventEmitter(AppMonitorModule);
import StorageService from './StorageService';

class AppMonitorService {
  
  constructor() {
    this.navigationRef = null;
  }
  
  // ✅ Set navigation reference
  setNavigationRef(navigationRef) {
    this.navigationRef = navigationRef;
    console.log('🎯 Navigation reference set in AppMonitorService');
  }
  
  // ✅ Listen for app blocked events
  addBlockedAppListener(callback) {
    const subscription = AppMonitorEmitter.addListener('AppBlocked', (data) => {
      console.log('📱 App blocked event received:', data);
      
      if (data.action === 'NAVIGATE_TO_LOCK_SCREEN') {
        this.navigateToLockScreen(data.appName, data.packageName);
      }
      
      if (callback) callback(data);
    });
    
    return subscription;
  }
  
// ✅ Navigate to lock screen
  navigateToLockScreen(appName, packageName) {
    try {
      console.log('🔒 Navigating to LockScreen for:', appName);
      
      if (this.navigationRef && this.navigationRef.current) {
        // Calculate remaining time (placeholder for now)
        const remainingTime = this.calculateRemainingTime(packageName);
        
        this.navigationRef.current.navigate('LockScreen', {
          lockedAppName: appName,
          lockedPackage: packageName,
          remainingTime: remainingTime || 30, // Default 30 minutes
        });
        
        console.log('✅ Successfully navigated to LockScreen');
      } else {
        console.warn('⚠️ Navigation ref not available');
      }
    } catch (error) {
      console.error('❌ Error navigating to lock screen:', error);
    }
  }
  
  // ✅ Calculate remaining time (placeholder - implement based on your logic)
  calculateRemainingTime(packageName) {
    // This would check your session management
    // For now, return default
    return 30; // 30 minutes
  }
  
  // ✅ Bring app to foreground
  async bringAppToForeground() {
    try {
      await AppMonitorModule.bringAppToForeground();
      return true;
    } catch (error) {
      console.error('Error bringing app to foreground:', error);
      return false;
    }
  }
  
  async getInstalledApps() {
    try {
      console.log('🔍 Getting installed apps with icons...');
      const apps = await AppMonitorModule.getInstalledApps();
      console.log('✅ Successfully loaded', apps.length, 'apps');
      if (apps && apps.length > 0) {
        // Sort apps alphabetically and filter out system apps
        const userApps = apps
          .filter(app => 
            app.appName && 
            app.appName.trim() !== '' &&
            !app.packageName.startsWith('com.android.') &&
            !app.packageName.startsWith('android.')
          )
          .sort((a, b) => a.appName.localeCompare(b.appName));
        
        console.log(`Found ${userApps.length} user apps`);
        return userApps;
      }
    } catch (error) {
      console.error('❌ Error getting installed apps:', error);
      return [];
    }
  }
  
  async checkPermissions() {
    try {
      const accessibility = await AppMonitorModule.checkAccessibilityPermission();
      const overlay = await AppMonitorModule.checkOverlayPermission();
      
      return { accessibility, overlay };
    } catch (error) {
      console.error('Error checking permissions:', error);
      return { accessibility: false, overlay: false };
    }
  }
  
  openAccessibilitySettings() {
    AppMonitorModule.openAccessibilitySettings();
  }
  
  openOverlaySettings() {
    AppMonitorModule.openOverlaySettings();
  }
  
  startMonitoring() {
    AppMonitorModule.startAppMonitoring();
  }
  
  stopMonitoring() {
    AppMonitorModule.stopAppMonitoring();
  }
  
  removeAllListeners() {
    AppMonitorEmitter.removeAllListeners('AppBlocked');
  }
}

export default new AppMonitorService();
