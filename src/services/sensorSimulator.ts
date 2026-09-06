import { IMUDataPoint, SensorStatus } from '../types';
import { ISensorAdapter, RealHardwareSensorAdapter } from './sensorAdapter';

export class SensorSimulator implements ISensorAdapter {
  private timer: number | null = null;
  private isStreaming: boolean = false;
  private listeners: ((data: IMUDataPoint) => void)[] = [];
  private packetCount: number = 0;
  private startTime: number = Date.now();
  private isFatigued: boolean = false;
  private calibrated: boolean = true;
  private samplingRate: number = 50; // 50 Hz = 20ms per packet
  private mode: 'simulator' | 'real' = 'simulator';

  // State variables for continuous waveform synthesis
  private phaseX: number = 0;
  private phaseY: number = 0;
  private phaseZ: number = 0;

  async connect(): Promise<boolean> {
    this.startTime = Date.now();
    return true;
  }

  async disconnect(): Promise<void> {
    this.stopStream();
  }

  setFatigueMode(fatigued: boolean): void {
    this.isFatigued = fatigued;
  }

  setFatigueFactor(factor: number): void {
    this.isFatigued = factor > 0.3;
  }

  setMode(mode: 'simulator' | 'real'): void {
    this.mode = mode;
  }

  getMode(): 'simulator' | 'real' {
    return this.mode;
  }

  getSensorType(): 'simulator' | 'real' {
    return this.mode;
  }

  getSamplingRate(): number {
    return this.samplingRate;
  }

  isConnected(): boolean {
    return this.isStreaming;
  }

  start(): void {
    this.startStream(() => {});
  }

  stop(): void {
    this.stopStream();
  }

  subscribe(callback: (data: IMUDataPoint) => void): () => void {
    this.startStream(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  startStream(callback: (data: IMUDataPoint) => void): void {
    if (!this.listeners.includes(callback)) {
      this.listeners.push(callback);
    }

    if (this.isStreaming) return;
    this.isStreaming = true;

    const intervalMs = Math.round(1000 / this.samplingRate);

    this.timer = window.setInterval(() => {
      this.packetCount++;
      const now = Date.now();
      const t = (now - this.startTime) / 1000;

      // Physiological frequency components: 8-10 Hz micro-motion band
      const baseFreq = this.isFatigued ? 9.6 : 8.2;
      const noiseAmp = this.isFatigued ? 0.048 : 0.016;
      const slowDrift = Math.sin(t * 0.4) * (this.isFatigued ? 0.03 : 0.01);

      this.phaseX += (baseFreq * 2 * Math.PI) / this.samplingRate;
      this.phaseY += ((baseFreq + 0.5) * 2 * Math.PI) / this.samplingRate;
      this.phaseZ += ((baseFreq - 0.3) * 2 * Math.PI) / this.samplingRate;

      // Accelerometer (g)
      const ax = Number((
        Math.sin(this.phaseX) * noiseAmp +
        (Math.random() - 0.5) * noiseAmp * 0.8 +
        slowDrift
      ).toFixed(4));

      const ay = Number((
        Math.cos(this.phaseY) * noiseAmp * 0.9 +
        (Math.random() - 0.5) * noiseAmp * 0.8 +
        slowDrift * 0.8
      ).toFixed(4));

      // az rests at 1.0g gravity with slight jitter
      const az = Number((
        1.0 +
        Math.sin(this.phaseZ) * noiseAmp * 0.6 +
        (Math.random() - 0.5) * noiseAmp * 0.5
      ).toFixed(4));

      // Gyroscope (deg/s)
      const gyroScale = this.isFatigued ? 8.5 : 2.8;
      const gx = Number((Math.sin(this.phaseY * 0.8) * gyroScale + (Math.random() - 0.5) * gyroScale * 0.7).toFixed(2));
      const gy = Number((Math.cos(this.phaseX * 0.8) * gyroScale + (Math.random() - 0.5) * gyroScale * 0.7).toFixed(2));
      const gz = Number((Math.sin(this.phaseZ * 0.6) * (gyroScale * 0.6) + (Math.random() - 0.5) * gyroScale * 0.5).toFixed(2));

      const point: IMUDataPoint = {
        timestamp: now,
        ax,
        ay,
        az,
        gx,
        gy,
        gz
      };

      for (const listener of this.listeners) {
        listener(point);
      }
    }, intervalMs);
  }

  stopStream(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isStreaming = false;
  }

  async calibrate(): Promise<boolean> {
    this.calibrated = false;
    await new Promise(resolve => setTimeout(resolve, 3000));
    this.calibrated = true;
    return true;
  }

  getStatus(): SensorStatus {
    return {
      connected: true,
      type: this.mode,
      samplingRate: this.samplingRate,
      packetsReceived: this.packetCount,
      latencyMs: this.mode === 'simulator' ? 2 : 16,
      calibrated: this.calibrated
    };
  }
}

// Global sensor manager singleton
let activeSensorInstance: SensorSimulator | null = null;
const realSensorInstance = new RealHardwareSensorAdapter();

export function getSensorService(): SensorSimulator {
  if (!activeSensorInstance) {
    activeSensorInstance = new SensorSimulator();
    activeSensorInstance.connect();
  }
  return activeSensorInstance;
}

export function getRealSensorService(): RealHardwareSensorAdapter {
  return realSensorInstance;
}
