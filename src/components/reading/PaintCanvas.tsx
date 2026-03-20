'use client';
// src/components/reading/PaintCanvas.tsx
// A simple HTML5 canvas overlay that lets users draw freehand on top of the article.
// Drawing is ephemeral (not saved to server). Users can clear with a button.

import { useEffect, useRef, useState } from 'react';
import { Trash2, Minus, Plus } from 'lucide-react';

export default function PaintCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#6B1E3C');
  const [brushSize, setBrushSize] = useState(4);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Resize canvas to match document
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Save existing drawing
      const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = document.documentElement.scrollWidth;
      canvas.height = document.documentElement.scrollHeight;
      if (imageData) canvas.getContext('2d')?.putImageData(imageData, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left + window.scrollX, y: t.clientY - rect.top + window.scrollY };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left + window.scrollX, y: (e as React.MouseEvent).clientY - rect.top + window.scrollY };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPos.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.85;
    ctx.stroke();

    lastPos.current = pos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const PAINT_COLORS = ['#6B1E3C', '#1A1208', '#C9A84C', '#27AE60', '#0D3B66', '#E67E22'];

  return (
    <>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-30 cursor-crosshair"
        style={{ pointerEvents: 'all', touchAction: 'none' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* Paint controls */}
      <div className="fixed bottom-20 left-6 z-40 flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-full px-3 py-2 shadow-card">
        {/* Color swatches */}
        {PAINT_COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
            style={{ backgroundColor: c }}
          />
        ))}

        <div className="w-px h-4 bg-[var(--border)] mx-1" />

        {/* Brush size */}
        <button onClick={() => setBrushSize(s => Math.max(1, s - 2))} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Minus size={12} /></button>
        <span className="text-xs font-sans text-[var(--text-faint)] w-3 text-center">{brushSize}</span>
        <button onClick={() => setBrushSize(s => Math.min(20, s + 2))} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Plus size={12} /></button>

        <div className="w-px h-4 bg-[var(--border)] mx-1" />

        {/* Clear */}
        <button onClick={clearCanvas} className="text-red-400 hover:text-red-600 transition-colors" aria-label="Clear canvas">
          <Trash2 size={14} />
        </button>
      </div>
    </>
  );
}
