// src/services/StorageService.js
import { MMKV } from 'react-native-mmkv';
import { DeviceEventEmitter } from 'react-native';

class StorageService {
  constructor() {
    this.storage = new MMKV();
    
    // ✅ Listen for active session updates from Java
    this.setupEventListeners();
  }

  // ✅ Setup event listeners for Java-side updates
  setupEventListeners() {
    DeviceEventEmitter.addListener('ActiveSessionUpdated', (data) => {
      try {
        console.log('📨 Received active session update from Java:', data);
        if (data.activeSession) {
          const sessionData = JSON.parse(data.activeSession);
          this.setActiveSession(sessionData);
          console.log('✅ MMKV updated from Java side');
        }
      } catch (error) {
        console.error('❌ Error handling ActiveSessionUpdated event:', error);
      }
    });
  }

  // Session Management
  setActiveSession(session) {
    try {
      // ✅ Handle both object and string inputs
      const sessionString = typeof session === 'string' ? session : JSON.stringify(session);
      this.storage.set('activeSession', sessionString);
      console.log('✅ Active session saved to MMKV');
      
      // ✅ Also update Java side
      if (global.AppMonitorModule) {
        global.AppMonitorModule.updateActiveSession(sessionString);
      }
    } catch (error) {
      console.error('❌ Error saving active session:', error);
    }
  }

  getActiveSession() {
    try {
      const session = this.storage.getString('activeSession');
      if (session) {
        return JSON.parse(session);
      }
      return {};
    } catch (error) {
      console.error('❌ Error getting active session:', error);
      return {};
    }
  }

  // ✅ New method to sync with Java side
  syncActiveSessionWithJava() {
    try {
      const activeSession = this.getActiveSession();
      const sessionString = JSON.stringify(activeSession);
      
      if (global.AppMonitorModule) {
        global.AppMonitorModule.updateActiveSession(sessionString);
        console.log('✅ Active session synced with Java');
      }
    } catch (error) {
      console.error('❌ Error syncing active session with Java:', error);
    }
  }

  // Update specific app in active session (enhanced)
  updateAppInActiveSession(packageName, updates) {
    try {
      const activeSession = this.getActiveSession();
      
      if (activeSession[packageName]) {
        activeSession[packageName] = {
          ...activeSession[packageName],
          ...updates
        };
      } else {
        // ✅ Create new app entry if doesn't exist
        activeSession[packageName] = {
          packageName: packageName,
          isActive: true,
          ...updates
        };
      }
      
      this.setActiveSession(activeSession);
      console.log(`✅ Updated ${packageName} in active session:`, updates);
      
    } catch (error) {
      console.error('❌ Error updating app in active session:', error);
    }
  }

  // Clear active session
  clearActiveSession() {
    try {
      this.storage.removeItem('activeSession');
      
      // ✅ Also clear Java side
      if (global.AppMonitorModule) {
        global.AppMonitorModule.updateActiveSession('{}');
      }
      
      console.log('✅ Active session cleared from MMKV and Java');
    } catch (error) {
      console.error('❌ Error clearing active session:', error);
    }
  }

  // Get specific app from active session
  getAppFromActiveSession(packageName) {
    try {
      const activeSession = this.getActiveSession();
      return activeSession[packageName] || null;
    } catch (error) {
      console.error('❌ Error getting app from active session:', error);
      return null;
    }
  }

  // Analytics
  saveDailyUsage(data) {
    const today = new Date().toDateString();
    this.storage.set(`usage_${today}`, JSON.stringify(data));
  }

  getDailyUsage() {
    const today = new Date().toDateString();
    const usage = this.storage.getString(`usage_${today}`);
    return usage ? JSON.parse(usage) : null;
  }
}

export default new StorageService();
