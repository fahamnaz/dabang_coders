import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import { Planet } from '../data/planets';
import { createRewardNotification } from '../utils/parentNotifications';

export type GameMode = 'DISCOVERY' | 'ORDER' | 'FIND' | 'GALAXY';
export type SFXType = 'hover' | 'grab' | 'snap' | 'success' | 'error' | 'warp' | 'levelUp';

interface GameState {
  // Core State
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  aiMessage: string;
  setAiMessage: (msg: string) => void;
  targetPlanet: Planet | null;
  setTargetPlanet: (planet: Planet | null) => void;
  
  // God Level Gamification
  score: number;
  streak: number;
  multiplier: number;
  addScore: (basePoints: number) => void;
  resetStreak: () => void;
  
  // Cinematic Global Events
  isTransitioning: boolean;
  triggerModeChange: (newMode: GameMode) => void;

  // Integrated Audio Engine
  playSFX: (type: SFXType) => void;
}

const GameContext = createContext<GameState | undefined>(undefined);

// Define audio assets (You can replace these URLs with your own high-quality .mp3 or .wav files)
const SOUND_ASSETS: Record<SFXType, string> = {
  hover: 'https://cdn.freesound.org/previews/442/442969_9159316-lq.mp3', // Soft futuristic blip
  grab: 'https://cdn.freesound.org/previews/513/513145_11099684-lq.mp3', // Deep haptic thud
  snap: 'https://cdn.freesound.org/previews/404/404743_1407371-lq.mp3', // Magnetic click
  success: 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3', // Happy chime
  error: 'https://cdn.freesound.org/previews/142/142608_1840739-lq.mp3', // Soft buzz
  warp: 'https://cdn.freesound.org/previews/156/156897_2302304-lq.mp3', // Sci-fi whoosh
  levelUp: 'https://cdn.freesound.org/previews/274/274180_4564403-lq.mp3' // Epic orchestral hit
};

export function GameProvider({ children }: { children: ReactNode }) {
  // --- CORE STATE ---
  const [mode, setMode] = useState<GameMode>('DISCOVERY');
  const [aiMessage, setAiMessage] = useState<string>("Initializing Spatial Visor...");
  const [targetPlanet, setTargetPlanet] = useState<Planet | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // --- GAMIFICATION STATE ---
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  
  // Calculate multiplier dynamically based on streak (Max 5x)
  const multiplier = Math.min(1 + Math.floor(streak / 3), 5);

  // --- AUDIO ENGINE ---
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // Preload audio files for zero-latency playback
  useEffect(() => {
    Object.entries(SOUND_ASSETS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audioRefs.current[key] = audio;
    });
  }, []);

  const playSFX = useCallback((type: SFXType) => {
    const audio = audioRefs.current[type];
    if (audio) {
      audio.currentTime = 0; // Reset so sounds can overlap if played rapidly
      audio.volume = type === 'hover' ? 0.2 : 0.6; // Mix audio dynamically
      audio.play().catch(e => console.warn("Audio play blocked by browser policy:", e));
    }
  }, []);

  // --- ENHANCED ACTIONS ---
  const addScore = useCallback((basePoints: number) => {
    setScore(prev => prev + (basePoints * multiplier));
    const totalPoints = basePoints * multiplier;
    const rewardDetailByMode: Record<GameMode, string> = {
      DISCOVERY: `earned ${totalPoints} stars while exploring space concepts.`,
      FIND: `found the correct planet and earned ${totalPoints} stars.`,
      ORDER: `placed a planet correctly and earned ${totalPoints} stars.`,
      GALAXY: `made space progress and earned ${totalPoints} stars.`,
    };
    createRewardNotification('earned a space reward', rewardDetailByMode[mode], 'success', '🚀');
    setStreak(prev => {
      const newStreak = prev + 1;
      // Play a special sound if they hit a multiplier milestone!
      if (newStreak > 0 && newStreak % 3 === 0) playSFX('levelUp');
      return newStreak;
    });
  }, [mode, multiplier, playSFX]);

  const resetStreak = useCallback(() => {
    if (streak > 0) playSFX('error');
    setStreak(0);
  }, [streak, playSFX]);

  // Cinematic Mode Transition Handler
  const triggerModeChange = useCallback((newMode: GameMode) => {
    setIsTransitioning(true);
    playSFX('warp');
    
    // Allow UI to animate out for 800ms before snapping the state
    setTimeout(() => {
      setMode(newMode);
      setStreak(0); // Reset streaks on mode change
      
      // Allow UI to animate in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, 800);
  }, [playSFX]);

  return (
    <GameContext.Provider value={{
      mode, 
      setMode, // Kept for raw overrides, but prefer triggerModeChange
      triggerModeChange,
      isTransitioning,
      aiMessage, 
      setAiMessage,
      targetPlanet, 
      setTargetPlanet,
      score, 
      addScore,
      streak,
      multiplier,
      resetStreak,
      playSFX
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
}
