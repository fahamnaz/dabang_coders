import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useSignTracking } from '../hooks/useSignTracking';
import { signLevels, type SignType } from '../data/signLevels';
import { useProgress } from '../store/ProgressContext';

const HEADING_FONT = '"Fredoka One", "Arial Rounded MT Bold", "Varela Round", "Comic Sans MS", sans-serif';
const BODY_FONT = '"Nunito", "Quicksand", "Segoe UI Rounded", "Comic Sans MS", sans-serif';

const PATH_OFFSETS = [0, 80, 130, 80, 0, -80, -130, -80, 0, 80]; 
const Y_SPACING = 150;
const NODE_SIZE = 110;
const NODE_CENTER_Y = NODE_SIZE / 2;
const MAP_WIDTH = 400;
const CENTER_X = MAP_WIDTH / 2;

const GuideHand = ({ sign }: { sign: SignType }) => {
  const iUp = ['one', 'peace', 'water', 'highfive', 'love', 'spider'].includes(sign);
  const mUp = ['peace', 'water', 'highfive', 'fox', 'spider'].includes(sign);
  const rUp = ['water', 'highfive', 'fox'].includes(sign);
  const pUp = ['highfive', 'ice', 'love', 'fox', 'spider'].includes(sign);
  const tUp = ['highfive', 'love', 'super'].includes(sign);

  return (
    <svg width="150" height="150" viewBox="0 0 100 100" className="drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
      <circle cx="50" cy="50" r="45" fill="rgba(255,255,255,0.2)" stroke="#fff" strokeWidth="4" />
      <rect x="32" y="45" width="36" height="35" rx="10" fill="#fbcfe8" />
      <rect x="34" y={iUp ? 15 : 45} width="8" height={iUp ? 35 : 15} rx="4" fill={iUp ? "#fbcfe8" : "#f472b6"} />
      <rect x="46" y={mUp ? 10 : 45} width="8" height={mUp ? 40 : 15} rx="4" fill={mUp ? "#fbcfe8" : "#f472b6"} />
      <rect x="58" y={rUp ? 15 : 45} width="8" height={rUp ? 35 : 15} rx="4" fill={rUp ? "#fbcfe8" : "#f472b6"} />
      <rect x="70" y={pUp ? 25 : 45} width="8" height={pUp ? 25 : 15} rx="4" fill={pUp ? "#fbcfe8" : "#f472b6"} />
      <path d={tUp ? "M 32 50 C 15 40, 10 30, 20 20" : "M 32 60 C 15 60, 20 75, 50 70"} fill="none" stroke={tUp ? "#fbcfe8" : "#f472b6"} strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
};

export function DeafLuminaRoute() {
  const { getProgress, completeLevel } = useProgress();
  const [currentView, setCurrentView] = useState<'map' | 'learn' | 'magic' | 'reward'>('map');
  const [unlockedLevel, setUnlockedLevel] = useState(0);
  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  const [magicCharge, setMagicCharge] = useState(0);
  const [score, setScore] = useState(0); 

  const activeLevel = signLevels[activeLevelIndex];
  
  // Permanent Video Ref
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // The Rock-Solid AI Hook
  const { isSignDetected, isHandVisible, isReady } = useSignTracking(videoRef, activeLevel.sign);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(() => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioContextRef.current && AudioCtx) audioContextRef.current = new AudioCtx();
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === 'suspended') ctx?.resume();

    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.setValueAtTime(freq, ctx.currentTime + (i * 0.1));
      g.gain.setValueAtTime(0.3, ctx.currentTime + (i * 0.1)); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i * 0.1) + 0.6);
      o.start(ctx.currentTime + (i * 0.1)); o.stop(ctx.currentTime + (i * 0.1) + 0.6);
    });
  }, []);

  // START CAMERA IMMEDIATELY ON LOAD
  useEffect(() => {
    const videoEl = videoRef.current;
    let stream: MediaStream | null = null;
    let isMounted = true;
    
    const initCamera = async () => {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        if (!isMounted) {
          newStream.getTracks().forEach(t => t.stop());
          return;
        }
        stream = newStream;
        if (videoEl) {
          videoEl.srcObject = stream;
          videoEl.setAttribute("playsinline", "true"); // Fix for iOS
          await videoEl.play();
        }
      } catch (err) {
        console.error("Camera failed to start:", err);
      }
    };

    initCamera();

    return () => {
      isMounted = false;
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (videoEl) {
        videoEl.pause();
        videoEl.srcObject = null;
      }
    };
  }, []);

  // Load saved progress from server
  useEffect(() => {
    getProgress('path-of-lumina').then(progress => {
      if (progress.maxLevelUnlocked > 0) {
        setUnlockedLevel(Math.min(progress.maxLevelUnlocked, signLevels.length - 1));
        setScore(progress.starsEarned || 0);
      }
    });
  }, [getProgress]);

  // Charging Logic
  useEffect(() => {
    if (currentView !== 'learn') return;

    if (isSignDetected) {
      setMagicCharge(prev => {
        const next = prev + 3; // Fills up quickly when accurate
        if (next >= 100) triggerMagic();
        return next;
      });
    } else {
      setMagicCharge(prev => Math.max(0, prev - 2));
    }
  }, [isSignDetected, currentView]);

  const triggerMagic = () => {
    setCurrentView('magic');
    playSound();
    
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ['#fde047', '#38bdf8', '#f472b6', '#a3e635'] });
    
    setTimeout(() => {
      setCurrentView('reward');
      setScore(s => s + 10);
      if (activeLevelIndex >= unlockedLevel && unlockedLevel < signLevels.length - 1) {
        setUnlockedLevel(activeLevelIndex + 1);
      }
      // Save progress to server
      completeLevel('path-of-lumina', {
        levelId: activeLevel.id,
        levelIndex: activeLevelIndex,
        stars: 10,
        score: 10,
        totalLevels: signLevels.length,
        subjectId: 'sign-language',
      }).catch(err => console.error('Failed to save sign progress:', err));
    }, 3500);
  };

  const returnToMap = () => {
    setCurrentView('map');
    setMagicCharge(0);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-900 touch-none">
      <img src="/gardenbg2.jpeg" alt="Garden Theme" className="absolute inset-0 h-full w-full object-cover scale-105 blur-[2px] z-[-2]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/80 via-[#1e1b4b]/80 to-[#312e81]/90 z-[-1]"></div>

      {/* CRITICAL DOM FIX: Video is permanently mounted. We use opacity to hide it on the map. */}
      <video 
        ref={videoRef} 
        playsInline 
        muted 
        autoPlay 
        className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-500 pointer-events-none ${
          currentView === 'learn' ? 'opacity-80 z-0' : 'opacity-0 z-[-5]'
        }`} 
      />

      <div className="absolute top-6 left-6 z-50 flex gap-6 w-full pr-12 justify-between pointer-events-auto">
        <Link to="/" className="rounded-full border-[4px] border-white bg-indigo-500 px-6 py-3 text-xl font-black text-white shadow-[0_6px_0_rgba(67,56,202,0.8)] hover:translate-y-1 hover:shadow-none transition-all" style={{ fontFamily: HEADING_FONT }}>
          Home
        </Link>
        <div className="flex items-center gap-4 rounded-3xl border-[4px] border-white bg-yellow-300 px-6 py-2 shadow-[0_6px_0_rgba(161,98,7,0.8)]">
          <span className="text-3xl animate-pulse">⭐</span>
          <span className="text-3xl font-black text-yellow-950" style={{ fontFamily: HEADING_FONT }}>{score}</span>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center pt-2 overflow-y-auto h-screen">
        <AnimatePresence mode="wait">
          
          {currentView === 'map' && (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center w-full mt-4 pb-32">
               <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-[-1]"></div>
               
               <div className="rounded-[40px] border-[8px] border-white bg-indigo-500/90 px-12 py-6 shadow-[0_15px_0_rgba(67,56,202,0.8)] backdrop-blur-sm mb-12">
                 <h2 className="text-5xl font-black text-white text-center tracking-wide" style={{ fontFamily: HEADING_FONT, WebkitTextStroke: '3px #3730a3', textShadow: '0 6px 0 rgba(0,0,0,0.15)' }}>
                   Path of Lumina
                 </h2>
               </div>

               <div className="relative" style={{ width: `${MAP_WIDTH}px`, height: `${signLevels.length * Y_SPACING}px` }}>
                  <svg className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
                    {signLevels.map((_, i) => {
                      if (i === signLevels.length - 1) return null;
                      return (
                        <line key={`line-${i}`} x1={CENTER_X + PATH_OFFSETS[i]} y1={NODE_CENTER_Y + i * Y_SPACING} x2={CENTER_X + PATH_OFFSETS[i+1]} y2={NODE_CENTER_Y + (i + 1) * Y_SPACING} stroke="rgba(255,255,255,0.3)" strokeWidth="24" strokeLinecap="round" />
                      );
                    })}
                  </svg>
                  
                  {signLevels.map((level, i) => {
                    const isUnlocked = i <= unlockedLevel;
                    const isCurrent = i === unlockedLevel;
                    return (
                      <motion.button
                        key={level.id}
                        whileHover={isUnlocked ? { scale: 1.1, rotate: (i%2===0?4:-4) } : {}}
                        onClick={() => { if(isUnlocked) { setActiveLevelIndex(i); setCurrentView('learn'); setMagicCharge(0); } }}
                        className={`absolute z-10 flex items-center justify-center rounded-full border-[8px] border-white h-[110px] w-[110px] shadow-[0_12px_0_rgba(0,0,0,0.25)] transition-all ${isUnlocked ? (i%2===0 ? 'bg-cyan-400' : 'bg-fuchsia-400') : 'bg-slate-500 opacity-60 grayscale'} ${isCurrent ? 'ring-8 ring-white/50 ring-offset-4 animate-pulse' : ''}`}
                        style={{ left: `${CENTER_X + PATH_OFFSETS[i]}px`, top: `${i * Y_SPACING}px`, transform: 'translateX(-50%)' }}
                      >
                         <span className="text-5xl drop-shadow-md">{level.emoji}</span>
                         {!isUnlocked && <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center"><span className="text-3xl">🔒</span></div>}
                      </motion.button>
                    );
                  })}
               </div>
            </motion.div>
          )}

          {currentView === 'learn' && (
            <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10 flex flex-col pointer-events-none">
              <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] z-0"></div>
              
              <div className="relative z-10 flex flex-col items-center justify-between h-full pt-28 pb-12 px-8">
                
                {/* AI Loading State */}
                {!isReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-20 backdrop-blur-md">
                    <p className="text-4xl font-black text-cyan-300 animate-pulse" style={{ fontFamily: BODY_FONT }}>Waking up AI Vision...</p>
                  </div>
                )}

                <div className="bg-black/60 backdrop-blur-md rounded-3xl p-6 border-4 border-white/20 shadow-2xl">
                  <h2 className="text-4xl font-black text-white text-center" style={{ fontFamily: BODY_FONT }}>{activeLevel.instruction}</h2>
                </div>

                <div className="flex items-end justify-between w-full max-w-4xl">
                    <div className="bg-black/60 p-4 rounded-3xl backdrop-blur-md border-4 border-white/20 flex flex-col items-center shadow-2xl">
                      <p className="text-cyan-300 font-bold mb-2 uppercase tracking-widest text-sm" style={{ fontFamily: BODY_FONT }}>Mirror This</p>
                      <GuideHand sign={activeLevel.sign} />
                    </div>

                    <div className="flex-1 ml-12 flex flex-col items-center mb-6">
                      
                      {/* Live Feedback Text */}
                      {isHandVisible && !isSignDetected && (
                         <div className="mb-4 bg-green-500/20 border-2 border-green-400 text-green-300 px-6 py-2 rounded-full backdrop-blur-sm font-bold uppercase tracking-widest text-sm animate-pulse">
                           Hand Detected - Adjust Shape!
                         </div>
                      )}

                      <p className={`text-3xl font-black mb-4 drop-shadow-md transition-colors ${isSignDetected ? 'text-green-400 animate-pulse' : 'text-white'}`} style={{ fontFamily: HEADING_FONT }}>
                        {!isHandVisible ? "Show me your hand in the camera!" : isSignDetected ? "PERFECT! HOLD IT!" : "Almost there..."}
                      </p>
                      
                      <div className={`h-16 w-full max-w-md rounded-full border-[6px] overflow-hidden relative transition-all duration-300 ${isSignDetected ? 'border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.8)]' : 'border-white bg-black/60 shadow-[0_0_30px_rgba(0,0,0,0.8)]'}`}>
                         <motion.div 
                           className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500"
                           animate={{ width: `${magicCharge}%` }}
                           transition={{ ease: "linear", duration: 0.1 }}
                         />
                      </div>
                    </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'magic' && (
            <motion.div key="magic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-cyan-400/40 backdrop-blur-md">
              <motion.h1 
                initial={{ scale: 0.5, opacity: 0 }} 
                animate={{ scale: [1.5, 1], opacity: 1 }} 
                className="text-9xl font-black text-white drop-shadow-[0_0_50px_#0ea5e9]"
                style={{ fontFamily: HEADING_FONT }}
              >
                DIVINE!
              </motion.h1>
            </motion.div>
          )}

          {currentView === 'reward' && (
            <motion.div 
              key="reward"
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.8 }} 
              className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-slate-900 pointer-events-auto"
            >
              <motion.div animate={{ backgroundColor: ['#4c1d95', '#be185d', '#0f766e', '#4c1d95'] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 z-0"></motion.div>
              <div className="absolute inset-0 z-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:50px_50px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom"></div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <h1 className="text-8xl font-black text-white mb-12 drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]" style={{ fontFamily: HEADING_FONT, WebkitTextStroke: '3px #000' }}>
                  SIGN-SATIONAL!
                </h1>

                <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} className="mb-10 text-[180px] drop-shadow-[0_0_50px_rgba(255,255,255,0.5)]">
                  {activeLevel.emoji}
                </motion.div>

                <div className="bg-white/20 rounded-full px-12 py-4 mb-10 border-4 border-white/40 shadow-2xl backdrop-blur-sm">
                  <h2 className="text-6xl font-black text-white text-center tracking-widest uppercase" style={{ fontFamily: BODY_FONT }}>
                    {activeLevel.meaning}
                  </h2>
                </div>

                <button 
                  onClick={returnToMap}
                  className="mt-8 rounded-[30px] border-[6px] border-white bg-white px-12 py-6 text-4xl font-black text-indigo-700 shadow-[0_15px_0_rgba(0,0,0,0.3)] hover:translate-y-2 hover:shadow-[0_5px_0_rgba(0,0,0,0.3)] transition-all"
                  style={{ fontFamily: HEADING_FONT }}
                >
                  Continue Map ➔
                </button>
              </div>
            </motion.div>
          )}
          
        </AnimatePresence>
      </div>
    </main>
  );
}