import { CloudSyncState, AssessmentReportData, SubjectiveFatigueRecord } from '../types';
import { StorageService } from './storage';
import { authService } from './authService';

const STORAGE_KEY_SYNC_STATE = 'finefatigue_cloud_sync_state_v1';
const STORAGE_KEY_DEVICE_ID = 'finefatigue_device_id_v1';
type SyncListener = (state: CloudSyncState) => void;

type SyncPayload = {
  sessions: AssessmentReportData[];
  subjective: SubjectiveFatigueRecord[];
  settings: Record<string, unknown>;
  syncedAt: number;
};

class CloudSyncService {
  private state: CloudSyncState;
  private listeners = new Set<SyncListener>();
  private autoSyncTimeout: number | null = null;

  constructor() {
    let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!deviceId) {
      deviceId = `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    }
    const saved = this.readSavedState();
    this.state = {
      status: saved.lastSyncTime ? 'pending' : 'offline',
      lastSyncTime: saved.lastSyncTime || null,
      pendingChangesCount: 0,
      cloudDeviceId: deviceId
    };
  }

  getState(): CloudSyncState {
    return { ...this.state };
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  markPending(): void {
    this.state.status = 'pending';
    this.state.pendingChangesCount += 1;
    this.notify();
    if (this.autoSyncTimeout) window.clearTimeout(this.autoSyncTimeout);
    this.autoSyncTimeout = window.setTimeout(() => void this.syncNow(), 2500);
  }

  async syncNow(): Promise<{ success: boolean; syncedItemsCount: number; latencyMs: number }> {
    if (!authService.getAccessToken() || authService.getCurrentUser()?.role !== 'participant') return this.failSync(0);
    if (this.state.status === 'syncing') return { success: true, syncedItemsCount: 0, latencyMs: 0 };

    this.state.status = 'syncing';
    this.notify();
    const startedAt = Date.now();
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify({
          sessions: StorageService.getSessions(),
          subjective: StorageService.getSubjectiveFatigueRecords(),
          settings: StorageService.getSettings()
        })
      });
      if (!response.ok) throw new Error('LAN sync request failed.');
      const payload = await response.json() as SyncPayload;
      this.applyServerPayload(payload);
      this.state = { ...this.state, status: 'synced', lastSyncTime: Date.now(), pendingChangesCount: 0 };
      this.saveState();
      this.notify();
      return { success: true, syncedItemsCount: payload.sessions.length + payload.subjective.length, latencyMs: Date.now() - startedAt };
    } catch {
      return this.failSync(Date.now() - startedAt);
    }
  }

  exportCloudBackupJson(): string {
    return JSON.stringify({ version: '2.0.0', exportedAt: new Date().toISOString(), user: authService.getCurrentUser(), sessions: StorageService.getSessions(), subjective: StorageService.getSubjectiveFatigueRecords(), settings: StorageService.getSettings() }, null, 2);
  }

  importCloudBackupJson(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.sessions)) StorageService.saveSessions(data.sessions);
      if (Array.isArray(data.subjective)) StorageService.saveSubjectiveFatigueRecords(data.subjective);
      this.markPending();
      return { success: true, message: 'Backup restored locally and queued for LAN sync.' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Invalid backup JSON file format.' };
    }
  }

  private applyServerPayload(payload: SyncPayload): void {
    StorageService.saveSessions(payload.sessions || []);
    StorageService.saveSubjectiveFatigueRecords(payload.subjective || []);
    if (payload.settings && typeof payload.settings === 'object') {
      StorageService.saveSettings({ ...StorageService.getSettings(), ...payload.settings });
    }
  }

  private failSync(latencyMs: number) {
    this.state.status = 'offline';
    this.notify();
    return { success: false, syncedItemsCount: 0, latencyMs };
  }

  private readSavedState(): Partial<CloudSyncState> {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_SYNC_STATE) || '{}');
    } catch {
      return {};
    }
  }

  private saveState(): void {
    localStorage.setItem(STORAGE_KEY_SYNC_STATE, JSON.stringify(this.state));
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }
}

export const cloudSyncService = new CloudSyncService();
