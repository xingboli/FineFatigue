import { CloudSyncState, AssessmentReportData, SubjectiveFatigueRecord } from '../types';
import { StorageService } from './storage';
import { authService } from './authService';

const STORAGE_KEY_SYNC_STATE = 'finefatigue_cloud_sync_state_v1';
const STORAGE_KEY_DEVICE_ID = 'finefatigue_device_id_v1';

type SyncListener = (state: CloudSyncState) => void;

class CloudSyncService {
  private state: CloudSyncState;
  private listeners: Set<SyncListener> = new Set();
  private autoSyncTimeout: any = null;

  constructor() {
    let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!deviceId) {
      deviceId = `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    }

    let savedState: Partial<CloudSyncState> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SYNC_STATE);
      if (raw) savedState = JSON.parse(raw);
    } catch (e) {
      // ignore
    }

    this.state = {
      status: 'synced',
      lastSyncTime: savedState.lastSyncTime || Date.now() - 1000 * 60 * 12,
      pendingChangesCount: 0,
      cloudDeviceId: deviceId
    };
  }

  getState(): CloudSyncState {
    return { ...this.state };
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  markPending() {
    this.state.status = 'pending';
    this.state.pendingChangesCount += 1;
    this.notify();
    this.scheduleAutoSync();
  }

  private scheduleAutoSync() {
    if (this.autoSyncTimeout) {
      clearTimeout(this.autoSyncTimeout);
    }
    // Auto sync after 2.5 seconds of inactivity
    this.autoSyncTimeout = setTimeout(() => {
      this.syncNow();
    }, 2500);
  }

  async syncNow(): Promise<{ success: boolean; syncedItemsCount: number; latencyMs: number }> {
    if (this.state.status === 'syncing') {
      return { success: true, syncedItemsCount: 0, latencyMs: 0 };
    }

    this.state.status = 'syncing';
    this.notify();

    const startTime = Date.now();

    // Prepare cloud payload
    const currentUser = authService.getCurrentUser();
    const sessions = StorageService.getSessions();
    const subjective = StorageService.getSubjectiveFatigueRecords();
    const settings = StorageService.getSettings();

    const payload = {
      deviceId: this.state.cloudDeviceId,
      user: currentUser,
      sessions,
      subjective,
      settings,
      syncedAt: Date.now()
    };

    // Simulate realistic cloud transmission / server endpoint processing
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));

    try {
      // Persist backup snapshot in local simulated cloud mirror
      localStorage.setItem('finefatigue_cloud_mirror_v1', JSON.stringify(payload));

      this.state.status = 'synced';
      this.state.lastSyncTime = Date.now();
      this.state.pendingChangesCount = 0;
      this.saveState();
      this.notify();

      return {
        success: true,
        syncedItemsCount: sessions.length + subjective.length,
        latencyMs: Date.now() - startTime
      };
    } catch (err) {
      this.state.status = 'offline';
      this.notify();
      return {
        success: false,
        syncedItemsCount: 0,
        latencyMs: Date.now() - startTime
      };
    }
  }

  exportCloudBackupJson(): string {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      deviceId: this.state.cloudDeviceId,
      user: authService.getCurrentUser(),
      sessions: StorageService.getSessions(),
      subjective: StorageService.getSubjectiveFatigueRecords(),
      settings: StorageService.getSettings()
    };
    return JSON.stringify(payload, null, 2);
  }

  importCloudBackupJson(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.sessions)) {
        StorageService.saveSessions(data.sessions);
      }
      if (Array.isArray(data.subjective)) {
        StorageService.saveSubjectiveFatigueRecords(data.subjective);
      }
      if (data.user) {
        authService.loginPreset(data.user);
      }
      this.state.status = 'synced';
      this.state.lastSyncTime = Date.now();
      this.saveState();
      this.notify();
      return { success: true, message: 'Cloud backup restored successfully.' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Invalid backup JSON file format.' };
    }
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY_SYNC_STATE, JSON.stringify(this.state));
    } catch (e) {
      // ignore
    }
  }

  private notify() {
    this.listeners.forEach(l => l({ ...this.state }));
  }
}

export const cloudSyncService = new CloudSyncService();
