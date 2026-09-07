import { IMUCalibration, IMUDataPoint, StabilityMetrics } from '../types';

type StabilityOptions = { calibration?: IMUCalibration | null };

const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

function estimateGravity(data: IMUDataPoint[]) {
  return {
    ax: average(data.map(point => point.ax)),
    ay: average(data.map(point => point.ay)),
    az: average(data.map(point => point.az))
  };
}

function resampleSeries(data: IMUDataPoint[], values: number[]) {
  const points = data.map((point, index) => ({ timestamp: point.timestamp, value: values[index] }))
    .filter((point, index, all) => index === 0 || point.timestamp > all[index - 1].timestamp);
  if (points.length < 2) return { values, samplingRate: 0 };
  const intervals = points.slice(1).map((point, index) => point.timestamp - points[index].timestamp).filter(interval => interval > 0);
  const medianInterval = median(intervals);
  if (!medianInterval) return { values, samplingRate: 0 };

  const samplingRate = 1000 / medianInterval;
  const start = points[0].timestamp;
  const end = points[points.length - 1].timestamp;
  const result: number[] = [];
  let sourceIndex = 0;
  for (let timestamp = start; timestamp <= end; timestamp += medianInterval) {
    while (sourceIndex < points.length - 2 && points[sourceIndex + 1].timestamp < timestamp) sourceIndex += 1;
    const left = points[sourceIndex];
    const right = points[Math.min(sourceIndex + 1, points.length - 1)];
    const span = right.timestamp - left.timestamp;
    const ratio = span > 0 ? (timestamp - left.timestamp) / span : 0;
    result.push(left.value + (right.value - left.value) * Math.max(0, Math.min(1, ratio)));
  }
  return { values: result.length > 1 ? result : values, samplingRate };
}

/**
 * Computes stability features from every recorded hardware sample. The signal is
 * gravity-compensated with the measured calibration vector and resampled using
 * actual event timestamps before its frequency-domain calculation.
 */
export function analyzeHandStability(data: IMUDataPoint[], options: StabilityOptions = {}): StabilityMetrics {
  if (!data || data.length < 2) throw new Error('Physical IMU samples are required for stability analysis.');

  const gravity = options.calibration?.gravityVector || estimateGravity(data);
  const axes = {
    x: data.map(point => point.ax - gravity.ax),
    y: data.map(point => point.ay - gravity.ay),
    z: data.map(point => point.az - gravity.az)
  };
  const magnitudes = axes.x.map((dx, index) => Math.sqrt(dx * dx + axes.y[index] * axes.y[index] + axes.z[index] * axes.z[index]));
  const motionRMSRaw = Math.sqrt(average(magnitudes.map(value => value * value)));
  const resampledX = resampleSeries(data, axes.x);
  const resampledY = resampleSeries(data, axes.y);
  const resampledZ = resampleSeries(data, axes.z);
  const samplingRate = resampledX.samplingRate;
  const centeredAxes = [resampledX.values, resampledY.values, resampledZ.values]
    .map(values => values.map(value => value - average(values)));
  const N = Math.min(...centeredAxes.map(values => values.length));
  const frequencyStep = Math.max(0.1, Math.min(0.5, samplingRate > 0 ? samplingRate / N : 0.5));
  const spectrum: { freq: number; power: number }[] = [];
  let maxPower = -Infinity;
  let dominantFrequency = 0;
  let totalPower0_12Hz = 0;

  for (let frequency = frequencyStep; frequency <= 12; frequency += frequencyStep) {
    const power = centeredAxes.reduce((axisPower, axis) => {
      let re = 0;
      let im = 0;
      for (let index = 0; index < N; index += 1) {
        const phase = 2 * Math.PI * frequency * index / (samplingRate || 1);
        re += axis[index] * Math.cos(phase);
        im -= axis[index] * Math.sin(phase);
      }
      return axisPower + (re * re + im * im) / Math.max(1, N);
    }, 0);
    spectrum.push({ freq: Number(frequency.toFixed(3)), power: Number(power.toFixed(8)) });
    totalPower0_12Hz += power;
    if (power > maxPower) {
      maxPower = power;
      dominantFrequency = frequency;
    }
  }

  const normalizedPowers = totalPower0_12Hz > 0 ? spectrum.map(item => item.power / totalPower0_12Hz) : [];
  const entropy = normalizedPowers.reduce((sum, power) => power > 0 ? sum - power * Math.log2(power) : sum, 0);
  const spectralEntropyRaw = normalizedPowers.length > 1 ? entropy / Math.log2(normalizedPowers.length) : 0;
  const stabilityScoreRaw = 100 - (motionRMSRaw * 380 + spectralEntropyRaw * 15);

  return {
    motionRMS: Number(motionRMSRaw.toFixed(6)),
    motionRMSRaw,
    dominantFrequency: Number(dominantFrequency.toFixed(3)),
    totalPower0_12Hz: Number(totalPower0_12Hz.toFixed(8)),
    spectralEntropy: Number(spectralEntropyRaw.toFixed(6)),
    spectralEntropyRaw,
    stabilityScore: Math.round(Math.max(0, Math.min(100, stabilityScoreRaw))),
    stabilityScoreRaw,
    measuredSamplingRate: Number(samplingRate.toFixed(3)),
    spectrum,
    waveforms: data
  };
}
