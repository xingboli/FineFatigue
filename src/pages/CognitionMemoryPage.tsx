import React, { useState } from 'react';
import { ArrowLeft, Brain, Clock3, PlayCircle, Sparkles } from 'lucide-react';
import { CognitionMemoryResult } from '../types';
import { MemoryGame } from '../components/cognition/MemoryGame';
import { CognitionResult } from '../components/cognition/CognitionResult';
import { useI18n } from '../i18n/context';

interface CognitionMemoryPageProps {
  results: CognitionMemoryResult[];
  initialResult?: CognitionMemoryResult | null;
  onSaveResult: (result: CognitionMemoryResult) => void;
  onBack: () => void;
}

type Phase = 'intro' | 'game' | 'result';

export const CognitionMemoryPage: React.FC<CognitionMemoryPageProps> = ({ results, initialResult = null, onSaveResult, onBack }) => {
  const { locale } = useI18n();
  const [phase, setPhase] = useState<Phase>(initialResult ? 'result' : 'intro');
  const [sessionKey, setSessionKey] = useState(0);
  const [activeResult, setActiveResult] = useState<CognitionMemoryResult | null>(initialResult);
  const zh = locale === 'zh';

  const start = () => { setActiveResult(null); setSessionKey(value => value + 1); setPhase('game'); };
  const complete = (result: CognitionMemoryResult) => { onSaveResult(result); setActiveResult(result); setPhase('result'); };

  if (phase === 'game') return <div className="space-y-4"><button type="button" onClick={() => setPhase('intro')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft className="w-3.5 h-3.5" />{zh ? '退出本次测试' : 'Exit this test'}</button><MemoryGame sessionKey={sessionKey} locale={locale} onComplete={complete} /></div>;
  if (phase === 'result' && activeResult) return <CognitionResult result={activeResult} locale={locale} onRetry={start} onBack={() => setPhase('intro')} />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-violet-50 rounded-bl-full pointer-events-none" />
        <button type="button" onClick={onBack} className="relative z-10 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft className="w-3.5 h-3.5" />{zh ? '返回概览' : 'Back to overview'}</button>
        <div className="relative z-10 mt-7 max-w-2xl"><span className="text-xs font-semibold uppercase tracking-wider text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200">{zh ? '认知与记忆 · 本次交互采集' : 'Cognition & Memory · live interaction capture'}</span><h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">{zh ? '空间记忆配对测试' : 'Spatial Memory Matching Task'}</h1><p className="mt-3 text-sm leading-relaxed text-slate-600">{zh ? '记住卡片位置，并尽快完成所有相同图案的配对。系统只根据本次实际点击计算准确率、完成用时、响应时间、错误数和任务内稳定性。' : 'Remember card positions and complete all matching pairs efficiently. Metrics are calculated only from your interactions in this test.'}</p></div>
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-7"><Info icon={<Brain className="w-4 h-4" />} label={zh ? '4 × 4 网格' : '4 × 4 grid'} text={zh ? '16 张卡片，8 对图案。每次随机排列。' : '16 cards, 8 pairs. A new random order each test.'} /><Info icon={<Sparkles className="w-4 h-4" />} label={zh ? '操作规则' : 'How it works'} text={zh ? '每次翻开两张；不匹配会短暂显示后翻回。' : 'Reveal two cards; mismatches turn back after a short delay.'} /><Info icon={<Clock3 className="w-4 h-4" />} label={zh ? '采集指标' : 'Captured metrics'} text={zh ? '准确率、用时、响应时间、错误与稳定性。' : 'Accuracy, time, response, errors, and stability.'} /></div>
        <button type="button" onClick={start} className="relative z-10 mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-xs"><PlayCircle className="w-5 h-5" />{zh ? '开始测试' : 'Start Test'}</button>
      </div>
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"><div className="p-5 border-b border-slate-100 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">{zh ? '本机认知记录' : 'Local cognition records'}</h2><p className="text-xs text-slate-500 mt-1">{zh ? '仅显示用户实际完成的测试，没有患者或示例趋势数据。' : 'Only completed user tests appear here; there are no patient or example trends.'}</p></div><span className="text-xs font-mono text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2 py-1">{results.length}</span></div>{results.length ? <div className="divide-y divide-slate-100">{results.slice(0, 5).map(result => <button key={result.id} type="button" onClick={() => { setActiveResult(result); setPhase('result'); }} className="w-full p-4 text-left hover:bg-slate-50 flex items-center justify-between gap-4"><div><div className="text-sm font-semibold text-slate-800">{new Date(result.completedAt).toLocaleString(zh ? 'zh-CN' : 'en-US')}</div><div className="text-xs text-slate-500 mt-1">{zh ? `准确率 ${Math.round(result.accuracy * 100)}% · 平均响应 ${Math.round(result.meanResponseTime)}ms` : `Accuracy ${Math.round(result.accuracy * 100)}% · Mean response ${Math.round(result.meanResponseTime)}ms`}</div></div><span className="font-mono font-bold text-violet-700">{result.cognitiveStabilityScore}/100</span></button>)}</div> : <div className="p-8 text-center text-xs text-slate-400">{zh ? '完成首轮测试后，真实结果会显示在这里。' : 'Complete a first test to see its real result here.'}</div>}</section>
    </div>
  );
};

const Info: React.FC<{ icon: React.ReactNode; label: string; text: string }> = ({ icon, label, text }) => <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-1.5 text-xs font-bold text-violet-700">{icon}{label}</div><p className="mt-2 text-xs text-slate-600 leading-relaxed">{text}</p></div>;
