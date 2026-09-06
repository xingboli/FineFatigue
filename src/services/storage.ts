import { AssessmentReportData, SubjectiveFatigueRecord } from '../types';
import { createDefaultStabilityMetrics } from '../utils/signalProcessing';
import { createDefaultTappingMetrics } from '../utils/tappingAnalysis';
import { createDefaultTracingMetrics } from '../utils/tracingAnalysis';

const STORAGE_KEY_SESSIONS = 'finefatigue_sessions_v1';
const STORAGE_KEY_SETTINGS = 'finefatigue_settings_v1';
const STORAGE_KEY_ACTIVE_REPORT = 'finefatigue_active_report_v1';
const STORAGE_KEY_SUBJECTIVE = 'finefatigue_subjective_v1';

export interface AppSettings {
  subjectId: string;
  sensorMode: 'simulator' | 'real';
  samplingRate: number;
  autoSkipCountdown: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  subjectId: 'Subject 001',
  sensorMode: 'simulator',
  samplingRate: 50,
  autoSkipCountdown: false
};

/**
 * Creates a realistic pre-populated example session for dashboard demonstration
 */
export function generateExampleSession(
  subjectId: string = 'Subject 001',
  fatigueIndex: number = 64,
  level: 'Moderate' | 'Mild' = 'Moderate',
  dateLabel: string = 'Today 14:32'
): AssessmentReportData {
  const baseStability = createDefaultStabilityMetrics(false);
  const postStability = createDefaultStabilityMetrics(true);

  const baseTapping = createDefaultTappingMetrics(false);
  const postTapping = createDefaultTappingMetrics(true);

  const baseTracing = createDefaultTracingMetrics(false);
  const postTracing = createDefaultTracingMetrics(true);

  const baseReaction = {
    trials: [
      { trialNumber: 1, reactionTimeMs: 292, isEarly: false },
      { trialNumber: 2, reactionTimeMs: 278, isEarly: false },
      { trialNumber: 3, reactionTimeMs: 265, isEarly: false },
      { trialNumber: 4, reactionTimeMs: 310, isEarly: false },
      { trialNumber: 5, reactionTimeMs: 284, isEarly: false },
      { trialNumber: 6, reactionTimeMs: 242, isEarly: false },
      { trialNumber: 7, reactionTimeMs: 270, isEarly: false },
      { trialNumber: 8, reactionTimeMs: 326, isEarly: false }
    ],
    meanReactionMs: 283,
    medianReactionMs: 284,
    bestReactionMs: 242,
    worstReactionMs: 326,
    missRate: 0
  };

  const postReaction = {
    trials: [
      { trialNumber: 1, reactionTimeMs: 320, isEarly: false },
      { trialNumber: 2, reactionTimeMs: 345, isEarly: false },
      { trialNumber: 3, reactionTimeMs: 362, isEarly: false },
      { trialNumber: 4, reactionTimeMs: 318, isEarly: false },
      { trialNumber: 5, reactionTimeMs: 375, isEarly: false },
      { trialNumber: 6, reactionTimeMs: 337, isEarly: false },
      { trialNumber: 7, reactionTimeMs: 350, isEarly: false },
      { trialNumber: 8, reactionTimeMs: 388, isEarly: false }
    ],
    meanReactionMs: 349,
    medianReactionMs: 337,
    bestReactionMs: 318,
    worstReactionMs: 388,
    missRate: 0
  };

  return {
    id: `SES-${subjectId.replace(/\s+/g, '')}-${Date.now().toString(36).toUpperCase()}`,
    subjectId,
    timestamp: Date.now() - (level === 'Moderate' ? 1000 * 60 * 45 : 1000 * 60 * 60 * 24),
    dateString: dateLabel,
    fatigueIndex,
    fatigueLevel: level,
    dimensions: {
      handStability: {
        name: 'Hand Stability',
        baseline: 78,
        postFatigue: 61,
        change: -21.8,
        dimensionFatigueIndex: 68
      },
      reactionAbility: {
        name: 'Reaction Ability',
        baseline: 82,
        postFatigue: 69,
        change: +18.7,
        dimensionFatigueIndex: 58
      },
      motorEndurance: {
        name: 'Motor Endurance',
        baseline: 88,
        postFatigue: 59,
        change: -15.9,
        dimensionFatigueIndex: 72
      },
      fineMotorControl: {
        name: 'Fine Motor Control',
        baseline: 85,
        postFatigue: 70,
        change: -17.6,
        dimensionFatigueIndex: 60
      }
    },
    baseline: {
      stability: baseStability,
      tapping: baseTapping,
      reaction: baseReaction,
      tracing: baseTracing
    },
    postFatigue: {
      stability: postStability,
      tapping: postTapping,
      reaction: postReaction,
      tracing: postTracing
    },
    challengeDurationSec: 30,
    challengeTaps: 138
  };
}

export const StorageService = {
  getSessions(): AssessmentReportData[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse sessions from localStorage', e);
    }

    // Auto-seed if empty
    const seedSessions: AssessmentReportData[] = [
      generateExampleSession('Subject 001', 64, 'Moderate', 'Today 14:32'),
      generateExampleSession('Subject 002', 41, 'Mild', 'Yesterday 10:15')
    ];
    this.saveSessions(seedSessions);
    return seedSessions;
  },

  saveSessions(sessions: AssessmentReportData[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions', e);
    }
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
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_REPORT, JSON.stringify(report));
    } catch (e) {
      console.error('Failed to set active report', e);
    }
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
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  },

  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEY_SESSIONS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_REPORT);
    localStorage.removeItem(STORAGE_KEY_SUBJECTIVE);
    this.getSessions(); // will re-seed defaults
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
    // Seed default records aligned with demo sessions
    const now = Date.now();
    const defaults: SubjectiveFatigueRecord[] = [
      {
        id: 'SUBJ-001',
        timestamp: now - 1000 * 60 * 45,
        rating: 6,
        level: 'moderate',
        sensations: ['手指轻微酸胀', '连续敲击节奏微缓'],
        note: '30秒高频负荷测试后记录'
      },
      {
        id: 'SUBJ-002',
        timestamp: now - 1000 * 60 * 60 * 24,
        rating: 3,
        level: 'mild',
        sensations: ['状态稳定', '无明显酸痛'],
        note: '晨间基准测试前记录'
      },
      {
        id: 'SUBJ-003',
        timestamp: now - 1000 * 60 * 60 * 48,
        rating: 7,
        level: 'high',
        sensations: ['手指酸胀明显', '反应变慢'],
        note: '连续打字实验后记录'
      }
    ];
    this.saveSubjectiveFatigueRecords(defaults);
    return defaults;
  },

  saveSubjectiveFatigueRecords(records: SubjectiveFatigueRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_SUBJECTIVE, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save subjective fatigue records', e);
    }
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
  }
};

