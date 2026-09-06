export interface IMUDataPoint {
  timestamp: number;
  ax: number; // in g
  ay: number; // in g
  az: number; // in g
  gx: number; // in deg/s
  gy: number; // in deg/s
  gz: number; // in deg/s
}

export interface SensorStatus {
  connected: boolean;
  type: 'real';
  samplingRate: number; // Hz, default 50
  packetsReceived: number;
  latencyMs: number;
  supported?: boolean;
  permission?: 'unknown' | 'granted' | 'denied' | 'unsupported';
}

export interface StabilityMetrics {
  motionRMS: number; // in g, e.g. 0.064
  dominantFrequency: number; // in Hz, e.g. 8.2
  totalPower0_12Hz: number;
  spectralEntropy: number; // 0 to 1, e.g. 0.51
  stabilityScore: number; // 0 to 100, e.g. 84
  spectrum: { freq: number; power: number }[];
  waveforms: IMUDataPoint[];
}

export interface TapRecord {
  timestamp: number;
  target: 'left' | 'right';
  interval: number; // ms since previous tap
  timeFromStart: number; // ms
}

export interface TappingMetrics {
  totalTaps: number;
  tapRate: number; // taps/s (Hz)
  meanITI: number; // ms
  rhythmCV: number; // % (coefficient of variation)
  first5sRate: number; // taps/s
  middle5sRate: number; // taps/s
  last5sRate: number; // taps/s
  performanceDecrement: number; // % decrease from first to last
  taps: TapRecord[];
}

export interface ReactionTrial {
  trialNumber: number;
  reactionTimeMs: number;
  isEarly: boolean;
}

export interface ReactionMetrics {
  trials: ReactionTrial[];
  meanReactionMs: number;
  medianReactionMs: number;
  bestReactionMs: number;
  worstReactionMs: number;
  missRate: number; // %
}

export interface Point2D {
  x: number;
  y: number;
  timestamp: number;
  pressure?: number;
}

export interface TracingMetrics {
  pathRMSE: number; // px, root mean square error from spiral
  meanSpeed: number; // px/s
  smoothness: number; // score 0-100
  pauseCount: number;
  pathInterruptions: number;
  userPoints: Point2D[];
  templatePoints: { x: number; y: number }[];
}

export interface AssessmentBatteryData {
  stability: StabilityMetrics;
  tapping: TappingMetrics;
  reaction: ReactionMetrics;
  tracing: TracingMetrics;
}

export interface FatigueDimensionScore {
  name: string;
  baseline: number;
  postFatigue: number;
  change: number; // percentage change or difference
  dimensionFatigueIndex: number; // 0 to 100 fatigue contribution
}

export interface AssessmentReportData {
  id: string;
  subjectId: string;
  timestamp: number;
  dateString: string;
  fatigueIndex: number; // 0-100
  fatigueLevel: 'Low' | 'Mild' | 'Moderate' | 'High';
  dimensions: {
    handStability: FatigueDimensionScore;
    reactionAbility: FatigueDimensionScore;
    motorEndurance: FatigueDimensionScore;
    fineMotorControl: FatigueDimensionScore;
  };
  baseline: AssessmentBatteryData;
  postFatigue: AssessmentBatteryData;
  challengeDurationSec: number;
  challengeTaps: number;
  subjectiveFatigue?: SubjectiveFatigueRecord; // Multidimensional experimental observation data (not used as calculation ground-truth)
}

export interface StarCatcherResult {
  score: number;
  combo: number;
  starsCollected: number;
  totalStars: number;
  hitRate: number;
  averageReactionMs: number;
  controlAccuracy: number;
  movementSmoothness: number;
  fineMotorScore: number;
  durationSec: number;
}

export type HandStabilityMetrics = StabilityMetrics;

export enum AssessmentStep {
  CALIBRATION = 'calibration',
  BASELINE_STABILITY = 'baseline-stability',
  BASELINE_TAPPING = 'baseline-tapping',
  BASELINE_REACTION = 'baseline-reaction',
  BASELINE_TRACING = 'baseline-tracing',
  FATIGUE_CHALLENGE = 'fatigue-challenge',
  POST_STABILITY = 'post-stability',
  POST_TAPPING = 'post-tapping',
  POST_REACTION = 'post-reaction',
  POST_TRACING = 'post-tracing',
  SUBJECTIVE_RATING = 'subjective-rating',
  REPORT = 'report'
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'participant' | 'researcher';
  participantCode: string;
  avatar: string;
  lastLogin: number;
}

export interface CloudSyncState {
  status: 'synced' | 'syncing' | 'pending' | 'offline';
  lastSyncTime: number | null;
  pendingChangesCount: number;
  cloudDeviceId: string;
}

export interface SubjectiveFatigueRecord {
  id: string;
  timestamp: number;
  rating: number; // 1 to 10
  level: 'optimal' | 'mild' | 'moderate' | 'high' | 'severe';
  sensations: string[];
  note?: string;
  linkedSessionId?: string;
}

export interface MotivationMessage {
  id: string;
  tier: 'optimal' | 'mild' | 'moderate' | 'high' | 'severe';
  title: string;
  message: string;
  subtext: string;
  category: 'comfort' | 'encouragement' | 'praise' | 'recovery_drill';
  recoveryAction: {
    actionTitle: string;
    drillDuration: string;
    steps: string[];
  };
  source: 'local_rule_engine' | 'llm_api';
}
