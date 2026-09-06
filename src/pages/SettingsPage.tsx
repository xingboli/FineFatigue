import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Shield, Cpu, Sliders, Database, Check, Globe } from 'lucide-react';
import { StorageService } from '../services/storage';
import { useI18n } from '../i18n/context';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';

interface SettingsPageProps {
  subjectId: string;
  onUpdateSubjectId: (id: string) => void;
  onResetData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  subjectId,
  onUpdateSubjectId,
  onResetData
}) => {
  const { t, locale, setLocale } = useI18n();
  const [currentId, setCurrentId] = useState(subjectId);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [sensorRate, setSensorRate] = useState(50);
  const [simNoise, setSimNoise] = useState(1.0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSubjectId(currentId.trim() || 'Subject 001');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleClearSessions = () => {
    if (confirm(t.settings.restoreConfirm)) {
      onResetData();
      alert(t.settings.restoreSuccess);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wider font-mono">
            {t.settings.tag}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          {t.settings.title}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t.settings.desc}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Language Preference Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Globe className="w-4 h-4 text-cyan-600" />
              <span>{t.settings.langSectionTitle}</span>
            </div>
            <LanguageSwitcher />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setLocale('zh')}
              className={`p-3 rounded-xl border text-left transition-all ${
                locale === 'zh'
                  ? 'border-cyan-600 bg-cyan-50/50 text-cyan-950 font-semibold ring-1 ring-cyan-500'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="text-sm font-bold">简体中文</div>
              <div className="text-[11px] text-slate-500 mt-0.5">面向中文实验环境与报告输出</div>
            </button>

            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`p-3 rounded-xl border text-left transition-all ${
                locale === 'en'
                  ? 'border-cyan-600 bg-cyan-50/50 text-cyan-950 font-semibold ring-1 ring-cyan-500'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="text-sm font-bold">English</div>
              <div className="text-[11px] text-slate-500 mt-0.5">International scientific format</div>
            </button>
          </div>
        </div>

        {/* Subject Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Sliders className="w-4 h-4 text-cyan-600" />
            <span>{t.settings.subjectSectionTitle}</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">{t.settings.subjectIdLabel}</label>
            <input
              type="text"
              value={currentId}
              onChange={e => setCurrentId(e.target.value)}
              placeholder="Subject 001"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
            />
            <p className="text-[11px] text-slate-400">
              {t.settings.subjectIdHelp}
            </p>
          </div>
        </div>

        {/* Telemetry & Physics Simulation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Cpu className="w-4 h-4 text-cyan-600" />
            <span>{t.settings.telemetrySectionTitle}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">{t.settings.imuRateLabel}</label>
              <select
                value={sensorRate}
                onChange={e => setSensorRate(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm"
              >
                <option value={25}>{t.settings.rate25}</option>
                <option value={50}>{t.settings.rate50}</option>
                <option value={100}>{t.settings.rate100}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">{t.settings.tremorNoiseLabel}</label>
              <select
                value={simNoise}
                onChange={e => setSimNoise(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm"
              >
                <option value={0.8}>{t.settings.noiseLow}</option>
                <option value={1.0}>{t.settings.noiseNormal}</option>
                <option value={1.4}>{t.settings.noiseHigh}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Local Storage Maintenance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Database className="w-4 h-4 text-cyan-600" />
            <span>{t.settings.storageSectionTitle}</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {t.settings.storageDesc}
          </p>

          <div>
            <button
              type="button"
              onClick={handleClearSessions}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.settings.restoreDefaultsBtn}</span>
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 font-mono">
              <Check className="w-4 h-4" />
              {t.settings.savedSuccess}
            </span>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{t.settings.saveBtn}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

