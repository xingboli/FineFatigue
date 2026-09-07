import { CloudSyncState, AssessmentReportData, CognitionMemoryResult, StarCatcherResult, SubjectiveFatigueRecord } from '../types';
import { StorageService } from './storage';
import { authService } from './authService';
import { CognitionStorage } from './cognitionStorage';
import { DEMO_MODE } from '../config/runtime';

const STORAGE_KEY_SYNC_STATE = 'finefatigue_cloud_sync_state_v1';
const STORAGE_KEY_DEVICE_ID = 'finefatigue_device_id_v1';
const STORAGE_KEY_SYNC_MANIFEST = 'finefatigue_sync_manifest_v1';
type SyncListener = (state: CloudSyncState) => void;

type SyncManifest = Record<string, {
  sessions: string[];
  subjective: string[];
  cognition: string[];
  games: string[];
}>;

type SyncPayload = {
  sessions: AssessmentReportData[];
  subjective: SubjectiveFatigueRecord[];
  cognition: CognitionMemoryResult[];
  games: StarCatcherResult[];
  settings: Record<string, unknown>;
  syncedAt: number;
};

class CloudSyncService {
  private state: CloudSyncState;
  private listeners = new Set<SyncListener>();
  private autoSyncTimeout: number | null = null;
  private retryTimeout: number | null = null;
  private retryCount = 0;

  constructor() {
    let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!deviceId) {
      deviceId = `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    }
    const saved = this.readSavedState();
    this.state = {
      status: DEMO_MODE ? 'offline' : saved.lastSyncTime ? 'pending' : 'offline',
      lastSyncTime: saved.lastSyncTime || null,
      pendingChangesCount: 0,
      cloudDeviceId: deviceId
    };
    if (!DEMO_MODE) window.addEventListener('online', () => {
      if (this.state.status === 'offline' || this.state.status === 'pending') {
        this.retryCount = 0;
        void this.syncNow();
      }
    });
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
    if (DEMO_MODE) {
      this.state = { ...this.state, status: 'offline', pendingChangesCount: 0 };
      this.notify();
      return;
    }
    this.state.status = 'pending';
    this.state.pendingChangesCount += 1;
    this.retryCount = 0;
    this.notify();
    if (this.autoSyncTimeout) window.clearTimeout(this.autoSyncTimeout);
    this.autoSyncTimeout = window.setTimeout(() => void this.syncNow(), 2500);
  }

  async syncNow(): Promise<{ success: boolean; syncedItemsCount: number; latencyMs: number }> {
    if (DEMO_MODE) return { success: false, syncedItemsCount: 0, latencyMs: 0 };
    if (!authService.getAccessToken() || authService.getCurrentUser()?.role !== 'participant') return this.failSync(0);
    if (this.state.status === 'syncing') return { success: true, syncedItemsCount: 0, latencyMs: 0 };

    this.state.status = 'syncing';
    this.notify();
    const startedAt = Date.now();
    try {
      const userId = authService.getCurrentUser()!.id;
      const manifest = this.readManifest();
      const syncedIds = manifest[userId] || { sessions: [], subjective: [], cognition: [], games: [] };
      const outbound = {
        sessions: this.unsynced(StorageService.getSessions(), syncedIds.sessions),
        subjective: this.unsynced(StorageService.getSubjectiveFatigueRecords(), syncedIds.subjective),
        cognition: this.unsynced(CognitionStorage.getResults(), syncedIds.cognition),
        games: this.unsynced(StorageService.getGameResults(), syncedIds.games)
      };
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
        body: JSON.stringify({
          ...outbound,
          settings: StorageService.getSettings()
        })
      });
      if (!response.ok) throw new Error('LAN sync request failed.');
      const payload = await response.json() as SyncPayload;
      this.applyServerPayload(payload);
      manifest[userId] = {
        sessions: this.mergeIds(syncedIds.sessions, payload.sessions),
        subjective: this.mergeIds(syncedIds.subjective, payload.subjective),
        cognition: this.mergeIds(syncedIds.cognition, payload.cognition),
        games: this.mergeIds(syncedIds.games, payload.games || [])
      };
      this.saveManifest(manifest);
      this.state = { ...this.state, status: 'synced', lastSyncTime: Date.now(), pendingChangesCount: 0 };
      this.retryCount = 0;
      if (this.retryTimeout) window.clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
      this.saveState();
      this.notify();
      return { success: true, syncedItemsCount: outbound.sessions.length + outbound.subjective.length + outbound.cognition.length + outbound.games.length, latencyMs: Date.now() - startedAt };
    } catch {
      return this.failSync(Date.now() - startedAt);
    }
  }

  exportCloudBackupJson(): string {
    return JSON.stringify({ version: '2.2.0', exportedAt: new Date().toISOString(), user: authService.getCurrentUser(), sessions: StorageService.getSessions(), subjective: StorageService.getSubjectiveFatigueRecords(), cognition: CognitionStorage.getResults(), games: StorageService.getGameResults(), settings: StorageService.getSettings() }, null, 2);
  }

  importCloudBackupJson(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.sessions)) StorageService.saveSessions(data.sessions);
      if (Array.isArray(data.subjective)) StorageService.saveSubjectiveFatigueRecords(data.subjective);
      if (Array.isArray(data.cognition)) CognitionStorage.saveResults(data.cognition);
      if (Array.isArray(data.games)) data.games.forEach((game: StarCatcherResult) => StorageService.addGameResult(game));
      this.markPending();
      return { success: true, message: 'Backup restored locally and queued for LAN sync.' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Invalid backup JSON file format.' };
    }
  }

  private applyServerPayload(payload: SyncPayload): void {
    StorageService.saveSessions(payload.sessions || []);
    StorageService.saveSubjectiveFatigueRecords(payload.subjective || []);
    CognitionStorage.saveResults(payload.cognition || []);
    (payload.games || []).forEach(game => StorageService.addGameResult(game));
    if (payload.settings && typeof payload.settings === 'object') {
      StorageService.saveSettings({ ...StorageService.getSettings(), ...payload.settings });
    }
  }

  private failSync(latencyMs: number) {
    this.state.status = 'offline';
    this.notify();
    if (authService.getAccessToken() && authService.getCurrentUser()?.role === 'participant' && this.retryCount < 3) {
      this.scheduleRetry();
    }
    return { success: false, syncedItemsCount: 0, latencyMs };
  }

  private scheduleRetry(): void {
    if (this.retryTimeout) window.clearTimeout(this.retryTimeout);
    const delayMs = 2500 * (2 ** this.retryCount);
    this.retryCount += 1;
    this.retryTimeout = window.setTimeout(() => {
      this.retryTimeout = null;
      void this.syncNow();
    }, delayMs);
  }

  private readSavedState(): Partial<CloudSyncState> {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_SYNC_STATE) || '{}');
    } catch {
      return {};
    }
  }

  private unsynced<T extends { id: string }>(items: T[], knownIds: string[]): T[] {
    const known = new Set(knownIds);
    return items.filter(item => item?.id && !known.has(item.id));
  }

  private mergeIds<T extends { id: string }>(knownIds: string[], items: T[]): string[] {
    return [...new Set([...knownIds, ...items.map(item => item.id).filter(Boolean)])];
  }

  private readManifest(): SyncManifest {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY_SYNC_MANIFEST) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  }

  private saveManifest(manifest: SyncManifest): void {
    localStorage.setItem(STORAGE_KEY_SYNC_MANIFEST, JSON.stringify(manifest));
  }

  private saveState(): void {
    localStorage.setItem(STORAGE_KEY_SYNC_STATE, JSON.stringify(this.state));
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }
}

export const cloudSyncService = new CloudSyncService();
