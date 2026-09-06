import React, { useState, useEffect } from 'react';
import { CheckCircle2, RefreshCw, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { IMUDataPoint, SensorStatus } from '../../types';
import { useI18n } from '../../i18n/context';

interface CalibrationStepProps {
  sensorStatus: SensorStatus;
  currentData: IMUDataPoint | null;
  onRequestImuAccess: () => Promise<boolean>;
  onComplete: () => void;
}

export const CalibrationStep: React.FC<CalibrationStepProps> = ({
  sensorStatus,
  currentData: _currentData,
  onRequestImuAccess,
  onComplete
}) => {
  const { locale } = useI18n();
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);

  const isImuAvailable = sensorStatus.connected && sensorStatus.type === 'real';

  const handleFinish = () => {
    onComplete();
  };

  const startCalibration = () => {
    if (!isImuAvailable) return;
    setIsCalibrating(true);
    setCountdown(3);
  };

  const requestImuAccess = async () => {
    setIsRequestingAccess(true);
    await onRequestImuAccess();
    setIsRequestingAccess(false);
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
              {locale === 'zh' ? '阶段 0 · 传感器信号验证' : 'Phase 1 · Sensor Signal Check'}
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {locale === 'zh' ? '真实 IMU 信号验证' : 'Physical IMU Signal Validation'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {isImuAvailable ? (locale === 'zh'
                ? '将手机或浏览器可用的 IMU 保持静止，确认已收到真实事件后再开始基准测试。本页面不会修改设备的硬件校准参数。'
                : 'Keep the device still and confirm physical events are being received before baseline testing. This page does not alter hardware calibration parameters.')
                : (locale === 'zh' ? '未检测到真实 IMU。连接硬件后才能进行惯性信号采集。' : 'No physical IMU was detected. Connect hardware before inertial signal collection.')}
            </p>
          </div>

        </div>

        {/* Telemetry Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono">{locale === 'zh' ? 'IMU 链路' : 'IMU Link'}</div>
            <div className={`text-sm font-semibold flex items-center gap-1.5 mt-0.5 ${isImuAvailable ? 'text-emerald-700' : 'text-amber-700'}`}>
              <span className={`w-2 h-2 rounded-full ${isImuAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              {isImuAvailable ? (locale === 'zh' ? '已连接' : 'Connected') : (locale === 'zh' ? '不可用' : 'Unavailable')}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono">{locale === 'zh' ? '加速度计' : 'Accelerometer'}</div>
            <div className={`text-sm font-semibold flex items-center gap-1.5 mt-0.5 ${isImuAvailable ? 'text-cyan-700' : 'text-slate-500'}`}>
              <span className={`w-2 h-2 rounded-full ${isImuAvailable ? 'bg-cyan-500' : 'bg-slate-300'}`}></span>
              {isImuAvailable ? (locale === 'zh' ? '三轴活跃' : 'Active (3-Axis)') : (locale === 'zh' ? '无数据' : 'No data')}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono">{locale === 'zh' ? '陀螺仪' : 'Gyroscope'}</div>
            <div className={`text-sm font-semibold flex items-center gap-1.5 mt-0.5 ${isImuAvailable ? 'text-indigo-700' : 'text-slate-500'}`}>
              <span className={`w-2 h-2 rounded-full ${isImuAvailable ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
              {isImuAvailable ? (locale === 'zh' ? '三轴活跃' : 'Active (3-Axis)') : (locale === 'zh' ? '无数据' : 'No data')}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="text-[11px] text-slate-400 font-mono">{locale === 'zh' ? '采样率' : 'Sampling Rate'}</div>
            <div className="text-sm font-semibold text-slate-800 font-mono mt-0.5">
              {isImuAvailable ? `${sensorStatus.samplingRate} Hz` : '--'}
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

      {!isImuAvailable && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <Cpu className="w-7 h-7 text-amber-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-amber-950">{locale === 'zh' ? 'IMU 传感器不可用' : 'IMU Sensor Unavailable'}</h3>
          <p className="text-xs text-amber-800 mt-1">{locale === 'zh' ? '未检测到真实 IMU，因此不会显示任何替代波形或分数。连接硬件后可进行信号验证。' : 'No physical IMU was detected, so no substitute waveforms or scores are shown. Connect hardware to verify the signal.'}</p>
        </div>
      )}

      {/* Action panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            {isCalibrated ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{locale === 'zh' ? '真实 IMU 信号已验证' : 'Physical IMU Signal Verified'}</span>
              </>
            ) : (
              <span>{isImuAvailable ? (locale === 'zh' ? '静止信号验证' : 'Stationary Signal Check') : (locale === 'zh' ? '无法验证：未检测到真实 IMU' : 'Signal check unavailable: no physical IMU detected')}</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCalibrated
              ? (locale === 'zh' ? '已在静止状态下确认信号可用，可开始基准测试。' : 'A physical stream was confirmed while stationary. You may begin baseline testing.')
              : (isImuAvailable ? (locale === 'zh' ? '保持静止 3 秒，以确认连续的真实 IMU 事件。' : 'Remain still for 3 seconds to confirm continuous physical IMU events.') : (locale === 'zh' ? '请连接真实硬件后再进行信号验证。' : 'Connect a physical IMU before signal validation.'))}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isCalibrated ? (
            isImuAvailable ? (
              <button
                type="button"
                disabled={isCalibrating}
                onClick={startCalibration}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isCalibrating ? 'animate-spin' : ''}`} />
                <span>{isCalibrating ? (locale === 'zh' ? `验证中 (${countdown})...` : `Verifying (${countdown})...`) : (locale === 'zh' ? '验证 IMU 信号' : 'Verify IMU Signal')}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isRequestingAccess || sensorStatus.permission === 'unsupported'}
                onClick={requestImuAccess}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors shadow-xs disabled:opacity-50"
              >
                <Cpu className="w-4 h-4" />
                <span>{isRequestingAccess ? (locale === 'zh' ? '正在请求权限…' : 'Requesting permission…') : (sensorStatus.permission === 'unsupported' ? (locale === 'zh' ? '此设备不支持 IMU' : 'IMU not supported') : (locale === 'zh' ? '启用手机 IMU' : 'Enable phone IMU'))}</span>
              </button>
            )
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
              {locale === 'zh' ? '正在验证 IMU 信号' : 'Verifying IMU Signal'}
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              {locale === 'zh' ? '请保持设备静止；系统只检查浏览器是否持续收到真实 IMU 事件。' : 'Keep the device still; the system only checks that the browser continues to receive physical IMU events.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
