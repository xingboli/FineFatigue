import React, { useState, useEffect } from 'react';
import { CheckCircle2, RefreshCw, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { IMUDataPoint, SensorStatus } from '../../types';
import { WaveformCanvas } from '../charts/WaveformCanvas';
import { getSensorService } from '../../services/sensorSimulator';
import { useI18n } from '../../i18n/context';

interface CalibrationStepProps {
  sensorStatus?: SensorStatus;
  currentData?: IMUDataPoint | null;
  onCalibrationComplete?: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
}

export const CalibrationStep: React.FC<CalibrationStepProps> = ({
  sensorStatus: propSensorStatus,
  currentData: propCurrentData,
  onCalibrationComplete,
  onComplete,
  onSkip
}) => {
  const { locale } = useI18n();
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);

  // Fallback sensor live stream if not passed via props
  const [liveData, setLiveData] = useState<IMUDataPoint | null>(propCurrentData || null);
  const [liveStatus, setLiveStatus] = useState<SensorStatus>(
    propSensorStatus || { isConnected: true, samplingRate: 100, packetLoss: 0, batteryLevel: 96 }
  );

  useEffect(() => {
    if (propCurrentData !== undefined) return;
    const sensor = getSensorService();
    const unsub = sensor.subscribe((data) => {
      setLiveData(data);
      setLiveStatus(sensor.getStatus());
    });
    return () => unsub();
  }, [propCurrentData]);

  const currentData = propCurrentData !== undefined ? propCurrentData : liveData;
  const sensorStatus = propSensorStatus || liveStatus;

  const handleFinish = () => {
    if (onComplete) onComplete();
    else if (onCalibrationComplete) onCalibrationComplete();
  };

  const startCalibration = () => {
    setIsCalibrating(true);
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 1) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 1) {
      const timer = setTimeout(() => {
        setCountdown(0);
        setIsCalibrating(false);
        setIsCalibrated(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider font-mono">
              {locale === 'zh' ? '阶段 0 · 传感器校准与就绪' : 'Phase 1 · Sensor Preparation'}
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {locale === 'zh' ? '传感器调零校准与信号验证' : 'Sensor Calibration & Signal Validation'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {locale === 'zh' 
                ? '将 IMU 运动传感器置于平稳表面或佩戴于手背自然平放。在开始基准测试前确认实时信号流与重力矢量校准。'
                : 'Place the IMU motion sensor on a stable surface or rest your hand naturally. Verify real-time signal streams before baseline acquisition.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                {locale === 'zh' ? '跳过至基准测试' : 'Skip to Baseline'}
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono">{locale === 'zh' ? 'IMU 链路' : 'IMU Link'}</div>
            <div className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {locale === 'zh' ? '已连接' : 'Connected'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono">{locale === 'zh' ? '加速度计' : 'Accelerometer'}</div>
            <div className="text-sm font-semibold text-cyan-700 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
              {locale === 'zh' ? '三轴活跃' : 'Active (3-Axis)'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono">{locale === 'zh' ? '陀螺仪' : 'Gyroscope'}</div>
            <div className="text-sm font-semibold text-indigo-700 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              {locale === 'zh' ? '三轴活跃' : 'Active (3-Axis)'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono">{locale === 'zh' ? '采样率' : 'Sampling Rate'}</div>
            <div className="text-sm font-semibold text-slate-800 font-mono mt-0.5">
              {sensorStatus.samplingRate} Hz
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono">{locale === 'zh' ? '触控输入' : 'Touch Input'}</div>
            <div className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {locale === 'zh' ? '就绪' : 'Ready'}
            </div>
          </div>
        </div>
      </div>

      {/* Live Stream Oscilloscopes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-600" />
              <span className="text-xs font-semibold text-slate-800">
                {locale === 'zh' ? '加速度实时波形 (g)' : 'Accelerometer Stream (g)'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              ax, ay, az
            </span>
          </div>
          <WaveformCanvas dataStream={currentData} type="accel" height={160} />
          <div className="mt-3 flex justify-between text-[11px] font-mono text-slate-500">
            <span>ax: {currentData?.ax.toFixed(3) ?? '0.000'} g</span>
            <span>ay: {currentData?.ay.toFixed(3) ?? '0.000'} g</span>
            <span>az: {currentData?.az.toFixed(3) ?? '1.000'} g</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-800">
                {locale === 'zh' ? '陀螺仪角速度波形 (°/s)' : 'Gyroscope Stream (deg/s)'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              gx, gy, gz
            </span>
          </div>
          <WaveformCanvas dataStream={currentData} type="gyro" height={160} />
          <div className="mt-3 flex justify-between text-[11px] font-mono text-slate-500">
            <span>gx: {currentData?.gx.toFixed(1) ?? '0.0'} °/s</span>
            <span>gy: {currentData?.gy.toFixed(1) ?? '0.0'} °/s</span>
            <span>gz: {currentData?.gz.toFixed(1) ?? '0.0'} °/s</span>
          </div>
        </div>
      </div>

      {/* Action panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            {isCalibrated ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{locale === 'zh' ? '传感器零位偏置与静态校准成功' : 'Zero-baseline Offset Calibrated Successfully'}</span>
              </>
            ) : (
              <span>{locale === 'zh' ? '零偏与惯性静态校准' : 'Zero-offset & Inertial Drift Calibration'}</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCalibrated
              ? (locale === 'zh' ? '重力矢量对齐完毕，陀螺仪零漂已抵消。可开始基准测试。' : 'Gravity vector aligned and gyroscopic bias nullified. Ready for testing.')
              : (locale === 'zh' ? '进行静态零速率置零与 1g 重力矢量空间对齐。' : 'Performs static null-rate tare and 1g gravitational alignment.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isCalibrated ? (
            <button
              type="button"
              disabled={isCalibrating}
              onClick={startCalibration}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isCalibrating ? 'animate-spin' : ''}`} />
              <span>
                {isCalibrating 
                  ? (locale === 'zh' ? `校准中 (${countdown})...` : `Calibrating (${countdown})...`)
                  : (locale === 'zh' ? '开始传感器校准' : 'Calibrate Sensor')}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold transition-all shadow-xs"
            >
              <span>{locale === 'zh' ? '开始基准测试' : 'Begin Baseline Assessment'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Calibration Modal / Countdown overlay if active */}
      {countdown !== null && countdown > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center shadow-xl border border-slate-100">
            <div className="w-16 h-16 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 text-3xl font-mono font-bold mx-auto mb-4">
              {countdown}
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {locale === 'zh' ? '正在校准 IMU 传感器' : 'Calibrating IMU Sensor'}
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              {locale === 'zh' ? '请保持传感器完全静止，正在对齐空间坐标并置零角速度零漂。' : 'Keep the device stationary. Aligning coordinate system and zeroing gyroscopic bias.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
