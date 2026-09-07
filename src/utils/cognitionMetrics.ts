import { CognitionMemoryResult, MemoryAttempt, MemoryInteractionEvent } from '../types';

const clamp = (value: number, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, value));
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

function halfMetrics(attempts: MemoryAttempt[]) {
  const total = attempts.length;
  const correct = attempts.filter(attempt => attempt.matched).length;
  const responses = attempts.map(attempt => attempt.responseTimeMs).filter(Number.isFinite);
  return {
    accuracy: total ? correct / total : 0,
    errorRate: total ? (total - correct) / total : 0,
    meanResponseTime: average(responses)
  };
}

export function calculateCognitionMemoryResult(
  startedAt: number,
  completedAt: number,
  totalPairs: number,
  attempts: MemoryAttempt[],
  interactions: MemoryInteractionEvent[]
): CognitionMemoryResult {
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter(attempt => attempt.matched).length;
  const incorrectAttempts = totalAttempts - correctAttempts;
  const responseTimes = attempts.map(attempt => attempt.responseTimeMs).filter(Number.isFinite);
  const splitIndex = Math.max(1, Math.ceil(totalAttempts / 2));
  const firstHalf = halfMetrics(attempts.slice(0, splitIndex));
  const secondHalf = halfMetrics(attempts.slice(splitIndex));
  const reactionTimeChange = firstHalf.meanResponseTime > 0 && secondHalf.meanResponseTime > 0
    ? (secondHalf.meanResponseTime - firstHalf.meanResponseTime) / firstHalf.meanResponseTime
    : 0;
  const errorRateChange = secondHalf.errorRate - firstHalf.errorRate;
  const accuracy = totalAttempts ? correctAttempts / totalAttempts : 0;
  const meanResponseTime = average(responseTimes);
  const memoryScore = Math.round(accuracy * 100);
  const responseSpeedScore = Math.round(clamp(100 - meanResponseTime / 30));
  const stabilityPenalty = Math.max(0, reactionTimeChange) * 50 + Math.max(0, errorRateChange) * 100;

  return {
    id: `COG-${completedAt.toString(36).toUpperCase()}`,
    timestamp: new Date(completedAt).toISOString(),
    completedAt,
    totalDuration: Math.max(0, completedAt - startedAt),
    totalPairs,
    totalAttempts,
    correctAttempts,
    incorrectAttempts,
    mismatchCount: incorrectAttempts,
    accuracy,
    movesPerPair: totalPairs ? totalAttempts / totalPairs : 0,
    meanResponseTime,
    medianResponseTime: median(responseTimes),
    fastestResponseTime: responseTimes.length ? Math.min(...responseTimes) : 0,
    slowestResponseTime: responseTimes.length ? Math.max(...responseTimes) : 0,
    firstHalfAccuracy: firstHalf.accuracy,
    secondHalfAccuracy: secondHalf.accuracy,
    firstHalfErrorRate: firstHalf.errorRate,
    secondHalfErrorRate: secondHalf.errorRate,
    firstHalfMeanRT: firstHalf.meanResponseTime,
    secondHalfMeanRT: secondHalf.meanResponseTime,
    reactionTimeChange,
    errorRateChange,
    memoryScore,
    responseSpeedScore,
    cognitiveStabilityScore: Math.round(clamp(100 - stabilityPenalty)),
    interactions,
    attempts
  };
}

export function cognitionSummary(result: CognitionMemoryResult, locale: 'zh' | 'en'): string {
  const slower = result.reactionTimeChange > 0.15;
  const moreErrors = result.errorRateChange > 0.1;
  if (locale === 'zh') {
    if (slower && moreErrors) return '本次准确率较高，但后半程响应时间和错误率均上升，提示持续任务中的表现稳定性有所下降。';
    if (slower) return '本次配对准确率保持稳定，但后半程平均响应时间增加；该结果仅反映本次任务表现。';
    if (moreErrors) return '本次后半程错误率有所增加；该结果仅反映本次任务表现。';
    return '本次前后半程的响应速度和准确率较稳定；该结果仅反映本次任务表现。';
  }
  if (slower && moreErrors) return 'Accuracy was solid, but both response time and error rate rose in the second half, indicating lower within-task stability.';
  if (slower) return 'Accuracy remained stable, while the second-half response time increased. This reflects this task only.';
  if (moreErrors) return 'The second-half error rate increased. This reflects this task only.';
  return 'Response speed and accuracy were stable across both halves. This reflects this task only.';
}
