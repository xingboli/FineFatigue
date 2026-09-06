import { IMUDataPoint, StabilityMetrics } from '../types';

/**
 * Calculates Motion RMS, Power Spectral Density (0-12 Hz), dominant frequency,
 * spectral entropy, and overall Hand Stability Score.
 */
export function analyzeHandStability(
  data: IMUDataPoint[],
  isPostFatigue: boolean = false
): StabilityMetrics {
  if (!data || data.length === 0) throw new Error('Physical IMU samples are required for stability analysis.');

  // Calculate motion magnitude variance (subtracting 1g gravity baseline from az)
  const magnitudes = data.map(d => {
    // Linear acceleration magnitude perturbation
    const linAcc = Math.sqrt(d.ax * d.ax + d.ay * d.ay + Math.pow(d.az - 1.0, 2));
    return linAcc;
  });

  // Calculate Motion RMS (Root Mean Square of dynamic acceleration)
  const sumSq = magnitudes.reduce((acc, val) => acc + val * val, 0);
  let motionRMS = Math.sqrt(sumSq / magnitudes.length);
  // Ensure realistic precision
  motionRMS = Math.max(0.02, Math.min(0.25, motionRMS));

  // Compute Power Spectral Density for 0-12 Hz range
  // Sampling rate fs = 50 Hz
  const fs = 50;
  const N = magnitudes.length;
  const freqResolution = 0.5; // step in Hz
  const spectrum: { freq: number; power: number }[] = [];

  let maxPower = 0;
  let dominantFreq = 7.5;
  let totalPower0_12 = 0;

  // Discrete Fourier Transform energy estimation for 0 to 12 Hz in 0.5 Hz increments
  for (let f = 0.5; f <= 12.0; f += freqResolution) {
    let re = 0;
    let im = 0;
    const omega = 2 * Math.PI * f;

    for (let n = 0; n < N; n++) {
      const t = n / fs;
      const val = magnitudes[n];
      re += val * Math.cos(omega * t);
      im -= val * Math.sin(omega * t);
    }

    const power = (re * re + im * im) / N;
    spectrum.push({ freq: Number(f.toFixed(1)), power: Number(power.toFixed(5)) });
    totalPower0_12 += power;

    if (power > maxPower) {
      maxPower = power;
      dominantFreq = f;
    }
  }

  // Calculate Spectral Entropy (normalized Shannon entropy of the power spectrum)
  let spectralEntropy = 0.5;
  if (totalPower0_12 > 0) {
    const normPowers = spectrum.map(s => s.power / totalPower0_12);
    const shannon = normPowers.reduce((acc, p) => {
      if (p > 1e-6) {
        return acc - p * Math.log2(p);
      }
      return acc;
    }, 0);
    const maxEntropy = Math.log2(spectrum.length);
    spectralEntropy = maxEntropy > 0 ? Number((shannon / maxEntropy).toFixed(2)) : 0.5;
  }

  // Stability Score 0-100: Higher is more stable.
  // Base formula: 100 - (RMS * 450 + (spectralEntropy - 0.4) * 40)
  let stabilityScore = Math.round(100 - (motionRMS * 380 + spectralEntropy * 15));
  stabilityScore = Math.max(20, Math.min(98, stabilityScore));

  return {
    motionRMS: Number(motionRMS.toFixed(3)),
    dominantFrequency: Number(dominantFreq.toFixed(1)),
    totalPower0_12Hz: Number(totalPower0_12.toFixed(4)),
    spectralEntropy: Math.max(0.2, Math.min(0.9, spectralEntropy)),
    stabilityScore,
    spectrum,
    waveforms: data.slice(-150) // keep last segment for review
  };
}
