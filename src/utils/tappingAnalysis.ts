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

  // Split the recording into three equal-duration segments. The metric names
  // are kept for backwards-compatible report data; in Demo they represent
  // shorter thirds of the real recording.
  const segmentDurationMs = totalDurationMs / 3;
  const first5sTaps = taps.filter(t => t.timeFromStart <= segmentDurationMs).length;
  const middle5sTaps = taps.filter(t => t.timeFromStart > segmentDurationMs && t.timeFromStart <= segmentDurationMs * 2).length;
  const last5sTaps = taps.filter(t => t.timeFromStart > segmentDurationMs * 2 && t.timeFromStart <= totalDurationMs).length;

  const segmentDurationSec = segmentDurationMs / 1000;
  const first5sRate = Number((first5sTaps / segmentDurationSec).toFixed(2));
  const middle5sRate = Number((middle5sTaps / segmentDurationSec).toFixed(2));
  const last5sRate = Number((last5sTaps / segmentDurationSec).toFixed(2));

  // Performance Decrement = ((first - last) / first) * 100%
  let performanceDecrement = 0;
  if (first5sRate > 0) {
    performanceDecrement = Number(Math.max(0, ((first5sRate - last5sRate) / first5sRate) * 100).toFixed(1));
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
