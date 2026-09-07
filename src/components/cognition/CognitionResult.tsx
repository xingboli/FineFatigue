import React from 'react';
import { Brain, Clock3, RotateCcw, ShieldCheck, Target } from 'lucide-react';
import { CognitionMemoryResult } from '../../types';
import { cognitionSummary } from '../../utils/cognitionMetrics';

interface CognitionResultProps {
  result: CognitionMemoryResult;
  locale: 'zh' | 'en';
  onRetry: () => void;
  onBack: () => void;
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

export const CognitionResult: React.FC<CognitionResultProps> = ({ result, locale, onRetry, onBack }) => {
  const zh = locale === 'zh';
  return (
    <section className="max-w-3xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4"><div><span className="text-[11px] font-mono text-violet-700 uppercase tracking-wider">{zh ? '本次真实交互结果' : 'Current interaction result'}</span><h1 className="text-2xl font-bold text-slate-900 mt-1">{zh ? '认知与记忆测试结果' : 'Cognition & Memory Results'}</h1></div><Brain className="w-7 h-7 text-violet-600" /></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <Metric label={zh ? '完成用时' : 'Completion'} value={`${(result.totalDuration / 1000).toFixed(1)}s`} />
          <Metric label={zh ? '准确率' : 'Accuracy'} value={percent(result.accuracy)} />
          <Metric label={zh ? '尝试 / 错误' : 'Attempts / errors'} value={`${result.totalAttempts} / ${result.incorrectAttempts}`} />
          <Metric label={zh ? '平均响应' : 'Mean response'} value={`${Math.round(result.meanResponseTime)}ms`} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ScoreCard label={zh ? '记忆准确性' : 'Memory Accuracy'} score={result.memoryScore} color="violet" locale={locale} />
        <ScoreCard label={zh ? '响应速度' : 'Response Speed'} score={result.responseSpeedScore} color="cyan" locale={locale} />
        <ScoreCard label={zh ? '认知稳定性' : 'Cognitive Stability'} score={result.cognitiveStabilityScore} color="emerald" locale={locale} experimental />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2"><Target className="w-4 h-4 text-violet-600" /><h2 className="font-bold text-slate-900">{zh ? '任务内表现变化' : 'Within-task performance'}</h2></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Metric label={zh ? '前半程准确率' : 'First-half accuracy'} value={percent(result.firstHalfAccuracy)} />
          <Metric label={zh ? '后半程准确率' : 'Second-half accuracy'} value={percent(result.secondHalfAccuracy)} />
          <Metric label={zh ? '前半程响应' : 'First-half response'} value={`${Math.round(result.firstHalfMeanRT)}ms`} />
          <Metric label={zh ? '后半程响应' : 'Second-half response'} value={`${Math.round(result.secondHalfMeanRT)}ms`} />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{cognitionSummary(result, locale)}</p>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2"><ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />{zh ? '本测试仅用于科研与功能演示，结果仅反映本次任务中的交互表现，不构成医学诊断。' : 'This test is for research and functional demonstration only. It reflects performance in this task and is not a medical diagnosis.'}</div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2"><button type="button" onClick={onBack} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">{zh ? '返回认知记录' : 'Back to records'}</button><button type="button" onClick={onRetry} className="inline-flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold"><RotateCcw className="w-3.5 h-3.5" />{zh ? '重新测试' : 'Test again'}</button></div>
    </section>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-[10px] text-slate-400 font-mono">{label}</div><div className="mt-1 text-base font-bold text-slate-900 font-mono">{value}</div></div>;

const ScoreCard: React.FC<{ label: string; score: number; color: 'violet' | 'cyan' | 'emerald'; locale: 'zh' | 'en'; experimental?: boolean }> = ({ label, score, color, locale, experimental = false }) => {
  const colors = { violet: 'stroke-violet-600 text-violet-700', cyan: 'stroke-cyan-600 text-cyan-700', emerald: 'stroke-emerald-600 text-emerald-700' };
  const note = experimental
    ? (locale === 'zh' ? '实验指标' : 'Experimental metric')
    : (locale === 'zh' ? '任务指标' : 'Task metric');
  return <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-xs"><div className="relative w-24 h-24 mx-auto"><svg viewBox="0 0 36 36" className="w-full h-full -rotate-90"><path d="M18 2.5a15.5 15.5 0 1 1 0 31a15.5 15.5 0 1 1 0-31" fill="none" stroke="#e2e8f0" strokeWidth="3" /><path d="M18 2.5a15.5 15.5 0 1 1 0 31a15.5 15.5 0 1 1 0-31" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={colors[color]} strokeDasharray={`${score} 100`} /></svg><span className={`absolute inset-0 flex items-center justify-center text-xl font-bold font-mono ${colors[color]}`}>{score}</span></div><div className="mt-3 text-xs font-semibold text-slate-700">{label}</div><div className="text-[10px] text-slate-400 mt-0.5">/ 100 · {note}</div></div>;
};
