import { AssessmentBatteryData, AssessmentReportData, CognitionMemoryResult, SubjectiveFatigueRecord } from '../types';

const point = (timestamp: number) => ({ timestamp, ax: 0, ay: 0, az: 1, gx: 0, gy: 0, gz: 0 });

const battery = (stabilityScore: number, tapRate: number, reactionMs: number, tracingRmse: number): AssessmentBatteryData => ({
  stability: { motionRMS: 0.03, motionRMSRaw: 0.03, dominantFrequency: 4.8, totalPower0_12Hz: 0.12, spectralEntropy: 0.46, spectralEntropyRaw: 0.46, stabilityScore, stabilityScoreRaw: stabilityScore, measuredSamplingRate: 50, spectrum: [], waveforms: [point(0)] },
  tapping: { totalTaps: Math.round(tapRate * 15), tapRate, meanITI: Math.round(1000 / tapRate), rhythmCV: 8.4, first5sRate: tapRate + 0.2, middle5sRate: tapRate, last5sRate: tapRate - 0.2, performanceDecrement: 7.1, taps: [] },
  reaction: { trials: [], meanReactionMs: reactionMs, medianReactionMs: reactionMs - 8, bestReactionMs: reactionMs - 51, worstReactionMs: reactionMs + 67, missRate: 0, lapseCount: 0, meanReciprocalReaction: Number((1 / reactionMs).toFixed(5)) },
  tracing: { pathRMSE: tracingRmse, meanSpeed: 145, smoothness: 82, pauseCount: 1, pathInterruptions: 0, userPoints: [], templatePoints: [] }
});

const report = (id: string, timestamp: number, dateString: string, fatigueIndex: number, stability: number, reaction: number, rating: number): AssessmentReportData => ({
  id, subjectId: 'DEMO-P-001', timestamp, dateString, fatigueIndex, fatigueLevel: fatigueIndex >= 50 ? 'Moderate' : 'Mild', challengeDurationSec: 30, challengeTaps: 124,
  dimensions: {
    handStability: { name: 'Hand stability', baseline: stability + 5, postFatigue: stability, change: -5, dimensionFatigueIndex: fatigueIndex - 4 },
    reactionAbility: { name: 'Reaction ability', baseline: reaction - 18, postFatigue: reaction, change: 8, dimensionFatigueIndex: fatigueIndex + 2 },
    motorEndurance: { name: 'Motor endurance', baseline: 86, postFatigue: 78, change: -9, dimensionFatigueIndex: fatigueIndex },
    fineMotorControl: { name: 'Fine motor control', baseline: 84, postFatigue: 79, change: -6, dimensionFatigueIndex: fatigueIndex - 3 }
  },
  baseline: battery(stability + 5, 4.8, reaction - 18, 13.2), postFatigue: battery(stability, 4.4, reaction, 16.1),
  subjectiveFatigue: { id: `DEMO-SUBJECTIVE-${id}`, timestamp, rating, level: rating >= 6 ? 'moderate' : 'mild', sensations: rating >= 6 ? ['eye_strain', 'slower_response'] : ['slight_tiredness'], note: '静态演示示例数据', linkedSessionId: id }
});

export const DEMO_SESSIONS: AssessmentReportData[] = [
  report('DEMO-HISTORY-003', Date.UTC(2026, 8, 6, 9, 30), '2026-09-06', 48, 78, 298, 6),
  report('DEMO-HISTORY-002', Date.UTC(2026, 8, 3, 14, 10), '2026-09-03', 41, 82, 276, 5),
  report('DEMO-HISTORY-001', Date.UTC(2026, 7, 30, 10, 0), '2026-08-30', 35, 86, 254, 4)
];

export const DEMO_SUBJECTIVE_RECORDS: SubjectiveFatigueRecord[] = DEMO_SESSIONS.map(session => session.subjectiveFatigue!).filter(Boolean);

export const DEMO_COGNITION_RESULTS: CognitionMemoryResult[] = [
  { id: 'DEMO-COGNITION-002', schemaVersion: 2, taskVersion: 'spatial-memory-matching-4x4-v1', timestamp: '2026-09-06T09:42:00.000Z', startedAt: Date.UTC(2026, 8, 6, 9, 37), completedAt: Date.UTC(2026, 8, 6, 9, 42), totalDuration: 300000, totalPairs: 8, totalAttempts: 12, correctAttempts: 8, incorrectAttempts: 4, mismatchCount: 4, accuracy: 0.667, movesPerPair: 1.5, meanResponseTime: 1480, medianResponseTime: 1410, fastestResponseTime: 890, slowestResponseTime: 2310, firstHalfAccuracy: 0.75, secondHalfAccuracy: 0.6, firstHalfErrorRate: 0.25, secondHalfErrorRate: 0.4, firstHalfMeanRT: 1390, secondHalfMeanRT: 1570, reactionTimeChange: 180, errorRateChange: 0.15, memoryScore: 67, responseSpeedScoreRaw: 71, responseSpeedScore: 71, cognitiveStabilityScoreRaw: 64, cognitiveStabilityScore: 64, interactions: [], attempts: [] },
  { id: 'DEMO-COGNITION-001', schemaVersion: 2, taskVersion: 'spatial-memory-matching-4x4-v1', timestamp: '2026-09-03T14:19:00.000Z', startedAt: Date.UTC(2026, 8, 3, 14, 14), completedAt: Date.UTC(2026, 8, 3, 14, 19), totalDuration: 280000, totalPairs: 8, totalAttempts: 10, correctAttempts: 8, incorrectAttempts: 2, mismatchCount: 2, accuracy: 0.8, movesPerPair: 1.25, meanResponseTime: 1310, medianResponseTime: 1260, fastestResponseTime: 820, slowestResponseTime: 1980, firstHalfAccuracy: 0.8, secondHalfAccuracy: 0.8, firstHalfErrorRate: 0.2, secondHalfErrorRate: 0.2, firstHalfMeanRT: 1270, secondHalfMeanRT: 1350, reactionTimeChange: 80, errorRateChange: 0, memoryScore: 80, responseSpeedScoreRaw: 77, responseSpeedScore: 77, cognitiveStabilityScoreRaw: 78, cognitiveStabilityScore: 78, interactions: [], attempts: [] }
];
