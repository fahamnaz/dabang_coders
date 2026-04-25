import { useCallback, useEffect, useRef, useState } from 'react';
import { MascotState } from '../data/mascotConfig';

function pickRandom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function useMascotController<T extends string>(phrases: Record<T, readonly string[]>) {
  const [mascotState, setMascotStateValue] = useState<MascotState>('idle');
  const [mascotLine, setMascotLine] = useState('');
  const [mascotNonce, setMascotNonce] = useState(0);

  const speechTimeoutRef = useRef<number | null>(null);
  const mascotResetRef = useRef<number | null>(null);
  const mascotStateRef = useRef<MascotState>('idle');

  useEffect(() => {
    mascotStateRef.current = mascotState;
  }, [mascotState]);

  const clearMascotTimers = useCallback(() => {
    if (speechTimeoutRef.current) {
      window.clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if (mascotResetRef.current) {
      window.clearTimeout(mascotResetRef.current);
      mascotResetRef.current = null;
    }
  }, []);

  const setMascotState = useCallback((state: MascotState, duration?: number) => {
    clearMascotTimers();
    if (mascotStateRef.current !== state) {
      setMascotStateValue(state);
      setMascotNonce((value) => value + 1);
    }

    if (duration) {
      mascotResetRef.current = window.setTimeout(() => {
        if (mascotStateRef.current !== 'idle') {
          setMascotStateValue('idle');
          setMascotNonce((value) => value + 1);
        }
      }, duration);
    }
  }, [clearMascotTimers]);

  const mascotSpeak = useCallback((text: string) => {
    clearMascotTimers();
    setMascotLine(text);
    setMascotStateValue('talking');
    setMascotNonce((value) => value + 1);

    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

    if (synth) {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.onend = () => {
        setMascotStateValue('idle');
        setMascotNonce((value) => value + 1);
      };
      synth.speak(utterance);
      return;
    }

    speechTimeoutRef.current = window.setTimeout(() => {
      setMascotStateValue('idle');
      setMascotNonce((value) => value + 1);
    }, 1200);
  }, [clearMascotTimers]);

  const speakFromGroup = useCallback((group: T, reaction?: MascotState) => {
    if (reaction) {
      setMascotState(reaction, 550);
      window.setTimeout(() => {
        mascotSpeak(pickRandom(phrases[group]));
      }, 260);
      return;
    }

    mascotSpeak(pickRandom(phrases[group]));
  }, [mascotSpeak, phrases, setMascotState]);

  useEffect(() => {
    return () => {
      clearMascotTimers();
      window.speechSynthesis?.cancel();
    };
  }, [clearMascotTimers]);

  return {
    mascotState,
    mascotLine,
    mascotNonce,
    setMascotState,
    mascotSpeak,
    speakFromGroup,
  };
}
