import { Point2D, TracingMetrics } from '../types';

/**
 * Generates Archimedean Spiral template points: r = a + b * theta
 */
export function generateSpiralTemplate(
  centerX: number,
  centerY: number,
  maxRadius: number = 140,
  turns: number = 3.5,
  pointCount: number = 300
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const maxTheta = turns * 2 * Math.PI;
  const b = maxRadius / maxTheta;
  const a = 12;

  for (let i = 0; i <= pointCount; i++) {
    const theta = (i / pointCount) * maxTheta;
    const r = a + b * theta;
    const x = centerX + r * Math.cos(theta);
    const y = centerY + r * Math.sin(theta);
    points.push({ x, y });
  }

  return points;
}

/**
 * Calculates Path RMSE, Mean Drawing Speed, Smoothness score, Pauses, and Path Interruptions.
 */
export function analyzeTracing(
  userPoints: Point2D[],
  templatePoints: { x: number; y: number }[],
  isPostFatigue: boolean = false
): TracingMetrics {
  if (!userPoints || userPoints.length < 10 || !templatePoints || templatePoints.length < 10) throw new Error('Recorded tracing points are required for tracing analysis.');

  // 1. Calculate Path RMSE against template points
  let totalSqDistance = 0;
  for (const up of userPoints) {
    let minDistSq = Infinity;
    // Find closest template point
    for (let j = 0; j < templatePoints.length; j += 2) {
      const tp = templatePoints[j];
      const dx = up.x - tp.x;
      const dy = up.y - tp.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq) {
        minDistSq = distSq;
      }
    }
    totalSqDistance += minDistSq;
  }
  const rawRMSE = Math.sqrt(totalSqDistance / userPoints.length);
  const pathRMSE = Number(Math.max(3.0, Math.min(30.0, rawRMSE)).toFixed(1));

  // 2. Mean Drawing Speed & Pauses
  let totalDistance = 0;
  let pauseCount = 0;
  let pathInterruptions = 0;
  const speeds: number[] = [];

  for (let i = 1; i < userPoints.length; i++) {
    const p1 = userPoints[i - 1];
    const p2 = userPoints[i];
    const dt = (p2.timestamp - p1.timestamp) / 1000; // seconds
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dt > 0.3 && dist > 15) {
      pathInterruptions++;
    } else if (dt > 0.2 && dist < 3) {
      pauseCount++;
    }

    if (dt > 0.005) {
      const speed = dist / dt;
      speeds.push(speed);
      totalDistance += dist;
    }
  }

  const durationSec = Math.max(1, (userPoints[userPoints.length - 1].timestamp - userPoints[0].timestamp) / 1000);
  const meanSpeed = Math.round(totalDistance / durationSec);

  // 3. Smoothness (Spectral arc length / velocity variation)
  // Higher velocity variance / jerky acceleration lowers smoothness
  let velocityJerk = 0;
  for (let i = 1; i < speeds.length; i++) {
    velocityJerk += Math.abs(speeds[i] - speeds[i - 1]);
  }
  const avgJerk = speeds.length > 0 ? velocityJerk / speeds.length : 10;
  let smoothness = Math.round(100 - (avgJerk * 0.25 + pathRMSE * 2.2));
  smoothness = Math.max(35, Math.min(96, smoothness));

  return {
    pathRMSE,
    meanSpeed: Math.max(40, meanSpeed),
    smoothness,
    pauseCount: Math.min(12, pauseCount),
    pathInterruptions: Math.min(8, pathInterruptions),
    userPoints,
    templatePoints
  };
}
