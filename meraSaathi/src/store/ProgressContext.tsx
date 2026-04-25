import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

interface GameProgress {
  gameId: string;
  currentLevel: number;
  maxLevelUnlocked: number;
  totalLevels: number;
  starsEarned: number;
  attemptsTotal: number;
  correctTotal: number;
  accuracy: number;
  totalPlayTimeSeconds: number;
  levelDetails: Array<{
    levelId: string;
    status: string;
    stars: number;
    attempts: number;
    bestScore: number;
    completedAt: string | null;
  }>;
}

interface NewBadge {
  id: string;
  emoji: string;
  name: string;
  threshold: number;
  earnedAt: string;
}

interface ProgressState {
  getProgress: (gameId: string) => Promise<GameProgress>;
  completeLevel: (gameId: string, data: {
    levelId: string;
    levelIndex?: number;
    stars: number;
    score?: number;
    totalLevels?: number;
    subjectId?: string;
    details?: Record<string, unknown>;
  }) => Promise<{ progress: GameProgress; totalStars: number }>;
  updateMilestone: (gameId: string, data: {
    milestone: number;
    stars: number;
    totalScore?: number;
    subjectId?: string;
  }) => Promise<void>;
  startSession: (gameId: string, levelId?: string) => Promise<string>;
  endSession: (gameId: string, sessionId: string, result?: string, details?: Record<string, unknown>) => Promise<void>;
  checkBadges: () => Promise<NewBadge[]>;
  getAllProgress: () => Promise<GameProgress[]>;
  cachedProgress: Record<string, GameProgress>;
  newBadges: NewBadge[];
  clearNewBadges: () => void;
}

const ProgressContext = createContext<ProgressState | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [cachedProgress, setCachedProgress] = useState<Record<string, GameProgress>>({});
  const [newBadges, setNewBadges] = useState<NewBadge[]>([]);
  const sessionRefs = useRef<Record<string, string>>({});

  const getProgress = useCallback(async (gameId: string): Promise<GameProgress> => {
    if (!isLoggedIn) {
      return {
        gameId, currentLevel: 0, maxLevelUnlocked: 0, totalLevels: 0,
        starsEarned: 0, attemptsTotal: 0, correctTotal: 0, accuracy: 0,
        totalPlayTimeSeconds: 0, levelDetails: [],
      };
    }

    // Return cached if available
    if (cachedProgress[gameId]) return cachedProgress[gameId];

    try {
      const { progress } = await api.get<{ progress: GameProgress }>(`/progress/${gameId}`);
      setCachedProgress(prev => ({ ...prev, [gameId]: progress }));
      return progress;
    } catch {
      return {
        gameId, currentLevel: 0, maxLevelUnlocked: 0, totalLevels: 0,
        starsEarned: 0, attemptsTotal: 0, correctTotal: 0, accuracy: 0,
        totalPlayTimeSeconds: 0, levelDetails: [],
      };
    }
  }, [isLoggedIn, cachedProgress]);

  const completeLevel = useCallback(async (gameId: string, data: {
    levelId: string;
    levelIndex?: number;
    stars: number;
    score?: number;
    totalLevels?: number;
    subjectId?: string;
    details?: Record<string, unknown>;
  }) => {
    const result = await api.post<{ progress: GameProgress; totalStars: number }>(
      `/progress/${gameId}/complete-level`,
      data
    );

    setCachedProgress(prev => ({ ...prev, [gameId]: result.progress }));

    // Check for new badges after earning stars
    setTimeout(() => checkBadges(), 500);

    return result;
  }, []);

  const updateMilestone = useCallback(async (gameId: string, data: {
    milestone: number;
    stars: number;
    totalScore?: number;
    subjectId?: string;
  }) => {
    if (!isLoggedIn) return;
    await api.post(`/progress/${gameId}/update-milestone`, data);

    // Invalidate cache
    setCachedProgress(prev => {
      const next = { ...prev };
      delete next[gameId];
      return next;
    });
  }, [isLoggedIn]);

  const startSession = useCallback(async (gameId: string, levelId?: string): Promise<string> => {
    if (!isLoggedIn) return '';
    try {
      const { sessionId } = await api.post<{ sessionId: string }>(
        `/progress/${gameId}/start-session`,
        { levelId }
      );
      sessionRefs.current[gameId] = sessionId;
      return sessionId;
    } catch {
      return '';
    }
  }, [isLoggedIn]);

  const endSession = useCallback(async (
    gameId: string,
    sessionId: string,
    result?: string,
    details?: Record<string, unknown>
  ) => {
    if (!isLoggedIn || !sessionId) return;
    try {
      await api.post(`/progress/${gameId}/end-session`, {
        sessionId: sessionId || sessionRefs.current[gameId],
        result,
        details,
      });
      delete sessionRefs.current[gameId];
    } catch {
      // Silently fail
    }
  }, [isLoggedIn]);

  const checkBadges = useCallback(async (): Promise<NewBadge[]> => {
    if (!isLoggedIn) return [];
    try {
      const result = await api.post<{ newBadges: NewBadge[] }>('/rewards/check-badges');
      if (result.newBadges.length > 0) {
        setNewBadges(prev => [...prev, ...result.newBadges]);
      }
      return result.newBadges;
    } catch {
      return [];
    }
  }, [isLoggedIn]);

  const getAllProgress = useCallback(async (): Promise<GameProgress[]> => {
    if (!isLoggedIn) return [];
    try {
      const { progress } = await api.get<{ progress: GameProgress[] }>('/progress');
      // Update cache
      const newCache: Record<string, GameProgress> = {};
      progress.forEach(p => { newCache[p.gameId] = p; });
      setCachedProgress(newCache);
      return progress;
    } catch {
      return [];
    }
  }, [isLoggedIn]);

  const clearNewBadges = useCallback(() => {
    setNewBadges([]);
  }, []);

  return (
    <ProgressContext.Provider value={{
      getProgress,
      completeLevel,
      updateMilestone,
      startSession,
      endSession,
      checkBadges,
      getAllProgress,
      cachedProgress,
      newBadges,
      clearNewBadges,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress must be used within ProgressProvider');
  return context;
}
