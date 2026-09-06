import { IMUDataPoint, SensorStatus } from '../types';

export interface ISensorAdapter {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  startStream(callback: (data: IMUDataPoint) => void): void;
  stopStream(): void;
  getStatus(): SensorStatus;
}

type MotionPermissionEvent = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

/**
 * Reads a phone/tablet's physical IMU through the browser DeviceMotion API.
 * It intentionally has no synthetic fallback: no event means no measurement.
 */
export class RealHardwareSensorAdapter implements ISensorAdapter {
  private listeners = new Set<(data: IMUDataPoint) => void>();
  private listening = false;
  private lastTimestamp = 0;
  private status: SensorStatus = {
    connected: false,
    type: 'real',
    samplingRate: 0,
    packetsReceived: 0,
    latencyMs: 0,
    supported: typeof window !== 'undefined' && typeof DeviceMotionEvent !== 'undefined',
    permission: typeof window !== 'undefined' && typeof DeviceMotionEvent !== 'undefined' ? 'unknown' : 'unsupported'
  };

  async connect(): Promise<boolean> {
    if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined') {
      this.status = { ...this.status, supported: false, permission: 'unsupported', connected: false };
      return false;
    }

    const motionEvent = DeviceMotionEvent as MotionPermissionEvent;
    if (motionEvent.requestPermission) {
      const permission = await motionEvent.requestPermission();
      if (permission !== 'granted') {
        this.status = { ...this.status, supported: true, permission: 'denied', connected: false };
        return false;
      }
    }

    this.status = { ...this.status, supported: true, permission: 'granted' };
    this.ensureListener();
    return true;
  }

  async disconnect(): Promise<void> {
    this.stopStream();
    this.status = { ...this.status, connected: false };
  }

  startStream(callback: (data: IMUDataPoint) => void): void {
    this.listeners.add(callback);
    if (this.status.permission === 'granted') this.ensureListener();
  }

  subscribe(callback: (data: IMUDataPoint) => void): () => void {
    this.startStream(callback);
    return () => this.listeners.delete(callback);
  }

  stopStream(): void {
    if (this.listening) window.removeEventListener('devicemotion', this.handleMotion);
    this.listening = false;
    this.status = { ...this.status, connected: false };
  }

  getStatus(): SensorStatus {
    return { ...this.status };
  }

  private ensureListener(): void {
    if (this.listening || typeof window === 'undefined') return;
    window.addEventListener('devicemotion', this.handleMotion, { passive: true });
    this.listening = true;
  }

  private handleMotion = (event: DeviceMotionEvent): void => {
    const acceleration = event.accelerationIncludingGravity || event.acceleration;
    if (acceleration?.x == null || acceleration.y == null || acceleration.z == null) return;

    const now = Date.now();
    const interval = this.lastTimestamp ? now - this.lastTimestamp : 0;
    this.lastTimestamp = now;
    const rotation = event.rotationRate;
    const point: IMUDataPoint = {
      timestamp: now,
      // DeviceMotion acceleration is m/s²; convert to g for the analysis pipeline.
      ax: acceleration.x / 9.80665,
      ay: acceleration.y / 9.80665,
      az: acceleration.z / 9.80665,
      gx: rotation?.alpha ?? 0,
      gy: rotation?.beta ?? 0,
      gz: rotation?.gamma ?? 0
    };

    const estimatedRate = interval > 0 ? Math.round(1000 / interval) : this.status.samplingRate;
    this.status = {
      ...this.status,
      connected: true,
      samplingRate: estimatedRate || 0,
      packetsReceived: this.status.packetsReceived + 1,
      latencyMs: 0,
      permission: 'granted'
    };
    this.listeners.forEach(listener => listener(point));
  };
}
