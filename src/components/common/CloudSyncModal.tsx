import React, { useState, useEffect } from 'react';
import { X, Cloud, CloudUpload, CloudCheck, RefreshCw, Download, Upload, Server, ShieldCheck, Clock } from 'lucide-react';
import { CloudSyncState } from '../../types';
import { cloudSyncService } from '../../services/cloudSyncService';
import { useI18n } from '../../i18n/context';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: CloudSyncState;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  syncState
}) => {
  const { locale } = useI18n();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const res = await cloudSyncService.syncNow();
    setIsSyncing(false);
    if (res.success) {
      setSyncFeedback(locale === 'zh'
        ? `同步成功！已上传 ${res.syncedItemsCount} 条实验与自评记录 (延迟 ${res.latencyMs}ms)`
        : `Synced successfully! ${res.syncedItemsCount} items uploaded (${res.latencyMs}ms)`);
    } else {
      setSyncFeedback(locale === 'zh' ? '同步遇到网络延迟，已进入本地离线队列' : 'Sync error, queued in offline storage');
    }
  };

  const handleExportBackup = () => {
    const jsonStr = cloudSyncService.exportCloudBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FineFatigue-Cloud-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (content) {
        const res = cloudSyncService.importCloudBackupJson(content);
        if (res.success) {
          setSyncFeedback(locale === 'zh' ? '数据备份已成功恢复！' : 'Backup restored successfully!');
          window.location.reload();
        } else {
          setSyncFeedback(res.message);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                {locale === 'zh' ? '云端数据同步中心' : 'Cloud Synchronization Hub'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {locale === 'zh' ? '多终端传感器实验记录与疲劳自评实时同步' : 'Real-time multi-device cloud storage & sync'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Status Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {locale === 'zh' ? '当前同步状态' : 'Sync Status'}
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{locale === 'zh' ? '已连接云端服务器' : 'Cloud Online'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block mb-0.5">
                  {locale === 'zh' ? '最后同步时间' : 'Last Synced'}
                </span>
                <span className="font-bold text-slate-800">
                  {syncState.lastSyncTime ? new Date(syncState.lastSyncTime).toLocaleTimeString() : 'Never'}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block mb-0.5">
                  {locale === 'zh' ? '设备实验终端' : 'Device ID'}
                </span>
                <span className="font-bold text-cyan-800">
                  {syncState.cloudDeviceId}
                </span>
              </div>
            </div>
          </div>

          {syncFeedback && (
            <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-800 font-mono">
              {syncFeedback}
            </div>
          )}

          {/* Sync Now Button */}
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSyncNow}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isSyncing
                ? (locale === 'zh' ? '正在与云端服务器传输数据...' : 'Syncing with cloud...')
                : (locale === 'zh' ? '立即上传并同步所有数据' : 'Sync All Data Now')}
            </span>
          </button>

          {/* Data Export & Import */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{locale === 'zh' ? '导出云端快照 JSON' : 'Export Snapshot'}</span>
            </button>

            <label className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>{locale === 'zh' ? '导入云端备份' : 'Restore Backup'}</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
