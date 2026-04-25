import React, { useEffect, useRef, useState } from 'react';
import { HandData } from '../hooks/useMultiplayerHandTracking';
import { ReferenceObject } from '../utils/drawingScorer';

interface DrawingBoardProps {
  handData: HandData | null;
  color: string;
  referenceObject: ReferenceObject;
  playerName: string;
  avatar: string;
  avatar: string;
  borderColor: string;
  headerColor: string;
  brushSize: number;
  isEraser: boolean;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  isActive: boolean;
}

export function DrawingBoard({ 
  handData, color, referenceObject, playerName, avatar, 
  borderColor, headerColor, brushSize, isEraser, onCanvasReady, isActive 
}: DrawingBoardProps) {
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{x: number, y: number} | null>(null);
  const lastMidRef = useRef<{x: number, y: number} | null>(null);
  
  const clipSetupRef = useRef<string | null>(null);

  // Setup Clipping Mask when object changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    if (clipSetupRef.current !== referenceObject.id) {
       // Reset entire context state including old clips
       canvas.width = canvas.width;
       
       const w = referenceObject.viewBox.w;
       const h = referenceObject.viewBox.h;
       const scale = Math.min(canvas.width / w, canvas.height / h) * 0.8;
       const tx = (canvas.width - w * scale) / 2;
       const ty = (canvas.height - h * scale) / 2;

       ctx.translate(tx, ty);
       ctx.scale(scale, scale);
       ctx.clip(referenceObject.path);
       
       // Reset transform back to identity so drawing coords map 1:1
       ctx.setTransform(1, 0, 0, 1, 0, 0);
       
       clipSetupRef.current = referenceObject.id;
    }
  }, [referenceObject]);

  // Handle Hand Drawing Logic
  useEffect(() => {
    if (!canvasRef.current || !isActive || !handData) {
      isDrawingRef.current = false;
      lastPosRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Convert normalized whole-screen coords to local canvas pixel coords
    const rect = canvas.getBoundingClientRect();
    const globalX = handData.x * window.innerWidth;
    const globalY = handData.y * window.innerHeight;
    
    const px = (globalX - rect.left) * (canvas.width / rect.width);
    const py = (globalY - rect.top) * (canvas.height / rect.height);

    if (handData.isDrawing) {
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      
      // Handle Eraser
      ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';

      if (!isDrawingRef.current || !lastPosRef.current) {
        // Start a new stroke
        ctx.beginPath();
        ctx.moveTo(px, py);
        isDrawingRef.current = true;
        lastMidRef.current = { x: px, y: py };
      } else {
        // Smooth Quadratic Curve Drawing
        const midX = (lastPosRef.current.x + px) / 2;
        const midY = (lastPosRef.current.y + py) / 2;
        
        ctx.beginPath();
        if (lastMidRef.current) {
          ctx.moveTo(lastMidRef.current.x, lastMidRef.current.y);
          ctx.quadraticCurveTo(lastPosRef.current.x, lastPosRef.current.y, midX, midY);
          ctx.stroke();
        }
        lastMidRef.current = { x: midX, y: midY };
      }
      lastPosRef.current = { x: px, y: py };
    } else {
      isDrawingRef.current = false;
      lastPosRef.current = null;
      lastMidRef.current = null;
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [handData, color, brushSize, isEraser, isActive]);

  // Helper to render the reference outline on the background guide canvas
  useEffect(() => {
    if (!guideCanvasRef.current) return;
    const canvas = guideCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw guide only once when object changes
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw guide
    ctx.save();
    const w = referenceObject.viewBox.w;
    const h = referenceObject.viewBox.h;
    const scale = Math.min(canvas.width / w, canvas.height / h) * 0.8;
    const tx = (canvas.width - w * scale) / 2;
    const ty = (canvas.height - h * scale) / 2;

    ctx.translate(tx, ty);
    ctx.scale(scale, scale);
    
    ctx.strokeStyle = '#cbd5e1'; // Very faint outline
    ctx.lineWidth = 4 / scale; // Keep line width consistent despite scaling
    ctx.stroke(referenceObject.path);
    ctx.restore();
    
    // Also notify parent that canvas is ready, passing the foreground canvas
    if (canvasRef.current) {
      onCanvasReady(canvasRef.current);
    }
  }, [referenceObject, onCanvasReady]);

  return (
    <div className={`flex flex-col h-full rounded-[40px] border-[8px] bg-white overflow-hidden shadow-lg transition-colors`} style={{ borderColor }}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-4" style={{ backgroundColor: headerColor, borderColor }}>
        <h3 className="text-2xl font-black text-white capitalize tracking-wide">{playerName}'s Board</h3>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-white text-3xl flex items-center justify-center">
           {avatar}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-grow bg-white">
        {/* Background Guide Canvas */}
        <canvas 
          ref={guideCanvasRef}
          width={600}
          height={600}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-50"
        />
        
        {/* Foreground User Drawing Canvas */}
        <canvas 
          ref={canvasRef}
          width={600}
          height={600}
          className="absolute inset-0 w-full h-full object-contain cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
        
        {/* Render Virtual Cursor */}
        {handData && (
          <div 
            className="absolute rounded-full pointer-events-none z-10 transition-all duration-75 shadow-sm"
            style={{
              left: `${((handData.x * window.innerWidth - (canvasRef.current?.getBoundingClientRect().left || 0)) / (canvasRef.current?.getBoundingClientRect().width || 1)) * 100}%`,
              top: `${((handData.y * window.innerHeight - (canvasRef.current?.getBoundingClientRect().top || 0)) / (canvasRef.current?.getBoundingClientRect().height || 1)) * 100}%`,
              width: handData.isDrawing ? '30px' : '20px',
              height: handData.isDrawing ? '30px' : '20px',
              backgroundColor: color,
              border: handData.isDrawing ? '4px solid white' : '2px solid rgba(0,0,0,0.2)',
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}
      </div>

    </div>
  );
}
