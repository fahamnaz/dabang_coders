import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mascot } from '../components/home/Mascot';
import { DrawingBoard } from '../components/DrawingBoard';
import { useMultiplayerHandTracking } from '../hooks/useMultiplayerHandTracking';
import { evaluateDrawing, ReferenceObject } from '../utils/drawingScorer';

// Expanded Coloring Templates
const TEMPLATES: ReferenceObject[] = [
  {
    id: 'sun', name: 'Sun', emoji: '☀️', expectedColors: ['#fde047'], viewBox: { w: 100, h: 100 },
    path: new Path2D("M50,15 A35,35 0 1,1 49.9,15 Z M50,0 L50,10 M50,90 L50,100 M0,50 L10,50 M90,50 L100,50 M15,15 L22,22 M78,78 L85,85 M15,85 L22,78 M78,15 L85,22") 
  },
  {
    id: 'apple', name: 'Apple', emoji: '🍎', expectedColors: ['#ef4444'], viewBox: { w: 100, h: 100 },
    path: new Path2D("M50,30 C80,10 100,50 80,80 C60,100 40,100 20,80 C0,50 20,10 50,30 Z M50,30 C50,15 60,5 70,5")
  },
  {
    id: 'star', name: 'Star', emoji: '⭐', expectedColors: ['#fde047'], viewBox: { w: 100, h: 100 },
    path: new Path2D("M50,5 L61,35 L95,35 L68,55 L78,85 L50,68 L22,85 L32,55 L5,35 L39,35 Z")
  },
  {
    id: 'heart', name: 'Heart', emoji: '❤️', expectedColors: ['#f43f5e'], viewBox: { w: 100, h: 100 },
    path: new Path2D("M50,30 C50,30 45,10 25,10 C5,10 5,40 5,40 C5,60 25,75 50,95 C75,75 95,60 95,40 C95,40 95,10 75,10 C55,10 50,30 50,30 Z")
  },
  {
    id: 'tree', name: 'Tree', emoji: '🌳', expectedColors: ['#22c55e'], viewBox: { w: 100, h: 100 },
    path: new Path2D("M40,95 L60,95 L60,60 C80,60 95,45 95,25 C95,5 70,5 50,5 C30,5 5,5 5,25 C5,45 20,60 40,60 Z")
  },
  {
    id: 'cat', name: 'Cat', emoji: '🐱', expectedColors: ['#f97316'], viewBox: { w: 100, h: 100 },
    path: new Path2D("M20,10 L30,30 C40,25 60,25 70,30 L80,10 L80,40 C95,55 95,75 80,90 C60,105 40,105 20,90 C5,75 5,55 20,40 Z")
  },
  {
    id: 'car', name: 'Car', emoji: '🚗', expectedColors: ['#3b82f6'], viewBox: { w: 100, h: 100 },
    path: new Path2D("M15,50 L25,30 L75,30 L85,50 L95,50 L95,70 L85,70 A10,10 0 1,1 65,70 L35,70 A10,10 0 1,1 15,70 L5,70 L5,50 Z")
  }
];

const COLORS = ['#ef4444', '#f97316', '#fde047', '#22c55e', '#3b82f6', '#a855f7', '#000000', '#ffffff'];

export function DrawingMultiplayerRoute() {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [activeTemplate, setActiveTemplate] = useState<ReferenceObject>(TEMPLATES[0]);
  
  const [p1Color, setP1Color] = useState(COLORS[0]);
  const [p2Color, setP2Color] = useState(COLORS[4]);

  const [p1BrushSize, setP1BrushSize] = useState(15);
  const [p2BrushSize, setP2BrushSize] = useState(15);
  const [p1IsEraser, setP1IsEraser] = useState(false);
  const [p2IsEraser, setP2IsEraser] = useState(false);

  const [p1Finished, setP1Finished] = useState(false);
  const [p2Finished, setP2Finished] = useState(false);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  
  const [showResults, setShowResults] = useState(false);
  
  const p1CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const p2CanvasRef = useRef<HTMLCanvasElement | null>(null);

  const { player1Data, player2Data, isReady } = useMultiplayerHandTracking(videoRef, isPlaying);

  useEffect(() => {
    const videoEl = videoRef.current;
    let activeStream: MediaStream | null = null;
    let isMounted = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        activeStream = stream;
        if (videoEl) {
          videoEl.srcObject = stream;
        }
      })
      .catch(err => console.error("Webcam error:", err));

    return () => {
      isMounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
      if (videoEl) {
        videoEl.pause();
        videoEl.srcObject = null;
      }
    };
  }, []);

  // Timer
  useEffect(() => {
    if (isPlaying && timeLeft > 0 && !(p1Finished && p2Finished)) {
      const t = setTimeout(() => setTimeLeft(l => l - 1), 1000);
      return () => clearTimeout(t);
    } else if (isPlaying && (timeLeft === 0 || (p1Finished && p2Finished))) {
      endGame();
    }
  }, [isPlaying, timeLeft, p1Finished, p2Finished]);

  // Periodic Scoring Evaluation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
       if (p1CanvasRef.current && p2CanvasRef.current) {
         const score1 = evaluateDrawing(p1CanvasRef.current, activeTemplate);
         const score2 = evaluateDrawing(p2CanvasRef.current, activeTemplate);
         
         // If either player completely fills the diagram (> 90%)
         if (score1.fillRatio > 0.90 || score2.fillRatio > 0.90) {
            setTimeLeft(0); // Safely trigger game end
         }
       }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, activeTemplate]);

  const startGame = () => {
    setIsPlaying(true);
    setTimeLeft(180);
    setP1Finished(false);
    setP2Finished(false);
    setP1Score(0);
    setP2Score(0);
    setShowResults(false);
    
    // Clear canvases
    [p1CanvasRef, p2CanvasRef].forEach(ref => {
      if (ref.current) {
        const ctx = ref.current.getContext('2d');
        ctx?.clearRect(0, 0, ref.current.width, ref.current.height);
      }
    });
  };

  const endGame = () => {
    setIsPlaying(false);
    setShowResults(true);
    
    // Final evaluation
    let s1 = 0;
    let s2 = 0;
    
    if (p1CanvasRef.current) {
       const score = evaluateDrawing(p1CanvasRef.current, activeTemplate);
       s1 = score.totalScore;
       setP1Score(Math.round(s1 / 10)); // Convert % to stars (up to 10)
       setP1Finished(true); // Trigger emoji reveal
    }
    if (p2CanvasRef.current) {
       const score = evaluateDrawing(p2CanvasRef.current, activeTemplate);
       s2 = score.totalScore;
       setP2Score(Math.round(s2 / 10));
       setP2Finished(true); // Trigger emoji reveal
    }

    if (s1 > s2) {
       confetti({ particleCount: 300, spread: 100, origin: { x: 0.25, y: 0.3 } });
    } else if (s2 > s1) {
       confetti({ particleCount: 300, spread: 100, origin: { x: 0.75, y: 0.3 } });
    } else {
       confetti({ particleCount: 300, spread: 100, origin: { y: 0.3 } });
    }
  };

  // Color Selection Logic (Hover Dwell Simulation)
  // If user X,Y is near the center, and Y is near a color circle, we select it.
  useEffect(() => {
    if (!isPlaying) return;
    
    const checkColorSelect = (data: typeof player1Data, setCol: (c: string) => void) => {
      if (!data) return;
      const globalX = data.x;
      const globalY = data.y;
      
      // If hand is in the middle 20% of the screen (0.4 to 0.6)
      if (globalX > 0.4 && globalX < 0.6) {
        // Find which color they are hovering
        const colorIndex = Math.floor((globalY * COLORS.length));
        if (colorIndex >= 0 && colorIndex < COLORS.length) {
          setCol(COLORS[colorIndex]);
        }
      }
    };

    // Check roughly every 200ms
    const t = setInterval(() => {
      checkColorSelect(player1Data, setP1Color);
      checkColorSelect(player2Data, setP2Color);
    }, 200);
    return () => clearInterval(t);
  }, [player1Data, player2Data, isPlaying]);

  return (
    <main 
      className="relative min-h-screen overflow-hidden font-sans bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/gardenbg2.jpeg')" }}
    >
      
      {/* Hidden Video for MediaPipe */}
      <video ref={videoRef} className="absolute top-0 left-0 w-32 h-32 opacity-0 pointer-events-none" autoPlay playsInline muted />

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-50">
         <Link to="/" className="rounded-full bg-blue-500 text-white px-6 py-2 font-bold shadow-lg text-xl border-4 border-white">Back</Link>
         
         <div className="flex bg-white rounded-full px-6 py-2 shadow-lg border-4 border-indigo-200">
           <span className="text-2xl font-black text-slate-800">
             Task: Draw a {activeTemplate.name}!
           </span>
         </div>
         
         <div className="w-24"></div> {/* Spacer */}
      </div>

      {!isPlaying && !showResults ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-sky-900/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 rounded-[50px] text-center shadow-2xl border-8 border-yellow-400 max-w-xl">
             <h1 className="text-5xl font-black text-blue-600 mb-6">Multiplayer Drawing!</h1>
             <p className="text-2xl text-slate-600 mb-8 font-medium">Stand back, raise your index finger to draw! Player 1 on the left, Player 2 on the right.</p>
             
             <div className="flex justify-center gap-4 mb-8">
               {TEMPLATES.map(t => (
                 <button 
                   key={t.id} 
                   onClick={() => setActiveTemplate(t)}
                   className={`px-6 py-3 rounded-2xl font-bold text-2xl transition-all border-4 ${activeTemplate.id === t.id ? 'bg-yellow-400 border-yellow-500 text-yellow-900 scale-110' : 'bg-slate-100 border-slate-200 text-slate-500'}`}
                 >
                   {t.name}
                 </button>
               ))}
             </div>

             <button onClick={startGame} disabled={!isReady} className="w-full py-4 rounded-full bg-green-500 text-white text-3xl font-black shadow-[0_8px_0_rgba(21,128,61,1)] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50">
               {isReady ? "START GAME" : "Loading Camera..."}
             </button>
          </motion.div>
        </div>
      ) : null}

      {/* Main Game Layout */}
      <div className="absolute inset-0 pt-24 pb-8 px-8 flex justify-between gap-4">
        
        {/* Player 1 Left */}
        <div className="w-[42%] h-full">
          <DrawingBoard 
             handData={player1Data}
             color={p1Color}
             referenceObject={activeTemplate}
             playerName="Player 1"
             avatar="👦"
             borderColor="#8b5cf6"
             headerColor="#a78bfa"
             brushSize={p1BrushSize}
             isEraser={p1IsEraser}
             onCanvasReady={(c) => p1CanvasRef.current = c}
             isActive={isPlaying}
          />
          
          {/* P1 Magic Reveal Overlay */}
          <AnimatePresence>
            {p1Finished && (
               <motion.div 
                 initial={{ scale: 0, opacity: 0, rotate: -45 }}
                 animate={{ scale: 1, opacity: 1, rotate: 0 }}
                 className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-[40px]"
               >
                 <motion.div
                   animate={{ y: [0, -20, 0] }}
                   transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                   className="text-[200px] drop-shadow-2xl"
                 >
                   {activeTemplate.emoji}
                 </motion.div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center UI */}
        <div className="w-[14%] h-full flex flex-col items-center py-2 overflow-y-auto custom-scrollbar">
           
           {/* Timer */}
           <div className="bg-yellow-100 border-4 border-yellow-400 rounded-[30px] p-2 text-center shadow-lg w-full mb-4 shrink-0">
              <span className="text-2xl block mb-1">⏱️</span>
              <span className="text-2xl font-black text-yellow-800">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
           </div>

           {/* Split Tools Area */}
           <div className="flex w-full gap-2 h-full">
              
              {/* P1 Tools Left Column */}
              <div className="flex flex-col gap-2 w-1/2 bg-white/60 backdrop-blur-sm rounded-2xl p-2 items-center border-4 border-purple-200">
                 <span className="font-black text-xs text-purple-600 mb-1">P1 👦</span>
                 
                 {/* Colors */}
                 {COLORS.map((c) => (
                    <button 
                      key={c} 
                      onClick={() => { setP1Color(c); setP1IsEraser(false); }}
                      className={`w-8 h-8 rounded-full border-4 shadow-sm transition-all hover:scale-110 ${!p1IsEraser && p1Color === c ? 'scale-110 ring-4 ring-purple-400 border-white' : ''}`}
                      style={{ backgroundColor: c, borderColor: c === '#ffffff' ? '#e2e8f0' : 'transparent' }}
                    />
                 ))}
                 
                 {/* Eraser */}
                 <button 
                    onClick={() => setP1IsEraser(true)}
                    className={`mt-2 w-full aspect-square rounded-xl border-4 text-xl flex items-center justify-center transition-all ${p1IsEraser ? 'bg-pink-100 border-pink-400 ring-4 ring-pink-300' : 'bg-slate-50 border-slate-200'}`}
                    title="Player 1 Eraser"
                 >🧽</button>
                 
                 {/* Sizes */}
                 <div className="flex flex-col gap-2 mt-4 w-full items-center">
                    <button onClick={() => setP1BrushSize(5)} className={`h-6 w-full rounded-full transition-colors ${p1BrushSize === 5 ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-slate-800 opacity-60'}`} />
                    <button onClick={() => setP1BrushSize(15)} className={`h-8 w-full rounded-full transition-colors ${p1BrushSize === 15 ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-slate-800 opacity-60'}`} />
                    <button onClick={() => setP1BrushSize(30)} className={`h-10 w-full rounded-full transition-colors ${p1BrushSize === 30 ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-slate-800 opacity-60'}`} />
                 </div>
              </div>
              
              {/* P2 Tools Right Column */}
              <div className="flex flex-col gap-2 w-1/2 bg-white/60 backdrop-blur-sm rounded-2xl p-2 items-center border-4 border-rose-200">
                 <span className="font-black text-xs text-rose-600 mb-1">👧 P2</span>
                 
                 {/* Colors */}
                 {COLORS.map((c) => (
                    <button 
                      key={c} 
                      onClick={() => { setP2Color(c); setP2IsEraser(false); }}
                      className={`w-8 h-8 rounded-full border-4 shadow-sm transition-all hover:scale-110 ${!p2IsEraser && p2Color === c ? 'scale-110 ring-4 ring-rose-400 border-white' : ''}`}
                      style={{ backgroundColor: c, borderColor: c === '#ffffff' ? '#e2e8f0' : 'transparent' }}
                    />
                 ))}
                 
                 {/* Eraser */}
                 <button 
                    onClick={() => setP2IsEraser(true)}
                    className={`mt-2 w-full aspect-square rounded-xl border-4 text-xl flex items-center justify-center transition-all ${p2IsEraser ? 'bg-pink-100 border-pink-400 ring-4 ring-pink-300' : 'bg-slate-50 border-slate-200'}`}
                    title="Player 2 Eraser"
                 >🧽</button>
                 
                 {/* Sizes */}
                 <div className="flex flex-col gap-2 mt-4 w-full items-center">
                    <button onClick={() => setP2BrushSize(5)} className={`h-6 w-full rounded-full transition-colors ${p2BrushSize === 5 ? 'bg-rose-600 ring-2 ring-rose-400' : 'bg-slate-800 opacity-60'}`} />
                    <button onClick={() => setP2BrushSize(15)} className={`h-8 w-full rounded-full transition-colors ${p2BrushSize === 15 ? 'bg-rose-600 ring-2 ring-rose-400' : 'bg-slate-800 opacity-60'}`} />
                    <button onClick={() => setP2BrushSize(30)} className={`h-10 w-full rounded-full transition-colors ${p2BrushSize === 30 ? 'bg-rose-600 ring-2 ring-rose-400' : 'bg-slate-800 opacity-60'}`} />
                 </div>
              </div>
              
           </div>
        </div>

        {/* Player 2 Right */}
        <div className="w-[42%] h-full">
          <DrawingBoard 
             handData={player2Data}
             color={p2Color}
             referenceObject={activeTemplate}
             playerName="Player 2"
             avatar="👧"
             borderColor="#f43f5e"
             headerColor="#fb7185"
             brushSize={p2BrushSize}
             isEraser={p2IsEraser}
             onCanvasReady={(c) => p2CanvasRef.current = c}
             isActive={isPlaying}
          />
          
          {/* P2 Magic Reveal Overlay */}
          <AnimatePresence>
            {p2Finished && (
               <motion.div 
                 initial={{ scale: 0, opacity: 0, rotate: 45 }}
                 animate={{ scale: 1, opacity: 1, rotate: 0 }}
                 className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-sm rounded-[40px]"
               >
                 <motion.div
                   animate={{ y: [0, -20, 0] }}
                   transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.2 }}
                   className="text-[200px] drop-shadow-2xl"
                 >
                   {activeTemplate.emoji}
                 </motion.div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Results Overlay */}
      <AnimatePresence>
        {showResults && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
             <div className="bg-white rounded-[50px] p-12 text-center max-w-3xl w-full border-8 border-indigo-400 shadow-2xl relative">
                
                <h2 className="text-6xl font-black text-indigo-600 mb-8">Game Over!</h2>
                
                <div className="flex justify-around mb-12">
                   <div className="flex flex-col items-center">
                      <span className="text-6xl mb-4">👦</span>
                      <h3 className="text-3xl font-bold text-slate-700">Player 1</h3>
                      <div className="mt-4 flex gap-2">
                        {Array.from({length: p1Score}).map((_, i) => <span key={i} className="text-3xl animate-pulse delay-100">⭐</span>)}
                      </div>
                      <p className="mt-2 text-xl font-bold text-slate-500">{p1Score} Stars</p>
                   </div>
                   
                   <div className="flex flex-col items-center">
                      <span className="text-6xl mb-4">👧</span>
                      <h3 className="text-3xl font-bold text-slate-700">Player 2</h3>
                      <div className="mt-4 flex gap-2">
                        {Array.from({length: p2Score}).map((_, i) => <span key={i} className="text-3xl animate-pulse delay-300">⭐</span>)}
                      </div>
                      <p className="mt-2 text-xl font-bold text-slate-500">{p2Score} Stars</p>
                   </div>
                </div>

                <div className="flex justify-center gap-6">
                  <button onClick={startGame} className="px-8 py-4 rounded-full bg-blue-500 text-white font-black text-2xl shadow-[0_6px_0_rgba(37,99,235,1)] hover:translate-y-1 hover:shadow-none transition-all">
                    Play Again
                  </button>
                  <Link to="/" className="px-8 py-4 rounded-full bg-slate-200 text-slate-700 font-black text-2xl shadow-[0_6px_0_rgba(148,163,184,1)] hover:translate-y-1 hover:shadow-none transition-all">
                    Exit
                  </Link>
                </div>

             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Mascot */}
      <Mascot state="idle" line={showResults ? "Wow, great drawing!" : "Raise your index finger to draw!"} nonce={0} position="left" />

    </main>
  );
}
