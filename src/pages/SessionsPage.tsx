import React from 'react';
import { FileText, ArrowRight, Trash2, Calendar, User, Clock, ShieldCheck, Plus } from 'lucide-react';
import { AssessmentReportData, CognitionMemoryResult, SubjectiveFatigueRecord } from '../types';
import { useI18n } from '../i18n/context';
import { HistoryTimeComparisonChart } from '../components/charts/HistoryTimeComparisonChart';

interface SessionsPageProps {
  sessions: AssessmentReportData[];
  subjectiveRecords?: SubjectiveFatigueRecord[];
  cognitionResults?: CognitionMemoryResult[];
  onOpenReport: (report: AssessmentReportData) => void;
  onDeleteSession: (id: string) => void;
  onStartNewAssessment: () => void;
  onOpenCognition: (result?: CognitionMemoryResult) => void;
}

export const SessionsPage: React.FC<SessionsPageProps> = ({
  sessions,
  subjectiveRecords = [],
  cognitionResults = [],
  onOpenReport,
  onDeleteSession,
  onStartNewAssessment,
  onOpenCognition
}) => {
  const { t, locale } = useI18n();

  const getLevelLabel = (level: string) => {
    if (level === 'High') return t.reports.levelHigh;
    if (level === 'Moderate') return t.reports.levelModerate;
    return t.reports.levelMild;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-cyan-700 uppercase tracking-wider font-mono">
              {t.sessions.tag}
            </span>
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">
              {t.sessions.recordsCount.replace('{count}', String(sessions.length))}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {t.sessions.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.sessions.desc}
          </p>
        </div>

        <button
          type="button"
          onClick={onStartNewAssessment}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.sessions.newBtn}</span>
        </button>
      </div>

      {/* Historical Time Comparison Chart (Line & Bar) */}
      {sessions.length > 0 && (
        <HistoryTimeComparisonChart
          sessions={sessions}
          subjectiveRecords={subjectiveRecords}
          onSelectSession={onOpenReport}
        />
      )}

      <div className="bg-white rounded-2xl border border-violet-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-violet-100 flex items-center justify-between gap-4"><div><div className="text-[11px] font-mono text-violet-700 uppercase tracking-wider">{locale === 'zh' ? '认知与记忆' : 'Cognition & Memory'}</div><h2 className="text-base font-bold text-slate-900 mt-1">{locale === 'zh' ? '空间记忆测试记录' : 'Spatial memory test records'}</h2><p className="text-xs text-slate-500 mt-1">{locale === 'zh' ? '仅包含用户实际完成的本地交互测试。' : 'Contains only completed local interaction tests.'}</p></div><button type="button" onClick={onOpenCognition} className="shrink-0 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold">{locale === 'zh' ? '打开测试' : 'Open test'}</button></div>
        {cognitionResults.length ? <div className="divide-y divide-slate-100">{cognitionResults.slice(0, 6).map(result => <button key={result.id} type="button" onClick={() => onOpenCognition(result)} className="w-full p-4 text-left hover:bg-violet-50/40 flex items-center justify-between gap-4"><div><div className="text-sm font-semibold text-slate-800">{new Date(result.completedAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</div><div className="mt-1 text-xs text-slate-500">{locale === 'zh' ? `准确率 ${Math.round(result.accuracy * 100)}% · 用时 ${(result.totalDuration / 1000).toFixed(1)}s · 响应 ${Math.round(result.meanResponseTime)}ms` : `Accuracy ${Math.round(result.accuracy * 100)}% · ${(result.totalDuration / 1000).toFixed(1)}s · ${Math.round(result.meanResponseTime)}ms`}</div></div><span className="font-mono font-bold text-violet-700">{result.cognitiveStabilityScore}/100</span></button>)}</div> : <div className="p-7 text-center text-xs text-slate-400">{locale === 'zh' ? '尚无认知测试记录。' : 'No cognition records yet.'}</div>}
      </div>

      {/* Sessions list */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {sessions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">{t.sessions.noSessionsTitle}</h3>
            <p className="text-xs text-slate-400">{t.sessions.noSessionsDesc}</p>
            <button
              type="button"
              onClick={onStartNewAssessment}
              className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-xs font-semibold"
            >
              {t.sessions.startFirstBtn}
            </button>
          </div>
        ) : (
          sessions.map(session => {
            const levelStyle =
              session.fatigueLevel === 'High'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : session.fatigueLevel === 'Moderate'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';

            return (
              <div
                key={session.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                onClick={() => onOpenReport(session)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-cyan-50 text-slate-600 group-hover:text-cyan-700 flex items-center justify-center shrink-0 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {session.subjectId}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${levelStyle}`}>
                        {getLevelLabel(session.fatigueLevel)}
                      </span>
                      {session.subjectiveFatigue && (
                        <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-semibold">
                          自评 {session.subjectiveFatigue.rating}/10
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400">
                        {session.id}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {session.dateString}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Load: {session.challengeDurationSec}s ({session.challengeTaps} taps)
                      </span>
                      <span>·</span>
                      <span className="text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {t.common.completed}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">{t.sessions.fatigueScore}</div>
                    <div className="text-lg font-bold text-slate-900 font-mono">
                      {session.fatigueIndex} <span className="text-xs font-normal text-slate-400">/ 100</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm(t.sessions.deleteConfirm)) {
                          onDeleteSession(session.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title={t.common.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="p-2 text-slate-300 group-hover:text-cyan-600 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
