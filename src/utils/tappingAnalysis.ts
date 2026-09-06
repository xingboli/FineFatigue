import { TapRecord, TappingMetrics } from '../types';

/**
 * Computes tap rate, inter-tap intervals, rhythm CV, and segmented performance decrement.
 */
export function analyzeTapping(taps: TapRecord[], totalDurationMs: number = 15000): TappingMetrics {
  if (!taps || taps.length < 2) throw new Error('At least two recorded taps are required for tapping analysis.');

  const durationSec = totalDurationMs / 1000;
  const totalTaps = taps.length;
  const tapRate = Number((totalTaps / durationSec).toFixed(2));

  // Extract valid intervals (skipping first tap interval = 0)
  const intervals = taps.slice(1).map(t => t.interval).filter(i => i > 40 && i < 2000);

  let meanITI = 0;
  let rhythmCV = 0;

  if (intervals.length > 0) {
    const sum = intervals.reduce((a, b) => a + b, 0);
    meanITI = Math.round(sum / intervals.length);

    // Standard deviation
    const variance = intervals.reduce((acc, val) => acc + Math.pow(val - meanITI, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    // CV in percent
    rhythmCV = Number(((stdDev / (meanITI || 1)) * 100).toFixed(1));
  }

  // Segment analysis: First 5s, Middle 5s, Last 5s
  const first5sTaps = taps.filter(t => t.timeFromStart <= 5000).length;
  const middle5sTaps = taps.filter(t => t.timeFromStart > 5000 && t.timeFromStart <= 10000).length;
  const last5sTaps = taps.filter(t => t.timeFromStart > 10000 && t.timeFromStart <= 15000).length;

  const first5sRate = Number((first5sTaps / 5).toFixed(2));
  const middle5sRate = Number((middle5sTaps / 5).toFixed(2));
  const last5sRate = Number((last5sTaps / 5).toFixed(2));

  // Performance Decrement = ((first - last) / first) * 100%
  let performanceDecrement = 0;
  if (first5sRate > 0) {
    performanceDecrement = Number((((first5sRate - last5sRate) / first5sRate) * 100).toFixed(1));
  }

  return {
    totalTaps,
    tapRate,
    meanITI,
    rhythmCV,
    first5sRate,
    middle5sRate,
    last5sRate,
    performanceDecrement,
    taps
  };
}
