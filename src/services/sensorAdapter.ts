import { IMUDataPoint, SensorStatus } from '../types';

export interface ISensorAdapter {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  startStream(callback: (data: IMUDataPoint) => void): void;
  stopStream(): void;
  calibrate(): Promise<boolean>;
  getStatus(): SensorStatus;
  setFatigueMode(fatigued: boolean): void;
}

/**
 * Placeholder for future hardware connection (e.g. ESP32 via WebSerial, BLE, or WebSocket)
 */
export class RealHardwareSensorAdapter implements ISensorAdapter {
  private isStreaming: boolean = false;
  private status: SensorStatus = {
    connected: false,
    type: 'real',
    samplingRate: 50,
    packetsReceived: 0,
    latencyMs: 18,
    calibrated: false
  };

  async connect(): Promise<boolean> {
    console.info('[SensorAdapter] Hardware interface ready. Connect ESP32 via Serial/BLE.');
    this.status.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    this.stopStream();
    this.status.connected = false;
  }

  startStream(callback: (data: IMUDataPoint) => void): void {
    this.isStreaming = true;
    // When real ESP32 is attached, incoming packets trigger this callback
    console.log('[SensorAdapter] Real sensor stream started on callback.');
  }

  stopStream(): void {
    this.isStreaming = false;
  }

  async calibrate(): Promise<boolean> {
    this.status.calibrated = true;
    return true;
  }

  getStatus(): SensorStatus {
    return { ...this.status };
  }

  setFatigueMode(_fatigued: boolean): void {
    // Real hardware reads actual subject state
  }
}
