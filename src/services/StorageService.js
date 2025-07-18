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
    this.storage.set('activeSession', JSON.stringify(session));
  }

  getActiveSession() {
    const session = this.storage.getString('activeSession');
    return session ? JSON.parse(session) : null;
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