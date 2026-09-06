import React from 'react';
import { 
  PlayCircle, 
  TrendingUp, 
  Activity, 
  Clock, 
  Zap, 
  FileText, 
  Radio, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Sliders,
  HeartHandshake
} from 'lucide-react';
import { AssessmentReportData, SensorStatus, SubjectiveFatigueRecord } from '../types';
import { useI18n } from '../i18n/context';
import { SubjectiveFatigueBlockSlider } from '../components/common/SubjectiveFatigueBlockSlider';
import { FatigueCareCard } from '../components/common/FatigueCareCard';
import { HistoryTimeComparisonChart } from '../components/charts/HistoryTimeComparisonChart';

interface OverviewPageProps {
  subjectId: string;
  sensorStatus: SensorStatus;
  sessions: AssessmentReportData[];
  subjectiveRecords?: SubjectiveFatigueRecord[];
  onStartAssessment: () => void;
  onOpenReport: (report: AssessmentReportData) => void;
  onNavigateToSessions: () => void;
  onOpenStarCatcher: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  subjectId,
  sensorStatus,
  sessions,
  subjectiveRecords = [],
  onStartAssessment,
  onOpenReport,
  onNavigateToSessions,
  onOpenStarCatcher
}) => {
  const { t, locale } = useI18n();
  const latestSession = sessions[0] || null;
  const latestSubjective = subjectiveRecords[0]?.rating || (latestSession ? Math.round(latestSession.fatigueIndex / 10) : 4);
  const avgFatigue = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.fatigueIndex, 0) / sessions.length)
    : 52;
  const avgStability = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.baseline.stability.stabilityScore, 0) / sessions.length)
    : 81;
  const avgReaction = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.baseline.reaction.medianReactionMs, 0) / sessions.length)
    : 284;

  const getLevelLabel = (level: string) => {
    if (level === 'High') return t.reports.levelHigh;
    if (level === 'Moderate') return t.reports.levelModerate;
    return t.reports.levelMild;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Welcome & Quick Start Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-7 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-cyan-100/40 via-blue-50/20 to-transparent pointer-events-none rounded-bl-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                {t.overview.tagAcademic}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {t.overview.tagStream}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {t.overview.heroTitle}
            </h1>

            <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
              {t.overview.heroDesc}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={onOpenStarCatcher}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span>{t.overview.btnDemo}</span>
            </button>

            <button
              type="button"
              onClick={onStartAssessment}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold shadow-xs hover:shadow-sm transition-all"
            >
              <PlayCircle className="w-5 h-5" />
              <span>{t.overview.btnStart}</span>
            </button>
          </div>
        </div>

        {/* Live Lab Device Status Strip */}
        <div className="mt-7 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">{t.overview.activeSubject}</span>
            <span className="text-slate-800 font-semibold text-sm">{subjectId}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">{t.overview.imuSensor}</span>
            <span className="text-emerald-700 font-semibold text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {sensorStatus.connected ? t.common.connected : t.common.offline} ({sensorStatus.type === 'simulator' ? t.common.simulated : t.common.hardware})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">{t.overview.samplingRate}</span>
            <span className="text-slate-800 font-semibold text-sm">{sensorStatus.samplingRate} Hz</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">{t.overview.touchEngine}</span>
            <span className="text-cyan-700 font-semibold text-sm">{t.common.ready}</span>
          </div>
        </div>
      </div>

      {/* Core KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Recent Fatigue Index */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{t.overview.kpiRecentFatigue}</span>
            <Activity className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {latestSession ? latestSession.fatigueIndex : 64}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              {latestSession ? getLevelLabel(latestSession.fatigueLevel) : t.reports.levelModerate}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {latestSession?.dateString || 'Today 14:32'}
            </span>
          </div>
        </div>

        {/* KPI 2: Total Assessments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{t.overview.kpiTotalAssessments}</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {sessions.length}
            </span>
            <span className="text-xs text-slate-400">{t.overview.recordedCount}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {t.overview.localStorageNote}
          </div>
        </div>

        {/* KPI 3: Average Hand Stability */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{t.overview.kpiAvgStability}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {avgStability}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {t.overview.stabilityDesc}
          </div>
        </div>

        {/* KPI 4: Average Reaction Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{t.overview.kpiAvgReaction}</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {avgReaction}
            </span>
            <span className="text-xs text-slate-400 font-mono">ms</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {t.overview.reactionDesc}
          </div>
        </div>
      </div>

      {/* Real-time Subjective Fatigue Rating & AI Comfort / Motivation Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Sliding Block Subjective Assessment */}
        <SubjectiveFatigueBlockSlider
          initialRating={latestSubjective}
          linkedSessionId={latestSession?.id}
        />

        {/* AI Targeted Motivation / Comfort Card */}
        <FatigueCareCard
          overallScore={latestSession ? Math.round(100 - latestSession.fatigueIndex) : 75}
          subjectiveRating={latestSubjective}
        />
      </div>

      {/* Historical Time Comparison Chart (Line / Bar) */}
      <HistoryTimeComparisonChart
        sessions={sessions}
        subjectiveRecords={subjectiveRecords}
        onSelectSession={onOpenReport}
      />

      {/* Multimodal Battery Dimensions Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">
          {t.overview.batteryIntroTitle}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {t.overview.batteryIntroDesc}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs mb-2.5">
              01
            </div>
            <h3 className="text-sm font-bold text-slate-800">{t.overview.dim1Title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.overview.dim1Desc}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mb-2.5">
              02
            </div>
            <h3 className="text-sm font-bold text-slate-800">{t.overview.dim2Title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.overview.dim2Desc}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs mb-2.5">
              03
            </div>
            <h3 className="text-sm font-bold text-slate-800">{t.overview.dim3Title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.overview.dim3Desc}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mb-2.5">
              04
            </div>
            <h3 className="text-sm font-bold text-slate-800">{t.overview.dim4Title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.overview.dim4Desc}</p>
          </div>
        </div>
      </div>

      {/* Recent Assessment Sessions List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {t.overview.recentSessions}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.overview.recentSessionsDesc}
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateToSessions}
            className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
          >
            <span>{t.overview.viewAll}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {t.overview.noSessions}
            </div>
          ) : (
            sessions.slice(0, 4).map(session => {
              const levelColor =
                session.fatigueLevel === 'High'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : session.fatigueLevel === 'Moderate'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';

              return (
                <div
                  key={session.id}
                  onClick={() => onOpenReport(session)}
                  className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-cyan-50 text-slate-600 group-hover:text-cyan-700 flex items-center justify-center transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 font-mono">
                          {session.subjectId}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${levelColor}`}>
                          {getLevelLabel(session.fatigueLevel)}
                        </span>
                        {session.subjectiveFatigue && (
                          <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-semibold">
                            自评 {session.subjectiveFatigue.rating}/10
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {session.dateString} · ID: {session.id}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-mono">{t.overview.thFatigueIndex}</div>
                      <div className="text-base font-bold text-slate-900 font-mono">
                        {session.fatigueIndex} <span className="text-xs font-normal text-slate-400">/ 100</span>
                      </div>
                    </div>

                    <div className="hidden sm:block text-right">
                      <div className="text-xs text-slate-400 font-mono">{t.overview.thShift}</div>
                      <div className="text-sm font-semibold text-slate-700 font-mono">
                        -{session.postFatigue.tapping.performanceDecrement}%
                      </div>
                    </div>

                    <div className="text-slate-300 group-hover:text-cyan-600 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

