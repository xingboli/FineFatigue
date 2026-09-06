import React, { useState } from 'react';
import { RotateCcw, ArrowRight, CheckCircle, PenTool, Sparkles, Activity } from 'lucide-react';
import { Point2D, TracingMetrics } from '../../types';
import { ArchimedeanSpiralCanvas } from '../charts/ArchimedeanSpiralCanvas';
import { analyzeTracing } from '../../utils/tracingAnalysis';
import { useI18n } from '../../i18n/context';

interface SpiralTracingStepProps {
  isPostFatigue?: boolean;
  onComplete: (metrics: TracingMetrics) => void;
  onBack?: () => void;
}

export const SpiralTracingStep: React.FC<SpiralTracingStepProps> = ({
  isPostFatigue = false,
  onComplete,
  onBack
}) => {
  const { locale } = useI18n();
  const [userPoints, setUserPoints] = useState<Point2D[]>([]);
  const [templatePoints, setTemplatePoints] = useState<{ x: number; y: number }[]>([]);
  const [calculatedMetrics, setCalculatedMetrics] = useState<TracingMetrics | null>(null);

  const handlePointsUpdate = (pts: Point2D[], tPts: { x: number; y: number }[]) => {
    setUserPoints(pts);
    setTemplatePoints(tPts);
    if (pts.length > 15) {
      const metrics = analyzeTracing(pts, tPts, isPostFatigue);
      setCalculatedMetrics(metrics);
    } else {
      setCalculatedMetrics(null);
    }
  };

  const handleComplete = () => {
    if (calculatedMetrics) onComplete(calculatedMetrics);
  };

  const handleRetry = () => {
    setUserPoints([]);
    setCalculatedMetrics(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider font-mono">
                {isPostFatigue 
                  ? (locale === 'zh' ? '负荷后评估环节 · 4/4' : 'Post-Fatigue Assessment · 4/4')
                  : (locale === 'zh' ? '基准评估环节 · 4/4' : 'Baseline Assessment · 4/4')}
              </span>
              {isPostFatigue && (
                <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                  {locale === 'zh' ? '高负荷后复测' : 'Post-Load Verification'}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {locale === 'zh' ? '精细运动控制描摹 (阿基米德螺旋)' : 'Fine Motor Tracing (Archimedean Spiral)'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {locale === 'zh'
                ? '使用手指、手写笔或鼠标沿虚线螺旋轨迹从中心标记顺滑向外描摹至终点环。评估轨迹偏离度(RMSE)、速度平滑度及微动冲击指标。'
                : 'Using your finger, stylus, or mouse, trace along the dashed spiral guideline starting from the center marker outward to the finish ring. Evaluates trajectory deviation, velocity smoothness, and micro-motion jerks.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                {locale === 'zh' ? '返回上一步' : 'Back'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tracing Canvas & Live Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Canvas Area */}
        <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <PenTool className="w-4 h-4 text-cyan-600" />
              <span>{locale === 'zh' ? '阿基米德螺旋画布 (从内向外描摹)' : 'Archimedean Spiral Stage'}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              r = a + b·θ
            </span>
          </div>

          <ArchimedeanSpiralCanvas
            width={380}
            height={380}
            onPointsUpdate={handlePointsUpdate}
          />
        </div>

        {/* Real-time calculated metrics & completion */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600" />
              <span>{locale === 'zh' ? '轨迹分析特征指标' : 'Trajectory Analysis Metrics'}</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {locale === 'zh' ? '轨迹偏离 (RMSE)' : 'Path RMSE'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {locale === 'zh' ? '均方根距离偏差' : 'Root Mean Square Error'}
                  </div>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {calculatedMetrics ? `${calculatedMetrics.pathRMSE} px` : '-- px'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {locale === 'zh' ? '运动平滑度' : 'Motion Smoothness'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {locale === 'zh' ? '加加速度与速度协调性' : 'Jerk & velocity harmony'}
                  </div>
                </div>
                <div className="text-lg font-bold font-mono text-cyan-600">
                  {calculatedMetrics ? `${calculatedMetrics.smoothness} / 100` : '-- / 100'}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {locale === 'zh' ? '平均线速度' : 'Mean Speed'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {locale === 'zh' ? '画笔切向运笔速率' : 'Tangential drawing velocity'}
                  </div>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {calculatedMetrics ? `${calculatedMetrics.meanSpeed} px/s` : '-- px/s'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {locale === 'zh' ? '停顿次数' : 'Pause Count'}
                  </span>
                  <span className="text-base font-bold font-mono text-slate-800">
                    {calculatedMetrics ? calculatedMetrics.pauseCount : '0'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {locale === 'zh' ? '笔画中断' : 'Interruptions'}
                  </span>
                  <span className="text-base font-bold font-mono text-slate-800">
                    {calculatedMetrics ? calculatedMetrics.pathInterruptions : '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Instruction tip */}
            <div className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-100 text-[11px] text-cyan-800 leading-snug">
              {locale === 'zh'
                ? '提示：请从中心黄点开始，沿虚线一笔顺滑描摹至外圈。系统实时计算运动平滑度及微动偏移。'
                : 'Tip: Draw a smooth, continuous spiral from center to edge. Tracing speed and micro-motion deviations are mapped in real time.'}
            </div>

            {/* Completion Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleComplete}
                disabled={!calculatedMetrics}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold transition-all shadow-xs disabled:opacity-50"
              >
                <span>
                  {locale === 'zh' 
                    ? (isPostFatigue ? '完成复测并生成多模态对比报告' : '完成描摹环节，进入疲劳负荷协议')
                    : (isPostFatigue ? 'Complete Verification & Generate Report' : 'Complete Tracing Phase')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
