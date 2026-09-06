import React, { useEffect, useRef, useState } from 'react';
import { Point2D } from '../../types';
import { generateSpiralTemplate } from '../../utils/tracingAnalysis';
import { useI18n } from '../../i18n/context';

interface ArchimedeanSpiralCanvasProps {
  onPointsUpdate?: (points: Point2D[], templatePoints: { x: number; y: number }[]) => void;
  staticUserPoints?: Point2D[];
  readOnly?: boolean;
  width?: number;
  height?: number;
}

export const ArchimedeanSpiralCanvas: React.FC<ArchimedeanSpiralCanvasProps> = ({
  onPointsUpdate,
  staticUserPoints,
  readOnly = false,
  width = 380,
  height = 380
}) => {
  const { locale } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<Point2D[]>([]);
  const templatePointsRef = useRef<{ x: number; y: number }[]>([]);
  const [pointCount, setPointCount] = useState(0);

  // Initialize spiral template
  useEffect(() => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.42;
    templatePointsRef.current = generateSpiralTemplate(centerX, centerY, maxRadius, 3.2, 280);

    if (staticUserPoints && staticUserPoints.length > 0) {
      pointsRef.current = [...staticUserPoints];
      setPointCount(staticUserPoints.length);
    }
    redraw();
  }, [width, height, staticUserPoints]);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Canvas background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Circular background bounds
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.min(width, height) * 0.46, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Archimedean template guideline
    const tPoints = templatePointsRef.current;
    if (tPoints.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      tPoints.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Start circle marker (center)
      const startP = tPoints[0];
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(startP.x, startP.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // End circle marker (outer edge)
      const endP = tPoints[tPoints.length - 1];
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(endP.x, endP.y, 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw user drawn trajectory
    const uPoints = pointsRef.current;
    if (uPoints.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      uPoints.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }

    ctx.restore();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoint: Point2D = {
      x,
      y,
      timestamp: Date.now(),
      pressure: e.pressure || 0.5
    };

    pointsRef.current.push(newPoint);
    setPointCount(pointsRef.current.length);
    redraw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || !isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoint: Point2D = {
      x,
      y,
      timestamp: Date.now(),
      pressure: e.pressure || 0.5
    };

    pointsRef.current.push(newPoint);
    setPointCount(pointsRef.current.length);
    redraw();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || !isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore pointer capture release error
      }
    }
    isDrawingRef.current = false;

    if (onPointsUpdate) {
      onPointsUpdate(pointsRef.current, templatePointsRef.current);
    }
  };

  const clearCanvas = () => {
    pointsRef.current = [];
    setPointCount(0);
    redraw();
    if (onPointsUpdate) {
      onPointsUpdate([], templatePointsRef.current);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm touch-none select-none bg-slate-50">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            display: 'block',
            cursor: readOnly ? 'default' : 'crosshair'
          }}
        />

        {!readOnly && pointCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-white/90 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 shadow-xs backdrop-blur-xs">
              {locale === 'zh' ? '从中心蓝点向外沿螺旋虚线平稳描摹' : 'Trace from the center dot outward'}
            </span>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={clearCanvas}
            className="px-3 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            {locale === 'zh' ? '清除重描' : 'Clear Path'}
          </button>
          <span className="text-xs text-slate-400 font-mono">
            {locale === 'zh' 
              ? `已采集 ${pointCount} 个轨迹坐标点` 
              : `${pointCount} trajectory points recorded`}
          </span>
        </div>
      )}
    </div>
  );
};
