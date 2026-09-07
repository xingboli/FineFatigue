import React, { useState } from 'react';
import { Activity, Cpu, Info, ShieldAlert } from 'lucide-react';
import { IMUDataPoint, SensorStatus } from '../types';
import { WaveformCanvas } from '../components/charts/WaveformCanvas';
import { useI18n } from '../i18n/context';

interface SensorMonitorPageProps {
  sensorStatus: SensorStatus;
  currentData: IMUDataPoint | null;
  onRequestImuAccess: () => Promise<boolean>;
  isStreaming: boolean;
}

export const SensorMonitorPage: React.FC<SensorMonitorPageProps> = ({ sensorStatus, currentData, onRequestImuAccess, isStreaming }) => {
  const { t, locale } = useI18n();
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const isUnavailable = !sensorStatus.connected;

  const requestAccess = async () => {
    setIsRequestingAccess(true);
    await onRequestImuAccess();
    setIsRequestingAccess(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wider font-mono">{t.monitor.tag}</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{t.monitor.title}</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">{locale === 'zh' ? '仅展示浏览器从本设备 IMU 读取的真实 DeviceMotion 数据；不会生成模拟波形。' : 'Shows only physical DeviceMotion data read from this device; no simulated waveforms are generated.'}</p>
          </div>
          {isUnavailable && (
            <button type="button" disabled={isRequestingAccess || sensorStatus.permission === 'unsupported'} onClick={requestAccess} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold disabled:opacity-50">
              <Activity className="w-4 h-4" />
              <span>{isRequestingAccess ? (locale === 'zh' ? '正在请求权限…' : 'Requesting permission…') : (sensorStatus.permission === 'unsupported' ? (locale === 'zh' ? '此设备不支持 IMU' : 'IMU not supported') : (locale === 'zh' ? '启用手机 IMU' : 'Enable phone IMU'))}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <Metric label={t.topbar.imuStatus} value={sensorStatus.connected ? (locale === 'zh' ? '已连接' : 'Connected') : (sensorStatus.permission === 'denied' ? (locale === 'zh' ? '权限被拒绝' : 'Permission denied') : (locale === 'zh' ? '不可用' : 'Unavailable'))} active={sensorStatus.connected} />
          <Metric label={t.monitor.cardRate} value={sensorStatus.connected ? `${sensorStatus.samplingRate} Hz` : '--'} />
          <Metric label={t.monitor.cardPackets} value={sensorStatus.packetsReceived.toLocaleString()} />
          <Metric label={locale === 'zh' ? '数据状态' : 'Data status'} value={isStreaming && sensorStatus.connected ? (locale === 'zh' ? '真实采集中' : 'Physical stream active') : (locale === 'zh' ? '未采集' : 'Not collecting')} active={isStreaming && sensorStatus.connected} />
        </div>
      </div>

      {isUnavailable ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-amber-950">{locale === 'zh' ? 'IMU 传感器不可用' : 'IMU Sensor Unavailable'}</h2>
          <p className="text-sm text-amber-800 mt-2 max-w-xl mx-auto">{sensorStatus.permission === 'unsupported' ? (locale === 'zh' ? '当前设备未提供可用的运动传感器，可使用支持 IMU 的手机通过 HTTPS 打开本页面体验相关功能。' : 'This device does not provide a usable motion sensor. Open this HTTPS page on a phone with IMU support to try this feature.') : (locale === 'zh' ? '请点击“启用手机 IMU”，并在系统弹窗中允许“运动与方向”访问。授权后轻轻移动设备，真实数据才会出现。' : 'Select “Enable phone IMU” and allow Motion & Orientation access. After permission, gently move the device before physical data appears.')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <WaveCard title={`${t.monitor.accelTitle} (g)`} data={currentData} type="accel" values={`ax: ${currentData?.ax.toFixed(4) ?? '--'} | ay: ${currentData?.ay.toFixed(4) ?? '--'} | az: ${currentData?.az.toFixed(4) ?? '--'}`} />
          <WaveCard title={`${t.monitor.gyroTitle} (deg/s)`} data={currentData} type="gyro" values={`gx: ${currentData?.gx.toFixed(2) ?? '--'} | gy: ${currentData?.gy.toFixed(2) ?? '--'} | gz: ${currentData?.gz.toFixed(2) ?? '--'}`} />
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3 text-xs text-slate-600"><Info className="w-4 h-4 shrink-0 mt-0.5" />{locale === 'zh' ? '采样率由浏览器设备事件的实际间隔计算；不同手机、浏览器与省电策略可能不同。' : 'Sampling rate is calculated from actual browser event intervals and can vary by device, browser, and power policy.'}</div>
        </div>
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; active?: boolean }> = ({ label, value, active }) => <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl"><span className="text-[10px] text-slate-400 font-mono block">{label}</span><div className={`text-sm font-semibold mt-0.5 ${active ? 'text-emerald-700' : 'text-slate-700'}`}>{value}</div></div>;

const WaveCard: React.FC<{ title: string; data: IMUDataPoint | null; type: 'accel' | 'gyro'; values: string }> = ({ title, data, type, values }) => <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Cpu className="w-4 h-4 text-cyan-600" /><h2 className="text-sm font-bold text-slate-900">{title}</h2></div><span className="text-xs font-mono text-slate-400">{values}</span></div><WaveformCanvas dataStream={data} type={type} height={190} /></div>;
