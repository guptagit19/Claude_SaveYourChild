// src/services/AppMonitorService.js
import { NativeModules, NativeEventEmitter } from 'react-native';

const { AppMonitorModule } = NativeModules;
const AppMonitorEmitter = new NativeEventEmitter(AppMonitorModule);

class AppMonitorService {
  
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
  
  // Listen for blocked app events
  addBlockedAppListener(callback) {
    return AppMonitorEmitter.addListener('AppBlocked', callback);
  }
  
  removeAllListeners() {
    AppMonitorEmitter.removeAllListeners('AppBlocked');
  }
}

export default new AppMonitorService();
