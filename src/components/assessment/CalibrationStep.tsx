import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Cpu, RefreshCw, ShieldAlert } from 'lucide-react';
import { IMUCalibration, IMUDataPoint, SensorStatus } from '../../types';
import { useI18n } from '../../i18n/context';
import { EXPERIMENT_TIMINGS } from '../../config/runtime';

interface CalibrationStepProps {
  sensorStatus: SensorStatus;
  onRequestImuAccess: () => Promise<boolean>;
  subscribeToImu: (listener: (point: IMUDataPoint) => void) => () => void;
  onComplete: (calibration: IMUCalibration) => void;
}

const CALIBRATION_DURATION_MS = EXPERIMENT_TIMINGS.calibrationMs;

export const CalibrationStep: React.FC<CalibrationStepProps> = ({ sensorStatus, onRequestImuAccess, subscribeToImu, onComplete }) => {
  const { locale } = useI18n();
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(3);
  const [calibration, setCalibration] = useState<IMUCalibration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const samplesRef = useRef<IMUDataPoint[]>([]);
  const startedAtRef = useRef(0);
  const isImuAvailable = sensorStatus.connected && sensorStatus.type === 'real';

  useEffect(() => {
    if (!isCalibrating) return;
    samplesRef.current = [];
    startedAtRef.current = Date.now();
    const unsubscribe = subscribeToImu(point => samplesRef.current.push(point));
    const tick = window.setInterval(() => {
      const remaining = Math.max(0, CALIBRATION_DURATION_MS - (Date.now() - startedAtRef.current));
      setSecondsLeft(Math.ceil(remaining / 1000));
    }, 100);
    const finish = window.setTimeout(() => {
      const samples = samplesRef.current;
      const completedAt = Date.now();
      unsubscribe();
      window.clearInterval(tick);
      setIsCalibrating(false);
      if (samples.length < 30) {
        setError(locale === 'zh' ? '校准期间收到的真实 IMU 样本不足，本次校准已丢弃。' : 'Too few physical IMU samples were received; calibration was discarded.');
        return;
      }
      const intervals = samples.slice(1).map((sample, index) => sample.timestamp - samples[index].timestamp).filter(interval => interval > 0).sort((a, b) => a - b);
      const medianInterval = intervals.length ? intervals[Math.floor(intervals.length / 2)] : 0;
      const gravityVector = ['ax', 'ay', 'az'].reduce((vector, axis) => ({ ...vector, [axis]: samples.reduce((sum, sample) => sum + sample[axis as 'ax' | 'ay' | 'az'], 0) / samples.length }), { ax: 0, ay: 0, az: 0 });
      setCalibration({ gravityVector, sampleCount: samples.length, measuredSamplingRate: medianInterval ? 1000 / medianInterval : 0, startedAt: startedAtRef.current, completedAt });
    }, CALIBRATION_DURATION_MS);
    return () => { unsubscribe(); window.clearInterval(tick); window.clearTimeout(finish); };
  }, [isCalibrating, locale, subscribeToImu]);

  const requestImuAccess = async () => {
    setIsRequestingAccess(true);
    await onRequestImuAccess();
    setIsRequestingAccess(false);
  };

  const calibrationSeconds = CALIBRATION_DURATION_MS / 1000;

  return <div className="max-w-4xl mx-auto space-y-6">
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs"><span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider font-mono">{locale === 'zh' ? '阶段 0 · 实测重力校准' : 'Phase 0 · Measured gravity calibration'}</span><h2 className="text-2xl font-bold text-slate-900 mt-1">{locale === 'zh' ? '真实 IMU 静止校准' : 'Physical IMU stationary calibration'}</h2><p className="text-sm text-slate-500 mt-2 max-w-2xl">{locale === 'zh' ? `保持设备静止 ${calibrationSeconds} 秒。系统直接订阅全部浏览器 IMU 事件，计算当前持握姿势下的三轴重力向量；不会使用固定的 az = 1g 假设。` : `Keep the device still for ${calibrationSeconds} seconds. The app subscribes to all browser IMU events and estimates the three-axis gravity vector for the current orientation; it does not assume az = 1g.`}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 text-xs"><Metric label={locale === 'zh' ? 'IMU 链路' : 'IMU link'} value={isImuAvailable ? (locale === 'zh' ? '已连接' : 'Connected') : (locale === 'zh' ? '不可用' : 'Unavailable')} /><Metric label={locale === 'zh' ? '实时采样率' : 'Live sample rate'} value={isImuAvailable ? `${sensorStatus.samplingRate} Hz` : '--'} /><Metric label={locale === 'zh' ? '校准样本' : 'Calibration samples'} value={calibration ? String(calibration.sampleCount) : '--'} /><Metric label={locale === 'zh' ? '校准采样率' : 'Measured rate'} value={calibration ? `${calibration.measuredSamplingRate.toFixed(1)} Hz` : '--'} /></div>
    </div>
    {!isImuAvailable && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center"><ShieldAlert className="w-6 h-6 mx-auto text-amber-600" /><p className="mt-2 text-sm font-semibold text-amber-950">{locale === 'zh' ? 'IMU 传感器不可用' : 'IMU sensor unavailable'}</p><p className="mt-1 text-xs leading-relaxed text-amber-800">{sensorStatus.permission === 'unsupported' ? (locale === 'zh' ? '当前设备未提供可用的运动传感器，可使用支持 IMU 的手机通过 HTTPS 打开本页面体验相关功能。' : 'This device does not provide a usable motion sensor. Open this HTTPS page on a phone with IMU support to try this feature.') : (locale === 'zh' ? '请使用 HTTPS 页面并允许浏览器访问运动与方向；系统不会生成替代传感器数据。' : 'Use an HTTPS page and allow Motion & Orientation access. No substitute sensor data is generated.')}</p><button type="button" disabled={isRequestingAccess || sensorStatus.permission === 'unsupported'} onClick={requestImuAccess} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Cpu className="w-4 h-4" />{locale === 'zh' ? '启用手机 IMU' : 'Enable phone IMU'}</button></div>}
    {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"><div><div className="text-sm font-semibold text-slate-900">{calibration ? (locale === 'zh' ? '校准完成：已保存当前姿势的重力向量' : 'Calibration complete: current gravity vector recorded') : (locale === 'zh' ? `请先完成 ${calibrationSeconds} 秒静止校准` : `Complete the ${calibrationSeconds}-second stationary calibration first`)}</div><p className="text-xs text-slate-500 mt-1">{calibration ? `${locale === 'zh' ? '重力向量' : 'Gravity vector'}: (${calibration.gravityVector.ax.toFixed(3)}, ${calibration.gravityVector.ay.toFixed(3)}, ${calibration.gravityVector.az.toFixed(3)}) g` : ''}</p></div>{calibration ? <button type="button" onClick={() => onComplete(calibration)} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-semibold"><span>{locale === 'zh' ? '开始基准测试' : 'Begin baseline assessment'}</span><ArrowRight className="w-4 h-4" /></button> : <button type="button" disabled={!isImuAvailable || isCalibrating} onClick={() => { setError(null); setSecondsLeft(calibrationSeconds); setIsCalibrating(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${isCalibrating ? 'animate-spin' : ''}`} />{isCalibrating ? (locale === 'zh' ? `校准中 ${secondsLeft}s` : `Calibrating ${secondsLeft}s`) : (locale === 'zh' ? '开始静止校准' : 'Start stationary calibration')}</button>}</div>
  </div>;
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-[10px] text-slate-400 font-mono">{label}</div><div className="mt-1 text-sm font-bold text-slate-800 font-mono">{value}</div></div>;
