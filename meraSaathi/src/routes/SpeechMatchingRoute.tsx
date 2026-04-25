import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mascot } from '../components/home/Mascot';
import { useSpeechAudio } from '../hooks/useSpeechAudio';
import { matchingLevels, MatchingLevel, MatchingPair } from '../data/speechMatchingLevels';
import type { MascotState } from '../data/mascotConfig';

const HEADING_FONT = '"Fredoka One", "Arial Rounded MT Bold", "Varela Round", "Comic Sans MS", sans-serif';
const BODY_FONT = '"Nunito", "Quicksand", "Segoe UI Rounded", "Comic Sans MS", sans-serif';

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function SpeechMatchingRoute() {
  const [currentView, setCurrentView] = useState<'map' | 'game'>('map');
  const [unlockedLevel, setUnlockedLevel] = useState(matchingLevels.length - 1);
  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  const [score, setScore] = useState(0); 
  
  const [showWin, setShowWin] = useState(false);
  const [isWrongShake, setIsWrongShake] = useState(false);

  const { transcript, isListening, startSpeechRecognition, stopEverything, setTranscript, setPronunciationScore, pronunciationScore } = useSpeechAudio();

  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [mascotLine, setMascotLine] = useState('Welcome to Categorize It!');
  const [mascotNonce, setMascotNonce] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const winTriggeredRef = useRef(false);
  const evaluationTimerRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);

  // Game state
  const activeLevel = matchingLevels[activeLevelIndex];
  const [shuffledCategories, setShuffledCategories] = useState<MatchingPair[]>([]);
  const [shuffledObjects, setShuffledObjects] = useState<MatchingPair[]>([]);
  const [currentPairIndex, setCurrentPairIndex] = useState(0); // Which object from the original array is Gugglo asking about
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  
  // Refs for drawing lines
  const leftRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const rightRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lines, setLines] = useState<{ id: string, x1: number, y1: number, x2: number, y2: number }[]>([]);

  const playSound = useCallback((type: 'win' | 'wrong' | 'match') => {
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
    } else if (type === 'match') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'win') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'triangle'; o.frequency.setValueAtTime(freq, ctx.currentTime + (i * 0.1));
        g.gain.setValueAtTime(0.2, ctx.currentTime + (i * 0.1)); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i * 0.1) + 0.6);
        o.start(ctx.currentTime + (i * 0.1)); o.stop(ctx.currentTime + (i * 0.1) + 0.6);
      });
    }
  }, []);

  const speak = useCallback((text: string, state: MascotState, rate = 1.0) => {
    return new Promise<void>((resolve) => {
      setMascotLine(text); setMascotState(state); setMascotNonce(n => n + 1);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 1.3; utterance.rate = rate;
        utterance.onend = () => { setMascotState('idle'); setMascotNonce(n => n + 1); resolve(); };
        utterance.onerror = () => { setMascotState('idle'); setMascotNonce(n => n + 1); resolve(); };
        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  }, []);

  useEffect(() => {
    if (currentView === 'map') {
      speak('Choose a category level to match!', 'happy');
      stopEverything();
    }
  }, [currentView, speak, stopEverything]);

  const updateLines = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines = matchedIds.map(id => {
      const leftEl = leftRefs.current[id];
      const rightEl = rightRefs.current[id];
      if (!leftEl || !rightEl) return null;
      
      const leftRect = leftEl.getBoundingClientRect();
      const rightRect = rightEl.getBoundingClientRect();
      
      return {
        id,
        x1: leftRect.right - containerRect.left,
        y1: leftRect.top + leftRect.height / 2 - containerRect.top,
        x2: rightRect.left - containerRect.left,
        y2: rightRect.top + rightRect.height / 2 - containerRect.top,
      };
    }).filter(Boolean) as any[];
    setLines(newLines);
  }, [matchedIds]);

  useEffect(() => {
    updateLines();
    const t1 = setTimeout(updateLines, 50);
    const t2 = setTimeout(updateLines, 500);
    window.addEventListener('resize', updateLines);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', updateLines);
    };
  }, [updateLines]);

  const askTarget = useCallback((target: MatchingPair, isFirst: boolean) => {
    stopEverything();
    const phrase = isFirst 
      ? `Match the objects! Where does the ${target.objectName} go?`
      : `Where does the ${target.objectName} go?`;
    
    speak(phrase, 'idle').then(() => {
      if (winTriggeredRef.current) return;
      startSpeechRecognition(target.categoryName);
    });
  }, [speak, stopEverything, startSpeechRecognition]);

  const startGame = (index: number) => {
    winTriggeredRef.current = false;
    isTransitioningRef.current = false;
    setActiveLevelIndex(index);
    setCurrentView('game');
    setShowWin(false);
    setIsWrongShake(false);
    setTranscript('');
    setPronunciationScore(0);
    setMatchedIds([]);
    setLines([]);
    
    const level = matchingLevels[index];
    setShuffledCategories(shuffleArray(level.pairs));
    setShuffledObjects(shuffleArray(level.pairs));
    setCurrentPairIndex(0);
    
    askTarget(level.pairs[0], true);
  };

  const currentTarget = activeLevel?.pairs[currentPairIndex];

  const triggerLevelWin = useCallback(() => {
    if (winTriggeredRef.current) return;
    winTriggeredRef.current = true;

    setShowWin(true);
    stopEverything();
    playSound('win');
    speak(`Amazing job! You matched all the items!`, 'happy');
    
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 }, colors: ['#fde047', '#4ade80', '#38bdf8', '#f472b6', '#a855f7'] });
    
    if (activeLevelIndex >= unlockedLevel && unlockedLevel < matchingLevels.length - 1) {
      setUnlockedLevel(activeLevelIndex + 1);
    }

    setTimeout(() => {
      setShowWin(false); 
      setCurrentView('map');
    }, 4500);
  }, [activeLevelIndex, playSound, speak, stopEverything, unlockedLevel]);

  // Handle Speech Evaluation
  useEffect(() => {
    if (currentView !== 'game' || showWin || !transcript || isWrongShake || !currentTarget || isTransitioningRef.current) return;

    const cleanTranscript = transcript.trim().toLowerCase().replace(/[.,!?]/g, '');
    const expectedCategory = currentTarget.categoryName.trim().toLowerCase();

    // Map common speech recognition variants and plurals
    const homophones: Record<string, string[]> = {
      'meat': ['meet', 'meats'],
      'dessert': ['desert', 'deserts', 'desserts'],
      'vegetable': ['vegetables', 'veg', 'veggie', 'veggies'],
      'road': ['rode', 'roads'],
      'track': ['truck', 'tracks', 'tract'],
      'rain': ['reign', 'raining', 'rains'],
      'drink': ['drinks', 'drinking'],
      'sunny': ['sun', 'sonny'],
      'bird': ['birds'],
      'animal': ['animals'],
      'insect': ['insects'],
      'fish': ['fishes'],
      'reptile': ['reptiles'],
      'fruit': ['fruits'],
      'yellow': ['yello'],
      'white': ['weight', 'wipe'],
      'cold': ['coal', 'called', 'cool']
    };

    const isMatch = cleanTranscript === expectedCategory || 
                    cleanTranscript.includes(expectedCategory) ||
                    (homophones[expectedCategory] && homophones[expectedCategory].some(h => cleanTranscript.includes(h))) ||
                    pronunciationScore >= 75;

    if (isMatch) {
      isTransitioningRef.current = true;
      if (evaluationTimerRef.current) clearTimeout(evaluationTimerRef.current);
      
      // Match successful!
      playSound('match');
      setScore(s => s + 5);
      setMatchedIds(prev => [...prev, currentTarget.id]);
      stopEverything();
      
      confetti({
        particleCount: 40, spread: 60, origin: { y: 0.6 },
        colors: ['#4ade80', '#fde047']
      });

      if (currentPairIndex < activeLevel.pairs.length - 1) {
        // Move to next pair
        const nextTarget = activeLevel.pairs[currentPairIndex + 1];
        
        setTimeout(() => {
          setCurrentPairIndex(prev => prev + 1);
          setTranscript('');
          setPronunciationScore(0);
          isTransitioningRef.current = false;
          askTarget(nextTarget, false);
        }, 1500);
      } else {
        // Level complete
        triggerLevelWin();
      }
      return;
    }

    if (evaluationTimerRef.current) clearTimeout(evaluationTimerRef.current);

    evaluationTimerRef.current = window.setTimeout(() => {
      stopEverything();
      setIsWrongShake(true);
      playSound('wrong');
      speak(`Oops! That's not the match for the ${currentTarget.objectName}. Try again!`, 'thinking').then(() => {
        setIsWrongShake(false);
        setTranscript('');
        setPronunciationScore(0);
        if (!winTriggeredRef.current) {
          startSpeechRecognition(currentTarget.categoryName);
        }
      });
    }, 2500);

    return () => {
      if (evaluationTimerRef.current) clearTimeout(evaluationTimerRef.current);
    };
  }, [transcript, currentView, showWin, isWrongShake, currentTarget, activeLevel, currentPairIndex, triggerLevelWin, playSound, speak, setTranscript, setPronunciationScore, startSpeechRecognition, askTarget, stopEverything]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-indigo-50">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/50 via-purple-200/50 to-pink-200/50" /> 

      {/* Top HUD */}
      <div className="relative z-10 flex justify-between items-center p-6 sm:px-12">
        <Link to="/" onClick={stopEverything} className="rounded-full border-[5px] border-white bg-pink-400 px-6 py-3 text-xl font-black text-white shadow-[0_8px_0_rgba(190,24,93,0.8)] hover:translate-y-1 hover:shadow-none transition-all" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
          Back Home
        </Link>
        
        <div className="flex items-center gap-4 rounded-3xl border-[5px] border-white bg-yellow-300 px-6 py-2 shadow-[0_8px_0_rgba(161,98,7,0.8)]">
          <span className="text-4xl animate-pulse">⭐</span>
          <span className="text-4xl font-black text-yellow-950" style={{ fontFamily: '"Comic Sans MS", cursive' }}>{score}</span>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center pt-2 overflow-y-auto max-h-[90vh]">
        
        {/* --- MAP VIEW --- */}
        {currentView === 'map' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center w-full mt-4 pb-32">
             <div className="rounded-[40px] border-[8px] border-white bg-indigo-500/90 px-12 py-6 shadow-[0_15px_0_rgba(79,70,229,0.8)] backdrop-blur-sm mb-12">
               <h2 className="text-5xl font-black text-white text-center tracking-wide" style={{ fontFamily: HEADING_FONT, WebkitTextStroke: '3px #4338ca', textShadow: '0 6px 0 rgba(0,0,0,0.15)' }}>
                 Categorize It!
               </h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl px-8">
               {matchingLevels.map((level, i) => {
                 const isUnlocked = i <= unlockedLevel;
                 return (
                   <motion.button
                     key={level.id}
                     whileHover={isUnlocked ? { scale: 1.05, y: -5 } : {}}
                     onClick={() => isUnlocked && startGame(i)}
                     className={`relative flex flex-col items-center justify-center rounded-[40px] border-[6px] border-white p-8 shadow-[0_12px_0_rgba(0,0,0,0.2)] transition-all
                       ${isUnlocked ? 'bg-gradient-to-br from-white to-indigo-100 hover:shadow-[0_4px_0_rgba(0,0,0,0.2)]' : 'bg-slate-200 grayscale opacity-80'}
                     `}
                   >
                     <div className="text-6xl mb-4 drop-shadow-md">{level.pairs[0].objectEmoji}</div>
                     <h3 className="text-2xl font-black text-indigo-950 text-center" style={{ fontFamily: HEADING_FONT }}>{level.title}</h3>
                     {!isUnlocked && (
                       <div className="absolute inset-0 bg-slate-900/10 rounded-[34px] flex items-center justify-center backdrop-blur-[1px]">
                         <span className="text-5xl drop-shadow-lg">🔒</span>
                       </div>
                     )}
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
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center w-full max-w-6xl mt-2 px-6 pb-20">
             
             <div 
               className={`rounded-[40px] border-[8px] border-white bg-white/95 px-8 py-6 shadow-[0_15px_0_rgba(0,0,0,0.15)] backdrop-blur-md text-center w-full mb-8 transition-colors duration-300
                 ${isWrongShake ? 'bg-rose-100 border-rose-400' : ''}
               `}
               style={{ animation: isWrongShake ? 'shake 0.5s ease-in-out' : 'none' }}
             >
                <div className="flex justify-between items-center w-full">
                  <div className="w-1/3 flex items-center justify-start gap-4">
                     <motion.div 
                       animate={isListening && !isWrongShake ? { scale: [1, 1.15, 1], boxShadow: ['0 0 0 rgba(74,222,128,0)', '0 0 20px rgba(74,222,128,0.6)', '0 0 0 rgba(74,222,128,0)'] } : {}}
                       transition={{ repeat: Infinity, duration: 1.5 }}
                       className={`rounded-full border-[4px] border-white p-3 shadow-md ${isWrongShake ? 'bg-rose-400' : 'bg-green-400'}`}
                     >
                       <span className="text-3xl">{isWrongShake ? '🛑' : '🎙️'}</span>
                     </motion.div>
                     <p className="text-xl font-bold text-slate-500" style={{ fontFamily: BODY_FONT }}>
                       {isWrongShake ? "Oops! Listen and try again." : 
                        isListening ? "Listening..." : "Getting ready..."}
                     </p>
                  </div>

                  <div className="w-1/3 text-center">
                    {transcript && (
                       <div className={`inline-block px-6 py-2 rounded-full border-4 border-white shadow-sm transition-colors duration-300
                         ${isWrongShake ? 'bg-rose-400 text-white' : 'bg-indigo-100 text-indigo-700'}
                       `}>
                         <p className="text-2xl font-black capitalize" style={{ fontFamily: HEADING_FONT }}>"{transcript}"</p>
                       </div>
                    )}
                  </div>

                  <div className="w-1/3 text-right">
                     <h2 className="text-3xl font-black text-slate-800" style={{ fontFamily: BODY_FONT }}>{activeLevel.title}</h2>
                  </div>
                </div>
             </div>

             {/* Matching Board */}
             <div className="relative w-full flex justify-between" ref={containerRef}>
                
                {/* SVG Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#4ade80" />
                    </marker>
                  </defs>
                  <AnimatePresence>
                    {lines.map((line, idx) => (
                      <motion.line
                        key={line.id}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                        stroke="#4ade80" strokeWidth="8" strokeLinecap="round" strokeDasharray="16, 12"
                        markerEnd="url(#arrowhead)"
                      />
                    ))}
                  </AnimatePresence>
                </svg>

                {/* Left Side: Categories */}
                <div className="w-[40%] flex flex-col gap-6 relative z-20">
                  {shuffledCategories.map((pair) => {
                    const isMatched = matchedIds.includes(pair.id);
                    return (
                      <div 
                        key={`cat-${pair.id}`} 
                        ref={el => leftRefs.current[pair.id] = el}
                        className={`rounded-[30px] border-[6px] p-6 flex items-center justify-between transition-all duration-500
                          ${isMatched ? 'bg-green-100 border-green-400 opacity-90 shadow-inner' : 'bg-white border-indigo-200 shadow-[0_8px_0_rgba(199,210,254,0.8)] hover:border-indigo-400'}
                        `}
                      >
                        <span className="text-5xl bg-white rounded-full p-2 shadow-sm">{pair.categoryEmoji}</span>
                        <span className="text-4xl font-black text-slate-700" style={{ fontFamily: HEADING_FONT }}>{pair.categoryName}</span>
                        {isMatched && <span className="text-3xl animate-bounce">⭐</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Right Side: Objects */}
                <div className="w-[40%] flex flex-col gap-6 relative z-20">
                  {shuffledObjects.map((pair) => {
                    const isMatched = matchedIds.includes(pair.id);
                    const isCurrentTarget = currentTarget?.id === pair.id;
                    
                    return (
                      <div 
                        key={`obj-${pair.id}`} 
                        ref={el => rightRefs.current[pair.id] = el}
                        className={`rounded-[30px] border-[6px] p-6 flex items-center justify-between transition-all duration-500
                          ${isMatched ? 'bg-green-100 border-green-400 opacity-90 shadow-inner' : 
                            isCurrentTarget ? 'bg-amber-100 border-amber-400 ring-8 ring-amber-400/30 ring-offset-2 animate-pulse scale-105 shadow-[0_12px_0_rgba(251,191,36,0.6)]' : 
                            'bg-white border-indigo-200 shadow-[0_8px_0_rgba(199,210,254,0.8)]'}
                        `}
                      >
                        {isMatched && <span className="text-3xl animate-bounce">⭐</span>}
                        <span className="text-4xl font-black text-slate-700" style={{ fontFamily: HEADING_FONT }}>{pair.objectName}</span>
                        <span className={`text-6xl bg-white rounded-full p-2 shadow-sm ${isCurrentTarget && !isMatched ? 'scale-125 transition-transform' : ''}`}>
                          {pair.objectEmoji}
                        </span>
                      </div>
                    );
                  })}
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
                LEVEL CLEARED!
              </h2>
              <div className="mt-6 rounded-full border-4 border-white bg-white px-8 py-3 shadow-[0_6px_0_rgba(6,78,59,0.8)]">
                 <p className="text-3xl font-black text-emerald-600" style={{ fontFamily: HEADING_FONT }}>All Matched! ⭐</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Mascot state={mascotState} line={mascotLine} nonce={mascotNonce} />
    </main>
  );
}
