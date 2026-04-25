import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mascot } from '../components/home/Mascot';
import { useSpeechAudio } from '../hooks/useSpeechAudio';
import { useAdaptive } from '../hooks/useAdaptive';
import { speechLevels } from '../data/speechLevels';
import type { MascotState } from '../data/mascotConfig';
import { useProgress } from '../store/ProgressContext';
import { AdaptiveBadge } from '../components/game/AdaptiveBadge';

const HEADING_FONT = '"Fredoka One", "Arial Rounded MT Bold", "Varela Round", "Comic Sans MS", sans-serif';
const BODY_FONT = '"Nunito", "Quicksand", "Segoe UI Rounded", "Comic Sans MS", sans-serif';

// Math for the Duolingo Wavy Path
const PATH_OFFSETS = [0, 80, 130, 80, 0, -80, -130, -80, 0, 80]; // Sine wave points
const Y_SPACING = 150;
const NODE_SIZE = 110;
const NODE_CENTER_Y = NODE_SIZE / 2;
const MAP_WIDTH = 400;
const CENTER_X = MAP_WIDTH / 2;

export function SpeechTherapyRoute() {
  const { getProgress, completeLevel, startSession, endSession } = useProgress();
  const { recommendedDifficulty, performanceScore, recordEvent, isLoading: adaptiveLoading } = useAdaptive('speech-playground');
  const [currentView, setCurrentView] = useState<'map' | 'game'>('map');
  const [unlockedLevel, setUnlockedLevel] = useState(0);
  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  const [score, setScore] = useState(0); 
  
  const [showWin, setShowWin] = useState(false);
  const [isWrongShake, setIsWrongShake] = useState(false);

  const { transcript, isListening, startSpeechRecognition, stopEverything, setTranscript, setPronunciationScore } = useSpeechAudio();

  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [mascotLine, setMascotLine] = useState('Welcome to Speech Magic!');
  const [mascotNonce, setMascotNonce] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const winTriggeredRef = useRef(false);
  const evaluationTimerRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>('');
  const progressLoadedRef = useRef(false);

  const levelStartTimeRef = useRef<number>(Date.now());

  const activeLevel = speechLevels[activeLevelIndex];

  // Load saved progress from server on mount
  useEffect(() => {
    if (progressLoadedRef.current) return;
    progressLoadedRef.current = true;
    getProgress('speech-playground').then(progress => {
      if (progress.maxLevelUnlocked > 0) {
        setUnlockedLevel(Math.min(progress.maxLevelUnlocked, speechLevels.length - 1));
        setScore(progress.starsEarned || 0);
      }
    });
  }, [getProgress]);

  const playSound = useCallback((type: 'win' | 'wrong') => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioContextRef.current && AudioCtx) audioContextRef.current = new AudioCtx();
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === 'suspended') ctx?.resume();

    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);

    if (type === 'wrong') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'win') {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'triangle'; o.frequency.setValueAtTime(freq, ctx.currentTime + (i * 0.1));
        g.gain.setValueAtTime(0.2, ctx.currentTime + (i * 0.1)); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i * 0.1) + 0.6);
        o.start(ctx.currentTime + (i * 0.1)); o.stop(ctx.currentTime + (i * 0.1) + 0.6);
      });
    }
  }, []);

  const speak = useCallback((text: string, state: MascotState, rate = 1.0) => {
    setMascotLine(text); setMascotState(state); setMascotNonce(n => n + 1);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.3; utterance.rate = rate; // Keep rate steady and clear
      utterance.onend = () => { setMascotState('idle'); setMascotNonce(n => n + 1); };
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    if (currentView === 'map') {
      speak('Choose a magical path to practice your words!', 'happy');
      stopEverything();
    }
  }, [currentView, speak, stopEverything]);

  const startGame = (index: number) => {
    winTriggeredRef.current = false;
    levelStartTimeRef.current = Date.now();
    setActiveLevelIndex(index);
    setCurrentView('game');
    setShowWin(false);
    setIsWrongShake(false);
    setTranscript('');
    setPronunciationScore(0);
    
    const level = speechLevels[index];
    speak(`Let's practice! Say "${level.targetWord}" clearly and perfectly.`, 'idle');

    // Start a game session for analytics
    startSession('speech-playground', level.id).then(id => {
      sessionIdRef.current = id;
    });
  };

  const triggerWin = useCallback(() => {
    if (winTriggeredRef.current) return;
    winTriggeredRef.current = true;

    setShowWin(true);
    stopEverything();
    playSound('win');
    setScore(s => s + 10);
    speak(`Perfect! You said "${activeLevel.targetWord}" beautifully!`, 'happy');
    
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#fde047', '#4ade80', '#38bdf8', '#f472b6'] });
    
    if (activeLevelIndex >= unlockedLevel && unlockedLevel < speechLevels.length - 1) {
      setUnlockedLevel(activeLevelIndex + 1);
    }

    // Save level completion to server
    completeLevel('speech-playground', {
      levelId: activeLevel.id,
      levelIndex: activeLevelIndex,
      stars: 10,
      score: 10,
      totalLevels: speechLevels.length,
      subjectId: 'speech',
    }).catch(err => console.error('Failed to save progress:', err));

    // Record adaptive event (ML feedback loop)
    const timeSpent = Math.round((Date.now() - levelStartTimeRef.current) / 1000);
    recordEvent({
      levelId: activeLevel.id,
      correct: true,
      timeSeconds: timeSpent,
      attempts: 1,
      pronunciationScore: 85, // Speech scored as pass if triggered win
    });

    // End session
    if (sessionIdRef.current) {
      endSession('speech-playground', sessionIdRef.current, 'completed', {
        targetWord: activeLevel.targetWord,
      });
    }

    setTimeout(() => {
      setShowWin(false); 
      setCurrentView('map');
    }, 4000);
  }, [activeLevel, activeLevelIndex, playSound, speak, stopEverything, unlockedLevel, completeLevel, endSession]);

  // Start Mic ONCE when the level loads
  useEffect(() => {
    if (currentView === 'game' && !showWin && !isWrongShake) {
      startSpeechRecognition(activeLevel.targetWord);
    }
    return () => stopEverything();
  }, [currentView, showWin, activeLevel, startSpeechRecognition, stopEverything]);

  // --- THE SMART STRICT EVALUATION ENGINE ---
  useEffect(() => {
    if (currentView !== 'game' || showWin || !transcript || isWrongShake) return;

    const cleanTranscript = transcript.trim().toLowerCase().replace(/[.,!?]/g, '');
    const targetWord = activeLevel.targetWord.trim().toLowerCase();

    // 1. INSTANT STRICT WIN: Must match perfectly. Even one misspelled letter is rejected.
    if (cleanTranscript === targetWord) {
      if (evaluationTimerRef.current) clearTimeout(evaluationTimerRef.current);
      triggerWin();
      return;
    }

    // 2. WAIT FOR SILENCE: Prevents firing the error while the child is still speaking
    if (evaluationTimerRef.current) clearTimeout(evaluationTimerRef.current);

    evaluationTimerRef.current = window.setTimeout(() => {
      // If we reach here, they stopped speaking and it wasn't a perfect match.
      setIsWrongShake(true);
      playSound('wrong');
      speak(`I heard "${transcript}". Let's try again! Say "${activeLevel.targetWord}" correctly.`, 'thinking');
      
      // Remove red shake UI after a quick moment
      setTimeout(() => setIsWrongShake(false), 600);
      
      // Wait for mascot to finish giving feedback, then completely reset for another try
      setTimeout(() => {
        setTranscript('');
        setPronunciationScore(0);
        startSpeechRecognition(activeLevel.targetWord); // Completely fresh mic connection
      }, 3500);

    }, 1500); // 1.5 seconds of silence triggers the error checking

    return () => {
      if (evaluationTimerRef.current) clearTimeout(evaluationTimerRef.current);
    };
  }, [transcript, currentView, showWin, isWrongShake, activeLevel, triggerWin, playSound, speak, setTranscript, setPronunciationScore, startSpeechRecognition]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-sky-200">
      <img src="/gardenbg2.jpeg" alt="Garden Theme" className="absolute inset-0 h-full w-full object-cover scale-105 blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400/40 via-transparent to-lime-400/50 backdrop-blur-[1px]" /> 

      {/* Top HUD with Coins */}
      <div className="relative z-10 flex justify-between items-center p-6 sm:px-12">
        <Link to="/" onClick={stopEverything} className="rounded-full border-[5px] border-white bg-pink-400 px-6 py-3 text-xl font-black text-white shadow-[0_8px_0_rgba(190,24,93,0.8)] hover:translate-y-1 hover:shadow-none transition-all" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
          Back Home
        </Link>
        
        <div className="flex items-center gap-3">
          <AdaptiveBadge difficulty={recommendedDifficulty} performanceScore={performanceScore} isLoading={adaptiveLoading} />
          <div className="flex items-center gap-4 rounded-3xl border-[5px] border-white bg-yellow-300 px-6 py-2 shadow-[0_8px_0_rgba(161,98,7,0.8)]">
            <span className="text-4xl animate-pulse">⭐</span>
            <span className="text-4xl font-black text-yellow-950" style={{ fontFamily: '"Comic Sans MS", cursive' }}>{score}</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center pt-2 overflow-y-auto max-h-[90vh]">
        
        {/* --- MAP VIEW --- */}
        {currentView === 'map' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center w-full mt-4 pb-32">
             <div className="rounded-[40px] border-[8px] border-white bg-violet-500/90 px-12 py-6 shadow-[0_15px_0_rgba(76,29,149,0.8)] backdrop-blur-sm mb-12">
               <h2 className="text-5xl font-black text-white text-center tracking-wide" style={{ fontFamily: HEADING_FONT, WebkitTextStroke: '3px #d8b4fe', textShadow: '0 6px 0 rgba(0,0,0,0.15)' }}>
                 Speech Journey
               </h2>
             </div>

             {/* THE PERFECT WAVY PATH */}
             <div className="relative" style={{ width: `${MAP_WIDTH}px`, height: `${speechLevels.length * Y_SPACING}px` }}>
                
                {/* SVG Background Path */}
                <svg className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
                  {speechLevels.map((_, i) => {
                    if (i === speechLevels.length - 1) return null;
                    return (
                      <line
                        key={`line-${i}`}
                        x1={CENTER_X + PATH_OFFSETS[i]}
                        y1={NODE_CENTER_Y + i * Y_SPACING}
                        x2={CENTER_X + PATH_OFFSETS[i+1]}
                        y2={NODE_CENTER_Y + (i + 1) * Y_SPACING}
                        stroke="rgba(255,255,255,0.6)"
                        strokeWidth="24"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
                
                {/* Interactive Level Nodes */}
                {speechLevels.map((level, i) => {
                  const isUnlocked = i <= unlockedLevel;
                  const isCurrent = i === unlockedLevel;
                  return (
                    <motion.button
                      key={level.id}
                      whileHover={isUnlocked ? { scale: 1.1, rotate: (i%2===0?4:-4) } : {}}
                      onClick={() => isUnlocked && startGame(i)}
                      className={`absolute z-10 flex items-center justify-center rounded-full border-[8px] border-white h-[110px] w-[110px] shadow-[0_12px_0_rgba(0,0,0,0.25)] transition-all
                        ${isUnlocked ? (i%2===0 ? 'bg-yellow-400' : 'bg-pink-400') : 'bg-slate-300 grayscale'}
                        ${isCurrent ? 'ring-8 ring-white/50 ring-offset-4 animate-pulse' : ''}
                      `}
                      style={{ 
                        left: `${CENTER_X + PATH_OFFSETS[i]}px`, 
                        top: `${i * Y_SPACING}px`,
                        transform: 'translateX(-50%)' // Center the button on the point
                      }}
                    >
                       <span className="text-5xl drop-shadow-md">{level.emoji}</span>
                       {!isUnlocked && <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center"><span className="text-3xl">🔒</span></div>}
                    </motion.button>
                  );
                })}
             </div>
          </motion.div>
        )}

        {/* --- GAME VIEW --- */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-15px) rotate(-4deg); }
            50% { transform: translateX(15px) rotate(4deg); }
            75% { transform: translateX(-15px) rotate(-4deg); }
          }
        `}} />

        {currentView === 'game' && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center w-full max-w-3xl mt-10">
             
             <div 
               className={`rounded-[50px] border-[8px] border-white bg-white/95 px-12 py-10 shadow-[0_20px_0_rgba(0,0,0,0.15)] backdrop-blur-md text-center w-full transition-colors duration-300
                 ${isWrongShake ? 'bg-rose-100 border-rose-400' : ''}
               `}
               style={{
                 animation: isWrongShake ? 'shake 0.5s ease-in-out' : 'none'
               }}
             >
               <h2 className="text-4xl font-black text-slate-800" style={{ fontFamily: BODY_FONT }}>{activeLevel.instruction}</h2>
               
               <motion.div 
                 animate={isListening ? { y: [0, -15, 0] } : {}}
                 transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                 className="text-[140px] my-6 drop-shadow-2xl inline-block"
               >
                 {activeLevel.emoji}
               </motion.div>

               <div className="mt-4 w-full flex flex-col items-center">
                 <motion.div 
                   animate={isListening && !isWrongShake ? { scale: [1, 1.15, 1], boxShadow: ['0 0 0 rgba(74,222,128,0)', '0 0 30px rgba(74,222,128,0.8)', '0 0 0 rgba(74,222,128,0)'] } : {}}
                   transition={{ repeat: Infinity, duration: 1.5 }}
                   className={`rounded-full border-[6px] border-white p-5 shadow-lg mb-6 ${isWrongShake ? 'bg-rose-400' : 'bg-green-400'}`}
                 >
                   <span className="text-5xl">{isWrongShake ? '🛑' : '🎙️'}</span>
                 </motion.div>
                 
                 <p className="text-2xl font-bold text-slate-500 mb-4" style={{ fontFamily: BODY_FONT }}>
                   {isWrongShake ? "Oops! Listen and try again." : 
                    isListening ? "Listening... say the word loud and clear!" : "Getting microphone ready..."}
                 </p>

                 {/* Real-time Feedback Display */}
                 <div className="min-h-[80px] flex items-center justify-center">
                   {transcript ? (
                     <div className={`px-8 py-3 rounded-full border-4 border-white shadow-md transition-colors duration-300
                       ${isWrongShake ? 'bg-rose-400 text-white' : 'bg-sky-100 text-sky-700'}
                     `}>
                       <p className="text-3xl font-black capitalize" style={{ fontFamily: HEADING_FONT }}>
                         {isWrongShake ? `I heard: "${transcript}"` : `"${transcript}"`}
                       </p>
                     </div>
                   ) : (
                     <p className="text-2xl font-black text-slate-300 uppercase tracking-widest" style={{ fontFamily: HEADING_FONT }}>
                       Target: {activeLevel.targetWord}
                     </p>
                   )}
                 </div>
               </div>
             </div>

          </motion.div>
        )}
      </div>

      {/* WIN OVERLAY */}
      <AnimatePresence>
        {showWin && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            transition={{ type: 'spring', bounce: 0.6 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md pointer-events-auto"
          >
            <div className="flex flex-col items-center rounded-[50px] border-[10px] border-white bg-gradient-to-b from-green-300 to-emerald-500 p-12 shadow-[0_25px_0_rgba(6,78,59,0.8)]">
              <span className="text-[160px] drop-shadow-2xl animate-bounce">🎉</span>
              <h2 className="mt-4 text-7xl font-black text-white text-center tracking-wide" style={{ fontFamily: HEADING_FONT, WebkitTextStroke: '4px #064e3b', textShadow: '0 8px 0 rgba(0,0,0,0.2)' }}>
                PERFECT!
              </h2>
              <div className="mt-6 rounded-full border-4 border-white bg-white px-8 py-3 shadow-[0_6px_0_rgba(6,78,59,0.8)]">
                 <p className="text-3xl font-black text-emerald-600" style={{ fontFamily: HEADING_FONT }}>+10 Stars! ⭐</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Mascot state={mascotState} line={mascotLine} nonce={mascotNonce} />
    </main>
  );
}