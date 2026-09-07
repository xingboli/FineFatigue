import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Target, Trophy } from 'lucide-react';
import { StarCatcherResult } from '../../types';
import { useI18n } from '../../i18n/context';
import { EXPERIMENT_TIMINGS } from '../../config/runtime';

interface StarCatcherGameProps { onGameEnd?: (result: StarCatcherResult) => void; }
const DURATION_MS = EXPERIMENT_TIMINGS.starCatcherMs;
const TARGET_RADIUS = 24;
const NO_GO = { x: 0.5, y: 0.5, radius: 0.1 };

export const StarCatcherGame: React.FC<StarCatcherGameProps> = ({ onGameEnd }) => {
  const { locale } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedAtRef = useRef(0);
  const playerRef = useRef({ x: 0, y: 0 });
  const pathRef = useRef<StarCatcherResult['path']>([]);
  const frameRef = useRef(0);
  const insideNoGoRef = useRef(false);
  const noGoEntriesRef = useRef(0);
  const noGoStartedAtRef = useRef<number | null>(null);
  const noGoDwellRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DURATION_MS / 1000);
  const [result, setResult] = useState<StarCatcherResult | null>(null);
  const [bounds, setBounds] = useState({ width: 600, height: 380 });

  const targetAt = (elapsedMs: number, width = bounds.width, height = bounds.height) => ({
    x: width * (0.5 + 0.34 * Math.sin((2 * Math.PI * elapsedMs) / 6000)),
    y: height * (0.5 + 0.28 * Math.sin((2 * Math.PI * elapsedMs) / 4000 + Math.PI / 2))
  });

  const finish = () => {
    if (!playing) return;
    setPlaying(false);
    setTimeLeft(0);
    cancelAnimationFrame(frameRef.current);
    const endedAt = Date.now();
    if (insideNoGoRef.current && noGoStartedAtRef.current) noGoDwellRef.current += endedAt - noGoStartedAtRef.current;
    const path = pathRef.current;
    const distances = path.map(point => Math.hypot(point.x - point.targetX, point.y - point.targetY));
    const rmse = distances.length ? Math.sqrt(distances.reduce((sum, distance) => sum + distance * distance, 0) / distances.length) : 0;
    const onTargetPercent = distances.length ? distances.filter(distance => distance <= TARGET_RADIUS).length / distances.length * 100 : 0;
    let bestLag = 0; let bestError = Infinity;
    for (let lag = -600; lag <= 600; lag += 40) {
      const error = path.reduce((sum, point) => { const target = targetAt(point.timestamp - startedAtRef.current + lag); return sum + Math.hypot(point.x - target.x, point.y - target.y) ** 2; }, 0);
      if (error < bestError) { bestError = error; bestLag = lag; }
    }
    const standardizedScore = Math.round(Math.max(0, 100 - rmse - noGoEntriesRef.current * 10));
    const next: StarCatcherResult = { id: `GAME-${endedAt.toString(36).toUpperCase()}`, timestamp: endedAt, taskVersion: 'lissajous-tracking-v1', score: standardizedScore, combo: 0, starsCollected: 0, totalStars: 0, hitRate: Number(onTargetPercent.toFixed(1)), averageReactionMs: 0, controlAccuracy: Math.round(onTargetPercent), movementSmoothness: 0, fineMotorScore: standardizedScore, durationSec: Number(((endedAt - startedAtRef.current) / 1000).toFixed(2)), trackingRMSEPx: Number(rmse.toFixed(2)), onTargetPercent: Number(onTargetPercent.toFixed(2)), phaseLagMs: bestLag, noGoEntries: noGoEntriesRef.current, noGoDwellMs: noGoDwellRef.current, path };
    setResult(next); onGameEnd?.(next);
  };

  const start = () => {
    const canvas = canvasRef.current; const width = canvas?.clientWidth || 600; const height = 380;
    setBounds({ width, height }); startedAtRef.current = Date.now(); playerRef.current = { x: width / 2, y: height * 0.84 }; pathRef.current = []; insideNoGoRef.current = false; noGoEntriesRef.current = 0; noGoDwellRef.current = 0; noGoStartedAtRef.current = null; setTimeLeft(DURATION_MS / 1000); setResult(null); setPlaying(true);
  };

  useEffect(() => {
    const canvas = canvasRef.current; const ctx = canvas?.getContext('2d'); if (!canvas || !ctx) return;
    const render = () => {
      const dpr = window.devicePixelRatio || 1; const width = canvas.clientWidth || 600; const height = 380;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) { canvas.width = width * dpr; canvas.height = height * dpr; }
      ctx.save(); ctx.scale(dpr, dpr); ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, width, height);
      const elapsed = Math.max(0, Date.now() - startedAtRef.current); const target = targetAt(elapsed, width, height); const noGo = { x: width * NO_GO.x, y: height * NO_GO.y, radius: Math.min(width, height) * NO_GO.radius };
      ctx.fillStyle = 'rgba(239,68,68,.2)'; ctx.beginPath(); ctx.arc(noGo.x, noGo.y, noGo.radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f87171'; ctx.beginPath(); ctx.arc(noGo.x, noGo.y, noGo.radius, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(target.x, target.y, TARGET_RADIUS, 0, Math.PI * 2); ctx.fill();
      const player = playerRef.current; ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.arc(player.x, player.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (playing) { if (elapsed >= DURATION_MS) finish(); else frameRef.current = requestAnimationFrame(render); }
    }; render(); return () => cancelAnimationFrame(frameRef.current);
  }, [playing, bounds]);

  useEffect(() => { if (!playing) return; const timer = window.setInterval(() => setTimeLeft(Math.max(0, Math.ceil((DURATION_MS - (Date.now() - startedAtRef.current)) / 1000))), 100); return () => clearInterval(timer); }, [playing]);

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => { if (!playing) return; const rect = event.currentTarget.getBoundingClientRect(); const x = event.clientX - rect.left; const y = event.clientY - rect.top; const now = Date.now(); const target = targetAt(now - startedAtRef.current); const noGo = { x: bounds.width * NO_GO.x, y: bounds.height * NO_GO.y, radius: Math.min(bounds.width, bounds.height) * NO_GO.radius }; const inNoGo = Math.hypot(x - noGo.x, y - noGo.y) < noGo.radius; if (inNoGo && !insideNoGoRef.current) { insideNoGoRef.current = true; noGoEntriesRef.current += 1; noGoStartedAtRef.current = now; } if (!inNoGo && insideNoGoRef.current) { insideNoGoRef.current = false; if (noGoStartedAtRef.current) noGoDwellRef.current += now - noGoStartedAtRef.current; noGoStartedAtRef.current = null; } playerRef.current = { x, y }; pathRef.current.push({ x, y, timestamp: now, targetX: target.x, targetY: target.y, inNoGo }); };

  const zh = locale === 'zh';
  const durationSeconds = DURATION_MS / 1000;
  return <div className="max-w-4xl mx-auto space-y-5"><div className="bg-white p-6 rounded-2xl border border-slate-200"><span className="text-xs font-mono text-cyan-700">{zh ? '标准化追踪任务 · 固定轨迹与难度' : 'Standardized tracking task · fixed path and difficulty'}</span><h2 className="text-2xl font-bold mt-1">{zh ? 'Star Catcher 轨迹追踪' : 'Star Catcher Trajectory Tracking'}</h2><p className="text-sm text-slate-500 mt-2">{zh ? `跟随黄色目标完成固定 ${durationSeconds} 秒李萨如轨迹。红色区域为 No-Go；记录原始轨迹、追踪 RMSE、在靶时间、相位滞后与禁区事件。` : `Follow the yellow target on a fixed ${durationSeconds}-second Lissajous path. The red region is No-Go; raw path, RMSE, on-target time, phase lag, and No-Go events are recorded.`}</p></div><div className="bg-white p-5 rounded-2xl border border-slate-200"><div className="flex justify-between text-sm font-mono mb-3"><span>{zh ? '剩余' : 'Remaining'} {timeLeft}s</span><span>{zh ? '难度：固定' : 'Difficulty: fixed'}</span></div><canvas ref={canvasRef} onPointerMove={move} className="w-full h-[380px] rounded-xl bg-slate-950 touch-none" />{!playing && <div className="mt-4 text-center"><button type="button" onClick={start} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-white font-semibold"><Play className="w-4 h-4" />{result ? (zh ? '再次测试' : 'Retest') : (zh ? `开始 ${durationSeconds} 秒任务` : `Start ${durationSeconds}s task`)}</button></div>}</div>{result && <div className="bg-white p-5 rounded-2xl border border-slate-200"><div className="flex gap-2 items-center font-bold"><Trophy className="w-5 h-5 text-amber-500" />{zh ? '本次真实追踪结果' : 'Current tracking result'}</div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm"><Metric label="RMSE" value={`${result.trackingRMSEPx}px`} /><Metric label={zh ? '在靶时间' : 'On target'} value={`${result.onTargetPercent}%`} /><Metric label={zh ? '相位滞后' : 'Phase lag'} value={`${result.phaseLagMs}ms`} /><Metric label={zh ? '禁区进入' : 'No-Go entries'} value={String(result.noGoEntries)} /></div></div>}</div>;
};
const Metric: React.FC<{label:string;value:string}> = ({label,value}) => <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-xs text-slate-400">{label}</div><div className="font-mono font-bold mt-1">{value}</div></div>;
