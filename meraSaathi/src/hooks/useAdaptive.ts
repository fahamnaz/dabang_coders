import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../store/AuthContext';

interface AdaptiveState {
  performanceScore: number;
  recommendedDifficulty: 'easy' | 'medium' | 'hard';
  consecutiveCorrect: number;
  totalEvents: number;
  message: string;
  isLoading: boolean;
}

interface RecordEventData {
  levelId: string;
  correct: boolean;
  timeSeconds: number;
  attempts?: number;
  pronunciationScore?: number;
}

interface RecordResult {
  performanceScore: number;
  recommendedDifficulty: 'easy' | 'medium' | 'hard';
  consecutiveCorrect: number;
  difficultyChanged: boolean;
  feedback: string;
}

export function useAdaptive(gameId: string) {
  const { user } = useAuth();
  const [state, setState] = useState<AdaptiveState>({
    performanceScore: 0,
    recommendedDifficulty: 'easy',
    consecutiveCorrect: 0,
    totalEvents: 0,
    message: '',
    isLoading: true,
  });

  const loadedRef = useRef(false);

  // Fetch current recommendation on mount
  useEffect(() => {
    if (loadedRef.current || !user) return;
    loadedRef.current = true;

    api.get(`/adaptive/${gameId}`)
      .then(data => {
        setState({
          performanceScore: data.performanceScore || 0,
          recommendedDifficulty: data.recommendedDifficulty || 'easy',
          consecutiveCorrect: data.consecutiveCorrect || 0,
          totalEvents: data.totalEvents || 0,
          message: data.message || '',
          isLoading: false,
        });
      })
      .catch(err => {
        console.error('Failed to load adaptive data:', err);
        setState(prev => ({ ...prev, isLoading: false }));
      });
  }, [gameId, user]);

  // Record a performance event
  const recordEvent = useCallback(async (data: RecordEventData): Promise<RecordResult | null> => {
    if (!user) return null;

    try {
      const result = await api.post(`/adaptive/${gameId}/record`, data);
      
      setState(prev => ({
        ...prev,
        performanceScore: result.performanceScore,
        recommendedDifficulty: result.recommendedDifficulty,
        consecutiveCorrect: result.consecutiveCorrect,
        totalEvents: result.totalEvents,
        message: result.feedback || prev.message,
      }));

      return result;
    } catch (err) {
      console.error('Failed to record adaptive event:', err);
      return null;
    }
  }, [gameId, user]);

  return {
    ...state,
    recordEvent,
  };
}
