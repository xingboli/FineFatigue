import { AssessmentReportData, StarCatcherResult, SubjectiveFatigueRecord } from '../types';

const STORAGE_KEY_SESSIONS = 'finefatigue_sessions_v1';
const STORAGE_KEY_SETTINGS = 'finefatigue_settings_v1';
const STORAGE_KEY_ACTIVE_REPORT = 'finefatigue_active_report_v1';
const STORAGE_KEY_SUBJECTIVE = 'finefatigue_subjective_v1';
const STORAGE_KEY_GAMES = 'finefatigue_games_v2';

export class LocalStorageWriteError extends Error {
  constructor(public readonly code: 'quota' | 'unavailable') { super(code); }
}

function writeLocalStorage(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (error) {
    const quota = error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    throw new LocalStorageWriteError(quota ? 'quota' : 'unavailable');
  }
}

export interface AppSettings {
  subjectId: string;
  sensorMode: 'real';
  samplingRate: number;
  autoSkipCountdown: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  subjectId: '未设置',
  sensorMode: 'real',
  samplingRate: 50,
  autoSkipCountdown: false
};

export const StorageService = {
  getSessions(): AssessmentReportData[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const realSessions = parsed.filter(session => !String(session?.id || '').startsWith('DEMO-SUBJ-'));
          if (realSessions.length !== parsed.length) this.saveSessions(realSessions);
          return realSessions;
        }
      }
    } catch (e) {
      console.warn('Failed to parse sessions from localStorage', e);
    }

    return [];
  },

  saveSessions(sessions: AssessmentReportData[]): void {
    writeLocalStorage(STORAGE_KEY_SESSIONS, sessions);
  },

  addSession(session: AssessmentReportData): void {
    const sessions = this.getSessions();
    const updated = [session, ...sessions.filter(s => s.id !== session.id)];
    this.saveSessions(updated);
    this.setActiveReport(session);
  },

  saveSession(session: AssessmentReportData): void {
    this.addSession(session);
  },

  getSessionById(id: string): AssessmentReportData | null {
    const sessions = this.getSessions();
    return sessions.find(s => s.id === id) || null;
  },

  deleteSession(id: string): void {
    const sessions = this.getSessions().filter(s => s.id !== id);
    this.saveSessions(sessions);
  },

  getActiveReport(): AssessmentReportData | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ACTIVE_REPORT);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to get active report', e);
    }
    const sessions = this.getSessions();
    return sessions[0] || null;
  },

  setActiveReport(report: AssessmentReportData): void {
    writeLocalStorage(STORAGE_KEY_ACTIVE_REPORT, report);
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to load settings', e);
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: AppSettings): void {
    writeLocalStorage(STORAGE_KEY_SETTINGS, settings);
  },

  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEY_SESSIONS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_REPORT);
    localStorage.removeItem(STORAGE_KEY_SUBJECTIVE);
    localStorage.removeItem(STORAGE_KEY_GAMES);
  },

  resetToDefaults(): void {
    this.resetAllData();
  },

  getSubjectiveFatigueRecords(): SubjectiveFatigueRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SUBJECTIVE);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load subjective fatigue records', e);
    }
    return [];
  },

  saveSubjectiveFatigueRecords(records: SubjectiveFatigueRecord[]): void {
    writeLocalStorage(STORAGE_KEY_SUBJECTIVE, records);
  },

  saveSubjectiveFatigueRecord(record: SubjectiveFatigueRecord): void {
    const current = this.getSubjectiveFatigueRecords();
    const updated = [record, ...current.filter(r => r.id !== record.id)];
    this.saveSubjectiveFatigueRecords(updated);
  },

  addSubjectiveFatigueRecord(record: Omit<SubjectiveFatigueRecord, 'id' | 'timestamp'>): SubjectiveFatigueRecord {
    const fullRecord: SubjectiveFatigueRecord = {
      ...record,
      id: `SUBJ-${Date.now().toString(36).toUpperCase()}`,
      timestamp: Date.now()
    };
    const current = this.getSubjectiveFatigueRecords();
    const updated = [fullRecord, ...current];
    this.saveSubjectiveFatigueRecords(updated);
    return fullRecord;
  },

  deleteSubjectiveFatigueRecord(id: string): void {
    const current = this.getSubjectiveFatigueRecords().filter(r => r.id !== id);
    this.saveSubjectiveFatigueRecords(current);
  },
  getGameResults(): StarCatcherResult[] { try { const raw = localStorage.getItem(STORAGE_KEY_GAMES); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; } },
  addGameResult(result: StarCatcherResult): void { const current = this.getGameResults(); writeLocalStorage(STORAGE_KEY_GAMES, [result, ...current.filter(item => item.id !== result.id)]); }
};
