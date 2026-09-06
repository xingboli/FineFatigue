import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Sparkles, Trophy, ShieldAlert, ArrowRight } from 'lucide-react';
import { StarCatcherResult } from '../../types';
import { useI18n } from '../../i18n/context';

interface StarCatcherGameProps {
  onGameEnd?: (result: StarCatcherResult) => void;
}

interface Star {
  id: number;
  x: number;
  y: number;
  radius: number;
  spawnTime: number;
  pulsePhase: number;
}

interface Obstacle {
  x: number;
  y: number;
  radius: number;
}

export const StarCatcherGame: React.FC<StarCatcherGameProps> = ({ onGameEnd }) => {
  const { locale } = useI18n();
  const copy = locale === 'zh' ? {
    tag: '独立运动实验', fps: '画布 60 FPS', title: '捕星挑战',
    description: '精细运动控制挑战：移动发光指针捕捉星星，并避开红色禁区。25 秒内评估轨迹速度、目标命中准确度与运动节律。',
    timer: '计时', score: '得分', combo: '连击', stars: '星星', noGo: '禁区',
    challenge: '捕星挑战', instruction: '在画布中移动手指或鼠标，控制发光指针。捕捉星星可累积连击。',
    start: '开始挑战（25 秒）', result: '捕星精细运动评估', completed: '已完成 25 秒',
    finalScore: '最终得分', hitRate: '目标命中率', acquisition: '平均捕获时间', accuracy: '控制准确度', fineMotor: '精细运动得分', replay: '再玩一次'
  } : {
    tag: 'Independent Motor Experiment', fps: 'Canvas 60 FPS', title: 'Star Catcher',
    description: 'Fine Motor Control Challenge. Move the glowing pointer to capture stars while avoiding red forbidden zones. Evaluates path velocity, targeting accuracy, and motor rhythm in a 25s session.',
    timer: 'Timer', score: 'Score', combo: 'Combo', stars: 'Stars', noGo: 'NO GO',
    challenge: 'Star Catcher Challenge', instruction: 'Hover your finger or mouse over the canvas to steer the glowing point. Collect stars to build combos.',
    start: 'Start Challenge (25s)', result: 'Star Catcher Fine Motor Assessment', completed: 'Completed 25s',
    finalScore: 'Final Score', hitRate: 'Target Hit Rate', acquisition: 'Avg Acquisition', accuracy: 'Control Accuracy', fineMotor: 'Fine Motor Score', replay: 'Play Again'
  };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gameResult, setGameResult] = useState<StarCatcherResult | null>(null);

  // Game internal state in refs for 60fps canvas loop
  const playerPosRef = useRef<{ x: number; y: number }>({ x: 200, y: 200 });
  const starsRef = useRef<Star[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const pathRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const reactionTimesRef = useRef<number[]>([]);
  const starsCollectedRef = useRef<number>(0);
  const totalStarsSpawnedRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const canvasBoundsRef = useRef<{ width: number; height: number }>({ width: 600, height: 400 });

  const startGame = () => {
    setIsPlaying(true);
    setTimeLeft(25);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setGameResult(null);

    starsCollectedRef.current = 0;
    totalStarsSpawnedRef.current = 0;
    reactionTimesRef.current = [];
    pathRef.current = [];

    const { width, height } = canvasBoundsRef.current;
    playerPosRef.current = { x: width / 2, y: height / 2 };

    // Setup 3 gentle circular obstacles
    obstaclesRef.current = [
      { x: width * 0.3, y: height * 0.35, radius: 28 },
      { x: width * 0.7, y: height * 0.65, radius: 30 },
      { x: width * 0.5, y: height * 0.5, radius: 24 }
    ];

    spawnStar(true);
    lastTimeRef.current = performance.now();
  };

  const spawnStar = (reset: boolean = false) => {
    const { width, height } = canvasBoundsRef.current;
    if (reset) starsRef.current = [];

    const margin = 40;
    const x = margin + Math.random() * (width - margin * 2);
    const y = margin + Math.random() * (height - margin * 2);

    const newStar: Star = {
      id: Date.now() + Math.random(),
      x,
      y,
      radius: 14,
      spawnTime: Date.now(),
      pulsePhase: Math.random() * Math.PI * 2
    };

    starsRef.current.push(newStar);
    totalStarsSpawnedRef.current++;
  };

  // 25s Countdown timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const finishGame = () => {
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const collected = starsCollectedRef.current;
    const totalSpawned = Math.max(1, totalStarsSpawnedRef.current);
    const hitRate = Number(((collected / totalSpawned) * 100).toFixed(1));

    const avgRx = reactionTimesRef.current.length > 0
      ? Math.round(reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length)
      : 380;

    // Movement path calculation
    const path = pathRef.current;
    let totalDist = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      totalDist += Math.sqrt(dx * dx + dy * dy);
    }

    const controlAccuracy = Math.min(96, Math.max(45, Math.round(hitRate * 0.85 + (maxCombo * 2))));
    const movementSmoothness = Math.min(94, Math.max(50, Math.round(88 - (avgRx > 500 ? 15 : 0))));
    const fineMotorScore = Math.min(98, Math.max(40, Math.round(controlAccuracy * 0.6 + movementSmoothness * 0.4)));

    const result: StarCatcherResult = {
      score,
      combo: maxCombo,
      starsCollected: collected,
      totalStars: totalSpawned,
      hitRate,
      averageReactionMs: avgRx,
      controlAccuracy,
      movementSmoothness,
      fineMotorScore,
      durationSec: 25
    };

    setGameResult(result);
    if (onGameEnd) {
      onGameEnd(result);
    }
  };

  // Main 60fps Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 600;
    const height = 380;
    canvasBoundsRef.current = { width, height };

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    let animationId: number;

    const render = () => {
      ctx.save();
      ctx.scale(dpr, dpr);

      // Clean canvas background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Subtle game grid
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
      ctx.lineWidth = 1;
      for (let x = 30; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 30; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw historical movement trail
      const path = pathRef.current;
      if (path.length > 2) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.lineWidth = 2;
        const trailLen = Math.min(60, path.length);
        const start = path.length - trailLen;
        for (let i = start; i < path.length; i++) {
          if (i === start) ctx.moveTo(path[i].x, path[i].y);
          else ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
      }

      // Draw obstacle zones
      for (const obs of obstaclesRef.current) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cross hatching
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(copy.noGo, obs.x, obs.y + 3);
      }

      // Draw stars (targets)
      const now = performance.now();
      for (const star of starsRef.current) {
        const pulse = Math.sin((now / 200) + star.pulsePhase) * 3;
        const currentR = Math.max(8, star.radius + pulse);

        // Glow
        const grad = ctx.createRadialGradient(star.x, star.y, 2, star.x, star.y, currentR * 1.8);
        grad.addColorStop(0, 'rgba(250, 204, 21, 0.9)');
        grad.addColorStop(0.5, 'rgba(234, 179, 8, 0.4)');
        grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(star.x, star.y, currentR * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Core star
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(star.x, star.y, currentR * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw player cursor dot
      const p = playerPosRef.current;
      // Outer aura
      const pGrad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 20);
      pGrad.addColorStop(0, 'rgba(6, 182, 212, 0.9)');
      pGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.4)');
      pGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
      ctx.fill();

      // Inner white-cyan dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      if (isPlaying) {
        animationId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isPlaying, copy.noGo]);

  // Pointer movement listener for player control
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    playerPosRef.current = { x, y };
    pathRef.current.push({ x, y, time: Date.now() });

    // Check collision with obstacles (penalty / combo reset)
    for (const obs of obstaclesRef.current) {
      const dx = x - obs.x;
      const dy = y - obs.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < obs.radius + 7) {
        setCombo(0); // obstacle resets combo
      }
    }

    // Check collision with stars
    const remainingStars: Star[] = [];
    for (const star of starsRef.current) {
      const dx = x - star.x;
      const dy = y - star.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < star.radius + 10) {
        // Collected star!
        const rxTime = Date.now() - star.spawnTime;
        reactionTimesRef.current.push(rxTime);
        starsCollectedRef.current++;

        setCombo(prev => {
          const next = prev + 1;
          setMaxCombo(m => Math.max(m, next));
          const bonus = next * 50;
          setScore(s => s + 100 + bonus);
          return next;
        });

        // Spawn next star
        setTimeout(() => spawnStar(), 150);
      } else {
        remainingStars.push(star);
      }
    }
    starsRef.current = remainingStars;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider font-mono">
                {copy.tag}
              </span>
              <span className="text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full">
                {copy.fps}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {copy.title}
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {copy.description}
            </p>
          </div>
        </div>
      </div>

      {/* Game Stage Area */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        {/* HUD bar */}
        <div className="grid grid-cols-4 gap-3 p-3.5 bg-slate-900 text-white rounded-xl font-mono text-center">
          <div>
            <span className="text-[10px] text-slate-400 block">{copy.timer}</span>
            <span className="text-xl font-bold text-cyan-400">{timeLeft}s</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">{copy.score}</span>
            <span className="text-xl font-bold text-white">{score}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">{copy.combo}</span>
            <span className="text-xl font-bold text-amber-400">x{combo}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">{copy.stars}</span>
            <span className="text-xl font-bold text-emerald-400">{starsCollectedRef.current}</span>
          </div>
        </div>

        {/* Interactive Canvas */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950 touch-none select-none">
          <canvas
            ref={canvasRef}
            onPointerMove={handlePointerMove}
            style={{ width: '100%', height: '380px', display: 'block', cursor: 'none' }}
          />

          {!isPlaying && !gameResult && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="max-w-sm">
                <h3 className="text-xl font-bold text-white font-mono">{copy.challenge}</h3>
                <p className="text-xs text-slate-300 mt-1">
                  {copy.instruction}
                </p>
              </div>
              <button
                type="button"
                onClick={startGame}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-sm shadow-md transition-all font-mono"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{copy.start}</span>
              </button>
            </div>
          )}
        </div>

        {/* Game Results Card */}
        {gameResult && (
          <div className="p-6 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  {copy.result}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">{copy.completed}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 font-mono block">{copy.finalScore}</span>
                <span className="text-xl font-bold text-slate-900 font-mono mt-0.5">{gameResult.score}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 font-mono block">{copy.hitRate}</span>
                <span className="text-xl font-bold text-slate-900 font-mono mt-0.5">{gameResult.hitRate}%</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 font-mono block">{copy.acquisition}</span>
                <span className="text-xl font-bold text-slate-900 font-mono mt-0.5">{gameResult.averageReactionMs}ms</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 font-mono block">{copy.accuracy}</span>
                <span className="text-xl font-bold text-slate-900 font-mono mt-0.5">{gameResult.controlAccuracy}/100</span>
              </div>
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                <span className="text-[10px] text-cyan-800 font-mono block font-semibold">{copy.fineMotor}</span>
                <span className="text-xl font-bold text-cyan-700 font-mono mt-0.5">{gameResult.fineMotorScore}/100</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={startGame}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{copy.replay}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
