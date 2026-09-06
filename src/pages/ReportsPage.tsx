import React from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  Zap, 
  PenTool, 
  CheckCircle2,
  Share2,
  Calendar,
  User
} from 'lucide-react';
import { AssessmentReportData } from '../types';
import { WaveformCanvas } from '../components/charts/WaveformCanvas';
import { FrequencySpectrumChart } from '../components/charts/FrequencySpectrumChart';
import { TapIntervalChart } from '../components/charts/TapIntervalChart';
import { ReactionTrialChart } from '../components/charts/ReactionTrialChart';
import { ArchimedeanSpiralCanvas } from '../components/charts/ArchimedeanSpiralCanvas';
import { useI18n } from '../i18n/context';
import { FatigueCareCard } from '../components/common/FatigueCareCard';
import { SubjectiveFatigueBlockSlider } from '../components/common/SubjectiveFatigueBlockSlider';

interface ReportsPageProps {
  report: AssessmentReportData | null;
  onBackToOverview: () => void;
  onStartNewAssessment: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  report,
  onBackToOverview,
  onStartNewAssessment
}) => {
  const { t, locale } = useI18n();

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">{t.reports.noReportTitle}</h2>
        <p className="text-xs text-slate-500">{t.reports.noReportDesc}</p>
        <button
          type="button"
          onClick={onStartNewAssessment}
          className="px-6 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-semibold"
        >
          {t.reports.newAssessmentBtn}
        </button>
      </div>
    );
  }

  const { baseline, postFatigue, dimensions } = report;

  // Level pill color & translated label
  const levelLabel =
    report.fatigueLevel === 'High'
      ? t.reports.levelHigh
      : report.fatigueLevel === 'Moderate'
      ? t.reports.levelModerate
      : t.reports.levelMild;

  const levelStyle =
    report.fatigueLevel === 'High'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : report.fatigueLevel === 'Moderate'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const baselineFatigueScore = 21; // baseline resting fatigue reference
  const deltaFatigue = report.fatigueIndex - baselineFatigueScore;

  // Print report trigger
  const handlePrint = () => {
    window.print();
  };

  // Export JSON data
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `FineFatigue_${report.subjectId}_${report.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 print:p-0">
      {/* Top action bar */}
      <div className="flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={onBackToOverview}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.reports.backBtn}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.reports.exportJsonBtn}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.reports.printBtn}</span>
          </button>

          <button
            type="button"
            onClick={onStartNewAssessment}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>{t.reports.newAssessmentBtn}</span>
          </button>
        </div>
      </div>

      {/* Main Report Header Card with Circular Fatigue Index Gauge */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wider font-mono">
                Multimodal Assessment Record
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${levelStyle}`}>
                {levelLabel}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {t.reports.reportTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono mt-2">
              <span className="flex items-center gap-1 text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {report.subjectId}
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {report.dateString}
              </span>
              <span>Session ID: {report.id}</span>
              <span>Load: {report.challengeDurationSec}s ({report.challengeTaps} taps)</span>
            </div>
          </div>
        </div>

        {/* Hero Gauge & Comparative Stats */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Large Circular Gauge */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4">
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Circular SVG progress ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="66"
                  stroke="#f1f5f9"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="66"
                  stroke="url(#fatigueGrad)"
                  strokeWidth="12"
                  strokeDasharray={`${(report.fatigueIndex / 100) * 414} 414`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="fatigueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {report.fatigueIndex}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ 100</span>
                <span className={`text-[11px] font-bold mt-1 px-2 py-0.2 rounded-md ${levelStyle}`}>
                  {levelLabel}
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-700 mt-2 font-mono">
              {t.reports.compositeIndex}
            </span>
          </div>

          {/* Baseline vs Current Change Cards */}
          <div className="md:col-span-7 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[11px] text-slate-400 font-mono block">{t.reports.thBaseline}</span>
                <span className="text-2xl font-bold font-mono text-slate-700 mt-0.5 block">
                  {baselineFatigueScore}
                </span>
                <span className="text-[10px] text-slate-400">Resting index</span>
              </div>

              <div className="p-3.5 bg-cyan-50/60 border border-cyan-200/80 rounded-2xl">
                <span className="text-[11px] text-cyan-800 font-mono block font-medium">{t.reports.thPost}</span>
                <span className="text-2xl font-bold font-mono text-cyan-900 mt-0.5 block">
                  {report.fatigueIndex}
                </span>
                <span className="text-[10px] text-cyan-700">Post-challenge</span>
              </div>

              <div className="p-3.5 bg-rose-50/60 border border-rose-200/80 rounded-2xl">
                <span className="text-[11px] text-rose-800 font-mono block font-medium">{t.reports.thDelta}</span>
                <span className="text-2xl font-bold font-mono text-rose-700 mt-0.5 block">
                  +{deltaFatigue}
                </span>
                <span className="text-[10px] text-rose-600">Induced decrement</span>
              </div>
            </div>

            {/* 4 Core Dimensions Before / After */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-white border border-slate-200/90 rounded-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{t.reports.dimStability}</span>
                  <span className="font-mono text-rose-600 font-bold">
                    {dimensions.handStability.baseline} → {dimensions.handStability.postFatigue}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${dimensions.handStability.postFatigue}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200/90 rounded-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{t.reports.dimReaction}</span>
                  <span className="font-mono text-rose-600 font-bold">
                    {dimensions.reactionAbility.baseline} → {dimensions.reactionAbility.postFatigue}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${dimensions.reactionAbility.postFatigue}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200/90 rounded-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{t.reports.dimEndurance}</span>
                  <span className="font-mono text-rose-600 font-bold">
                    {dimensions.motorEndurance.baseline} → {dimensions.motorEndurance.postFatigue}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${dimensions.motorEndurance.postFatigue}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200/90 rounded-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{t.reports.dimPrecision}</span>
                  <span className="font-mono text-rose-600 font-bold">
                    {dimensions.fineMotorControl.baseline} → {dimensions.fineMotorControl.postFatigue}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${dimensions.fineMotorControl.postFatigue}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Fatigue Care & Recovery Guidance + Subjective Fatigue Block Slider */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <FatigueCareCard
          overallScore={Math.max(10, Math.round(100 - report.fatigueIndex))}
          subjectiveRating={report.subjectiveFatigue?.rating ?? Math.max(1, Math.min(10, Math.round(report.fatigueIndex / 10)))}
        />

        <SubjectiveFatigueBlockSlider
          initialRating={report.subjectiveFatigue?.rating ?? Math.max(1, Math.min(10, Math.round(report.fatigueIndex / 10)))}
          linkedSessionId={report.id}
        />
      </div>

      {/* Multidimensional Experimental Data Banner: Objective vs Subjective Correlation */}
      {report.subjectiveFatigue && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                EXP
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {locale === 'zh' ? '多维实验采集指标：主观疲劳状态自评' : 'Multidimensional Experimental Metric: Subjective Fatigue Self-Assessment'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {locale === 'zh' ? '测验1 (基准) + 疲劳挑战 + 测验2 (复测) 之后独立采集 · 不作为客观指数计算依据' : 'Collected after Test 1 (Base) + Fatigue + Test 2 (Post) · Independent of objective score'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-mono">
                {locale === 'zh' ? '独立科研采集项' : 'Independent Metric'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                {locale === 'zh' ? '自评等级' : 'Rating'}: {report.subjectiveFatigue.rating} / 10
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-mono uppercase">{locale === 'zh' ? '主观体感疲劳' : 'Subjective Feeling'}</div>
              <div className="text-sm font-bold text-slate-800 mt-1">
                {report.subjectiveFatigue.rating <= 4 
                  ? (locale === 'zh' ? '平稳放松 · 轻微体感' : 'Mild / Relaxed')
                  : report.subjectiveFatigue.rating <= 7 
                  ? (locale === 'zh' ? '轻中度酸胀 · 节律受限' : 'Moderate Strain / Slowed')
                  : (locale === 'zh' ? '明显疲惫 · 指尖沉重' : 'High Strain / Exhaustion')}
              </div>
              {report.subjectiveFatigue.note && (
                <p className="text-[11px] text-slate-500 italic mt-1.5 border-t border-slate-200/60 pt-1">
                  "{report.subjectiveFatigue.note}"
                </p>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-mono uppercase">{locale === 'zh' ? '记录的体征感受' : 'Reported Sensations'}</div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {report.subjectiveFatigue.sensations && report.subjectiveFatigue.sensations.length > 0 ? (
                  report.subjectiveFatigue.sensations.map(s => (
                    <span key={s} className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400">{locale === 'zh' ? '无特定体感反馈' : 'None reported'}</span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-mono uppercase">{locale === 'zh' ? '主客观对照分析' : 'Subjective vs Objective'}</div>
              <div className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                {Math.abs(report.subjectiveFatigue.rating - Math.round(report.fatigueIndex / 10)) <= 1 ? (
                  <span className="text-emerald-700 font-medium">
                    {locale === 'zh' ? '主客观高度同步：体感感知与客观生理微动衰减（' + report.fatigueIndex + '/100）匹配吻合。' : `High concordance: Subjective perception matches objective motor decay (${report.fatigueIndex}/100).`}
                  </span>
                ) : report.subjectiveFatigue.rating > Math.round(report.fatigueIndex / 10) ? (
                  <span className="text-amber-700 font-medium">
                    {locale === 'zh' ? '主观感知先于生理指标：主观感觉较客观测试更疲劳，提示中枢/心理认知负荷。' : 'Subjective fatigue exceeds motor decay; hints central cognitive load.'}
                  </span>
                ) : (
                  <span className="text-indigo-700 font-medium">
                    {locale === 'zh' ? '隐性疲劳特征：生理运动指标明显衰减，但自感良好，提示警惕疲劳蓄积。' : 'Latent fatigue: Motor decrement is marked despite lower perceived exhaustion.'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED SECTION 1: Stability Analysis */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {locale === 'zh' ? '姿态稳定性与微动分析 (IMU)' : 'Stability & Micro-motion Analysis (IMU)'}
              </h2>
              <p className="text-xs text-slate-500">
                {locale === 'zh' ? '静止状态微震颤能量及 0–12 Hz 功率谱密度 (PSD) 对比分析' : 'Comparative analysis of resting hand tremor energy and 0–12 Hz power spectral density'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-md border border-cyan-200">
            {locale === 'zh' ? '权重: 25%' : 'Weight: 25%'}
          </span>
        </div>

        {/* Stability Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{t.reports.metricStabRms} (g)</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-1">
              {baseline.stability.motionRMS} → {postFatigue.stability.motionRMS}
            </div>
            <span className="text-[10px] text-rose-600 font-mono">
              +{(((postFatigue.stability.motionRMS - baseline.stability.motionRMS) / baseline.stability.motionRMS) * 100).toFixed(1)}% {locale === 'zh' ? '抖动增幅' : 'jitter'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{t.reports.metricDomFreq} (Hz)</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-1">
              {baseline.stability.dominantFrequency} → {postFatigue.stability.dominantFrequency}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{locale === 'zh' ? '微动主频偏移' : 'Micro-motion shift'}</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{t.reports.metricEntropy}</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-1">
              {baseline.stability.spectralEntropy} → {postFatigue.stability.spectralEntropy}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{locale === 'zh' ? '频带能量离散度' : 'Band dispersion'}</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{locale === 'zh' ? '稳定性得分' : 'Stability Score'}</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-1">
              {baseline.stability.stabilityScore} → {postFatigue.stability.stabilityScore}
            </div>
            <span className="text-[10px] text-rose-600 font-mono">
              -{baseline.stability.stabilityScore - postFatigue.stability.stabilityScore} {locale === 'zh' ? '分' : 'pts'}
            </span>
          </div>
        </div>

        {/* Side-by-side Frequency Spectra & Waveforms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">
              {t.reports.spectrumOverlay}
            </div>
            <FrequencySpectrumChart
              spectrum={postFatigue.stability.spectrum}
              compareSpectrum={baseline.stability.spectrum}
              dominantFrequency={postFatigue.stability.dominantFrequency}
              height={140}
            />
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">
              {t.reports.wavePost}
            </div>
            <WaveformCanvas
              staticBuffer={postFatigue.stability.waveforms.length > 0 ? postFatigue.stability.waveforms : undefined}
              type="accel"
              height={170}
            />
          </div>
        </div>
      </section>

      {/* DETAILED SECTION 2: Tapping Performance */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {locale === 'zh' ? '双靶快速交替敲击耐力表现' : 'Repetitive Finger Tapping Performance'}
              </h2>
              <p className="text-xs text-slate-500">
                {locale === 'zh' ? '神经肌肉敲击节律、敲击间隔变异及疲劳后减速衰减' : 'Neuromuscular tapping tempo, interval variance, and fatigue deceleration'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            {locale === 'zh' ? '权重: 30%' : 'Weight: 30%'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{t.reports.metricTapRate} (Hz)</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-1">
              {baseline.tapping.tapRate} → {postFatigue.tapping.tapRate}
            </div>
            <span className="text-[10px] text-rose-600 font-mono">
              -{(((baseline.tapping.tapRate - postFatigue.tapping.tapRate) / baseline.tapping.tapRate) * 100).toFixed(1)}% {locale === 'zh' ? '速率衰减' : 'rate loss'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{locale === 'zh' ? '平均间隔 (ITI)' : 'Mean ITI (ms)'}</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-1">
              {baseline.tapping.meanITI} → {postFatigue.tapping.meanITI} ms
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{locale === 'zh' ? '敲击间歇延长' : 'Slower inter-tap time'}</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{t.reports.metricTapCv} (%)</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-1">
              {baseline.tapping.rhythmCV}% → {postFatigue.tapping.rhythmCV}%
            </div>
            <span className="text-[10px] text-rose-600 font-mono">
              +{(((postFatigue.tapping.rhythmCV - baseline.tapping.rhythmCV) / baseline.tapping.rhythmCV) * 100).toFixed(1)}% {locale === 'zh' ? '节律不稳' : 'instability'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{t.reports.metricTapDec}</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-1">
              {postFatigue.tapping.performanceDecrement}%
            </div>
            <span className="text-[10px] text-rose-600 font-mono">{locale === 'zh' ? '前5秒 vs 后5秒' : 'First 5s vs Last 5s'}</span>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-700 mb-2">
            Inter-Tap Interval Progression Curve (Post-Fatigue)
          </div>
          <TapIntervalChart taps={postFatigue.tapping.taps} height={140} />
        </div>
      </section>

      {/* DETAILED SECTION 3: Reaction Performance */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {locale === 'zh' ? '视觉神经反应时表现' : 'Visual Reaction Performance'}
              </h2>
              <p className="text-xs text-slate-500">
                {locale === 'zh' ? '干预前后感觉运动处理潜伏期及警觉注意状态' : 'Sensory-motor processing latency and vigilance before and after challenge'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
            {locale === 'zh' ? '权重: 20%' : 'Weight: 20%'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-center font-mono">
            <span className="text-xs text-slate-400 block">{locale === 'zh' ? '基准反应时' : 'Baseline Reaction'}</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">
              {baseline.reaction.medianReactionMs} ms
            </span>
            <span className="text-[10px] text-slate-400">{locale === 'zh' ? '常态中位数' : 'Resting median'}</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-center font-mono">
            <span className="text-xs text-slate-400 block">{locale === 'zh' ? '疲劳后反应时' : 'Post-Fatigue Reaction'}</span>
            <span className="text-2xl font-bold text-rose-600 mt-1 block">
              {postFatigue.reaction.medianReactionMs} ms
            </span>
            <span className="text-[10px] text-slate-400">{locale === 'zh' ? '负荷后中位数' : 'Post-load median'}</span>
          </div>

          <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-xl text-center font-mono">
            <span className="text-xs text-rose-700 block">{locale === 'zh' ? '反应潜伏期延长' : 'Latency Increase'}</span>
            <span className="text-2xl font-bold text-rose-700 mt-1 block">
              +{(((postFatigue.reaction.medianReactionMs - baseline.reaction.medianReactionMs) / baseline.reaction.medianReactionMs) * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-rose-600">{locale === 'zh' ? '中枢处理效率变缓' : 'Central processing slowdown'}</span>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-700 mb-2">
            {locale === 'zh' ? '疲劳后各轮次反应潜伏期分布 (ms)' : 'Post-Fatigue Trial Latencies'}
          </div>
          <ReactionTrialChart
            trials={postFatigue.reaction.trials}
            medianReactionMs={postFatigue.reaction.medianReactionMs}
            height={130}
          />
        </div>
      </section>

      {/* DETAILED SECTION 4: Fine Motor Tracing (Archimedean Spiral) */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {locale === 'zh' ? '精细运动控制 (阿基米德螺旋描摹)' : 'Fine Motor Control (Archimedean Spiral Tracing)'}
              </h2>
              <p className="text-xs text-slate-500">
                {locale === 'zh' ? '描摹轨迹误差 (RMSE)、笔迹平滑度及犹豫停顿统计' : 'Trajectory error, movement jerk, and drawing pause count'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            {locale === 'zh' ? '权重: 25%' : 'Weight: 25%'}
          </span>
        </div>

        {/* Tracing metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{t.reports.metricTraceRmse}</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-1">
              {baseline.tracing.pathRMSE} → {postFatigue.tracing.pathRMSE} px
            </div>
            <span className="text-[10px] text-rose-600 font-mono">
              +{(((postFatigue.tracing.pathRMSE - baseline.tracing.pathRMSE) / baseline.tracing.pathRMSE) * 100).toFixed(1)}% {locale === 'zh' ? '误差扩大' : 'deviation'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{t.reports.metricTraceSmooth}</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-1">
              {baseline.tracing.smoothness} → {postFatigue.tracing.smoothness} / 100
            </div>
            <span className="text-[10px] text-rose-600 font-mono">
              -{baseline.tracing.smoothness - postFatigue.tracing.smoothness} {locale === 'zh' ? '分' : 'pts'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{locale === 'zh' ? '平均描摹速率' : 'Mean Speed'}</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-1">
              {baseline.tracing.meanSpeed} → {postFatigue.tracing.meanSpeed} px/s
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{locale === 'zh' ? '绘图线速度' : 'Drawing velocity'}</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">{locale === 'zh' ? '停顿与卡顿' : 'Pauses / Breaks'}</span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-1">
              {baseline.tracing.pauseCount} → {postFatigue.tracing.pauseCount}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{locale === 'zh' ? '犹豫停顿次数' : 'Hesitations'}</span>
          </div>
        </div>

        {/* Side-by-side Spiral Tracing Canvases */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center">
            <div className="w-full flex justify-between items-center text-xs font-mono text-slate-600 mb-3 px-1">
              <span className="font-bold">{t.reports.spiralBaselineTitle}</span>
              <span>RMSE: {baseline.tracing.pathRMSE} px</span>
            </div>
            <ArchimedeanSpiralCanvas
              readOnly
              width={260}
              height={260}
              staticUserPoints={baseline.tracing.userPoints}
            />
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center">
            <div className="w-full flex justify-between items-center text-xs font-mono text-slate-600 mb-3 px-1">
              <span className="font-bold text-rose-600">{t.reports.spiralPostTitle}</span>
              <span className="text-rose-600">RMSE: {postFatigue.tracing.pathRMSE} px</span>
            </div>
            <ArchimedeanSpiralCanvas
              readOnly
              width={260}
              height={260}
              staticUserPoints={postFatigue.tracing.userPoints}
            />
          </div>
        </div>
      </section>

      {/* PERFORMANCE SUMMARY TABLE (Exactly matching user requirement) */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {t.reports.matrixTitle}
          </h2>
          <p className="text-xs text-slate-500">
            {locale === 'zh' ? '跨所有实验测量模态的量化差值与表现变化' : 'Quantitative delta across all experimental modalities'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-4">{t.reports.thMetric}</th>
                <th className="py-3 px-4">{t.reports.thBaseline}</th>
                <th className="py-3 px-4">{t.reports.thPost}</th>
                <th className="py-3 px-4">{t.reports.thDelta}</th>
                <th className="py-3 px-4 text-right">{locale === 'zh' ? '测量模态领域' : 'Modal Domain'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900 font-sans">
                  {t.reports.metricReactionMed}
                </td>
                <td className="py-3.5 px-4">{baseline.reaction.medianReactionMs} ms</td>
                <td className="py-3.5 px-4 font-semibold text-rose-600">{postFatigue.reaction.medianReactionMs} ms</td>
                <td className="py-3.5 px-4 text-rose-600 font-bold">
                  +{(((postFatigue.reaction.medianReactionMs - baseline.reaction.medianReactionMs) / baseline.reaction.medianReactionMs) * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 text-right font-sans text-slate-400 text-[11px]">
                  {locale === 'zh' ? '视动神经潜伏期' : 'Visual-Motor Latency'}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900 font-sans">
                  {t.reports.metricTapRate}
                </td>
                <td className="py-3.5 px-4">{baseline.tapping.tapRate} Hz</td>
                <td className="py-3.5 px-4 font-semibold text-rose-600">{postFatigue.tapping.tapRate} Hz</td>
                <td className="py-3.5 px-4 text-rose-600 font-bold">
                  -{(((baseline.tapping.tapRate - postFatigue.tapping.tapRate) / baseline.tapping.tapRate) * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 text-right font-sans text-slate-400 text-[11px]">
                  {locale === 'zh' ? '运动耐力' : 'Motor Endurance'}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900 font-sans">
                  {t.reports.metricTapCv}
                </td>
                <td className="py-3.5 px-4">{baseline.tapping.rhythmCV}%</td>
                <td className="py-3.5 px-4 font-semibold text-rose-600">{postFatigue.tapping.rhythmCV}%</td>
                <td className="py-3.5 px-4 text-rose-600 font-bold">
                  +{(((postFatigue.tapping.rhythmCV - baseline.tapping.rhythmCV) / baseline.tapping.rhythmCV) * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 text-right font-sans text-slate-400 text-[11px]">
                  {locale === 'zh' ? '节律稳定性' : 'Timing Variability'}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900 font-sans">
                  {t.reports.metricStabRms}
                </td>
                <td className="py-3.5 px-4">{baseline.stability.motionRMS} g</td>
                <td className="py-3.5 px-4 font-semibold text-rose-600">{postFatigue.stability.motionRMS} g</td>
                <td className="py-3.5 px-4 text-rose-600 font-bold">
                  +{(((postFatigue.stability.motionRMS - baseline.stability.motionRMS) / baseline.stability.motionRMS) * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 text-right font-sans text-slate-400 text-[11px]">
                  {locale === 'zh' ? '惯导微动能量' : 'Inertial Micro-motion'}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900 font-sans">
                  {t.reports.metricTraceRmse}
                </td>
                <td className="py-3.5 px-4">{baseline.tracing.pathRMSE} px</td>
                <td className="py-3.5 px-4 font-semibold text-rose-600">{postFatigue.tracing.pathRMSE} px</td>
                <td className="py-3.5 px-4 text-rose-600 font-bold">
                  +{(((postFatigue.tracing.pathRMSE - baseline.tracing.pathRMSE) / baseline.tracing.pathRMSE) * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 text-right font-sans text-slate-400 text-[11px]">
                  {locale === 'zh' ? '精细控制误差' : 'Fine Motor Error'}
                </td>
              </tr>

              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900 font-sans">
                  {t.reports.metricTraceSmooth}
                </td>
                <td className="py-3.5 px-4">{baseline.tracing.smoothness}</td>
                <td className="py-3.5 px-4 font-semibold text-rose-600">{postFatigue.tracing.smoothness}</td>
                <td className="py-3.5 px-4 text-rose-600 font-bold">
                  -{(((baseline.tracing.smoothness - postFatigue.tracing.smoothness) / baseline.tracing.smoothness) * 100).toFixed(1)}%
                </td>
                <td className="py-3.5 px-4 text-right font-sans text-slate-400 text-[11px]">
                  {locale === 'zh' ? '加加速度抖动指数' : 'Velocity Jerk Index'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
