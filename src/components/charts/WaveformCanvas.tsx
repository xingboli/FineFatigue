import React, { useEffect, useRef } from 'react';
import { IMUDataPoint } from '../../types';

interface WaveformCanvasProps {
  dataStream?: IMUDataPoint | null;
  staticBuffer?: IMUDataPoint[];
  type: 'accel' | 'gyro';
  height?: number;
  maxPoints?: number;
  showLegend?: boolean;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  dataStream,
  staticBuffer,
  type,
  height = 160,
  maxPoints = 200,
  showLegend = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<IMUDataPoint[]>([]);

  // Seed with staticBuffer if provided
  useEffect(() => {
    if (staticBuffer && staticBuffer.length > 0) {
      bufferRef.current = [...staticBuffer];
      draw();
    }
  }, [staticBuffer]);

  // Append new live data
  useEffect(() => {
    if (dataStream) {
      bufferRef.current.push(dataStream);
      if (bufferRef.current.length > maxPoints) {
        bufferRef.current.shift();
      }
      draw();
    }
  }, [dataStream, maxPoints]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const h = height;

    if (canvas.width !== width * dpr || canvas.height !== h * dpr) {
      canvas.width = width * dpr;
      canvas.height = h * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#0f172a'; // dark lab oscilloscope style
    ctx.fillRect(0, 0, width, h);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    const gridCols = 8;
    const gridRows = 4;
    for (let i = 1; i < gridCols; i++) {
      const x = (width / gridCols) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let j = 1; j < gridRows; j++) {
      const y = (h / gridRows) * j;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Zero center line
    const midY = h / 2;
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    const points = bufferRef.current;
    if (points.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.fillText('Waiting for sensor signal...', 16, midY + 4);
      ctx.restore();
      return;
    }

    // Scaling factors
    // Accel: normal ranges -1.5g to +1.5g (or micro perturbations around 0 and 1)
    // Gyro: ranges -30 deg/s to +30 deg/s
    const scale = type === 'accel' ? (h * 0.4) / 1.5 : (h * 0.4) / 25;
    const stepX = width / (maxPoints - 1);
    const startIdx = Math.max(0, points.length - maxPoints);

    // Axes colors
    const colors = {
      x: '#f43f5e', // Rose
      y: '#10b981', // Emerald
      z: '#06b6d4'  // Cyan
    };

    // Draw channels
    const channels = type === 'accel'
      ? [
          { key: 'ax' as const, color: colors.x, offset: 0 },
          { key: 'ay' as const, color: colors.y, offset: 0 },
          { key: 'az' as const, color: colors.z, offset: -1.0 } // center az by subtracting 1g gravity
        ]
      : [
          { key: 'gx' as const, color: colors.x, offset: 0 },
          { key: 'gy' as const, color: colors.y, offset: 0 },
          { key: 'gz' as const, color: colors.z, offset: 0 }
        ];

    channels.forEach(ch => {
      ctx.beginPath();
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';

      for (let i = startIdx; i < points.length; i++) {
        const p = points[i];
        const val = (p[ch.key] + ch.offset);
        const x = (i - startIdx) * stepX;
        const y = midY - val * scale;

        if (i === startIdx) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    });

    ctx.restore();
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900 shadow-inner">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px`, display: 'block' }}
      />
      {showLegend && (
        <div className="absolute top-2 right-3 flex items-center gap-3 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-700/50 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            {type === 'accel' ? 'aX' : 'gX'}
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {type === 'accel' ? 'aY' : 'gY'}
          </span>
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            {type === 'accel' ? 'aZ (dyn)' : 'gZ'}
          </span>
        </div>
      )}
    </div>
  );
};
