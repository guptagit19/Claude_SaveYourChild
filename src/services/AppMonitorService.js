// src/services/AppMonitorService.js
import { NativeModules, NativeEventEmitter } from 'react-native';

const { AppMonitorModule } = NativeModules;
const AppMonitorEmitter = new NativeEventEmitter(AppMonitorModule);

class AppMonitorService {
  
  async getInstalledApps() {
    try {
      const apps = await AppMonitorModule.getInstalledApps();
      return apps;
    } catch (error) {
      console.error('Error getting installed apps:', error);
      return [];
    }
  }
  
  async checkPermissions() {
    const accessibility = await AppMonitorModule.checkAccessibilityPermission();
    const overlay = await AppMonitorModule.checkOverlayPermission();
    
    return { accessibility, overlay };
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
}

export default new AppMonitorService();
