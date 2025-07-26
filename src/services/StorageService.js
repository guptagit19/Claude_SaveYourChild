// src/services/StorageService.js
import { MMKV } from 'react-native-mmkv';

class StorageService {
  constructor() {
    this.storage = new MMKV();
  }

  // App Management
  setLockedApps(apps) {
    this.storage.set('lockedApps', JSON.stringify(apps));
  }

  getLockedApps() {
    const apps = this.storage.getString('lockedApps');
    return apps ? JSON.parse(apps) : [];
  }

// Session Management
  setActiveSession(session) {
    try {
      this.storage.set('activeSession', JSON.stringify(session));
      //console.log('✅ Active session saved to MMKV:', session);
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

  // Clear active session
  clearActiveSession() {
    try {
      this.storage.removeItem('activeSession');
      //console.log('✅ Active session cleared from MMKV');
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

  // Update specific app in active session
  updateAppInActiveSession(packageName, updates) {
    try {
      const activeSession = this.getActiveSession();
      if (activeSession[packageName]) {
        activeSession[packageName] = {
          ...activeSession[packageName],
          ...updates
        };
        this.setActiveSession(activeSession);
        console.log(`✅ Updated ${packageName} in active session:`, updates);
      }
    } catch (error) {
      console.error('❌ Error updating app in active session:', error);
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