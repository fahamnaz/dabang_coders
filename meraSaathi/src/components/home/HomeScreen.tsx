import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Mascot } from './Mascot';
import { SubjectCard } from './SubjectCard';
import {
  MascotDialogueGroup,
  MascotState,
  mascotDialogues,
} from '../../data/mascotConfig';
import { subjects } from '../../data/subjects';
import { useAuth } from '../../store/AuthContext';
import { useProgress } from '../../store/ProgressContext';

const SPEECH_RATE = 0.9;
const SPEECH_PITCH = 1.1;

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

type HoverTarget =
  | { type: 'subject'; id: string }
  | { type: 'game'; id: string }
  | { type: 'popup-back'; id: 'popup-back' }
  | null;

export function HomeScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getAllProgress, cachedProgress } = useProgress();

  const [hoveredTarget, setHoveredTarget] = useState<HoverTarget>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [mascotState, setMascotStateValue] = useState<MascotState>('idle');
  const [mascotLine, setMascotLine] = useState('');
  const [mascotNonce, setMascotNonce] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const didWelcomeRef = useRef(false);
  const hoveredRef = useRef<string | null>(null);
  const speechTimeoutRef = useRef<number | null>(null);
  const mascotResetRef = useRef<number | null>(null);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId) ?? null,
    [selectedSubjectId],
  );

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
    setMascotStateValue(state);
    setMascotNonce((value) => value + 1);

    if (duration) {
      mascotResetRef.current = window.setTimeout(() => {
        setMascotStateValue('idle');
        setMascotNonce((value) => value + 1);
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
      utterance.rate = SPEECH_RATE;
      utterance.pitch = SPEECH_PITCH;
      utterance.onend = () => {
        setMascotStateValue('idle');
        setMascotNonce((value) => value + 1);
      };
      synth.speak(utterance);
    } else {
      speechTimeoutRef.current = window.setTimeout(() => {
        setMascotStateValue('idle');
        setMascotNonce((value) => value + 1);
      }, 1200);
    }
  }, [clearMascotTimers]);

  const speakDialogue = useCallback((group: MascotDialogueGroup, reaction?: MascotState) => {
    if (reaction) {
      setMascotState(reaction, 550);
      window.setTimeout(() => mascotSpeak(pickRandom(mascotDialogues[group])), 280);
      return;
    }
    mascotSpeak(pickRandom(mascotDialogues[group]));
  }, [mascotSpeak, setMascotState]);

  const ensureAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor();
    }
    if (audioContextRef.current.state === 'suspended') {
      void audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playUiSound = useCallback((type: 'hover' | 'select') => {
    const context = ensureAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    if (type === 'hover') {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(540, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(700, context.currentTime + 0.12);
      gainNode.gain.setValueAtTime(0.0001, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.15);
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.15);
      return;
    }

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(420, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.18);
    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.1, context.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.2);
  }, [ensureAudioContext]);

  const openSubjectMenu = useCallback((subjectId: string) => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setSelectedSubjectId(subjectId);
    playUiSound('select');
    speakDialogue('success', 'happy');
    setHoveredTarget(null);
    hoveredRef.current = null;
  }, [playUiSound, speakDialogue]);

  const updateHoverTarget = useCallback((nextTarget: HoverTarget) => {
    const nextHoverId = nextTarget ? `${nextTarget.type}:${nextTarget.id}` : null;
    if (hoveredRef.current === nextHoverId) return;

    hoveredRef.current = nextHoverId;
    setHoveredTarget(nextTarget);

    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (nextTarget) {
      playUiSound('hover');
      setMascotState('hover', 700);
      hoverTimeoutRef.current = window.setTimeout(() => {
        mascotSpeak(pickRandom(mascotDialogues.hover));
      }, 160);
    } else {
      setMascotState('idle');
    }
  }, [mascotSpeak, playUiSound, setMascotState]);

  useEffect(() => {
    if (didWelcomeRef.current) return;
    didWelcomeRef.current = true;
    mascotSpeak(mascotDialogues.home.join(' '));
  }, [mascotSpeak]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      clearMascotTimers();
      if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
    };
  }, [clearMascotTimers]);

  const resetSelection = useCallback(() => {
    setSelectedSubjectId(null);
    setHoveredTarget(null);
    setMascotState('idle');
    mascotSpeak('Pick a subject!');
  }, [mascotSpeak, setMascotState]);

  const launchGame = useCallback((route?: string, externalUrl?: string) => {
    if (!route && !externalUrl) {
      setMascotState('thinking', 900);
      mascotSpeak(pickRandom(mascotDialogues.error));
      return;
    }

    playUiSound('select');
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    } else if (route) {
      navigate(route);
    }
  }, [mascotSpeak, navigate, playUiSound, setMascotState]);

  const homeTitleStyle = {
    fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif',
    WebkitTextStroke: '5px #7c3aed',
    textShadow: '0 8px 0 rgba(255, 255, 255, 0.24)',
  } as const;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <video
        src="/homebg.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover scale-105 blur-[3px]"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.18),transparent_26%)]" />

      <div className="relative z-10 min-h-screen px-5 pb-10 pt-8 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto flex max-w-6xl flex-col gap-8"
        >
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <p
                className="inline-flex rounded-full border-[4px] border-white bg-pink-400 px-4 py-2 text-sm font-black uppercase tracking-[0.25em] text-white shadow-[0_10px_0_rgba(0,0,0,0.15)]"
                style={{ fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif' }}
              >
                Click to Play
              </p>
            </div>
            <h1
              className="mt-5 text-5xl font-black leading-[0.95] sm:text-7xl lg:text-8xl"
              style={homeTitleStyle}
            >
              PlaySpark
              <br />
              Learning Land
            </h1>
            <p
              className="mt-4 max-w-2xl text-lg font-black text-yellow-100 sm:text-2xl"
              style={{
                fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif',
                WebkitTextStroke: '2px #7c2d12',
              }}
            >
              {user ? `Welcome, ${user.childName}! ⭐ ${user.totalStars} Stars` : 'Click on a subject card to see the games inside!'}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={() => window.open('https://game-five-flax.vercel.app/', '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-3 rounded-[30px] border-[5px] border-white bg-gradient-to-r from-purple-500 to-fuchsia-500 px-8 py-4 text-2xl font-black text-white shadow-[0_12px_0_rgba(134,25,143,0.8)] hover:translate-y-2 hover:shadow-[0_4px_0_rgba(134,25,143,0.8)] transition-all"
                style={{ fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif' }}
              >
                <span className="text-3xl animate-bounce">🌟</span>
                Meet Your Favorite Personality!
              </button>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:max-w-4xl">
            {subjects.map((subject) => (
              <div key={subject.id} className="contents">
                <SubjectCard
                  subject={subject}
                  isHovered={hoveredTarget?.type === 'subject' && hoveredTarget.id === subject.id}
                  holdProgress={0}
                  onClick={() => openSubjectMenu(subject.id)}
                  onMouseEnter={() => updateHoverTarget({ type: 'subject', id: subject.id })}
                  onMouseLeave={() => updateHoverTarget(null)}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedSubject && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="absolute inset-0 z-[65] flex items-center justify-center bg-slate-950/65 px-5"
          >
            <div className="w-full max-w-2xl rounded-[42px] border-[5px] border-white bg-white/92 p-6 shadow-[0_26px_0_rgba(0,0,0,0.18)] backdrop-blur-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className="text-base font-black uppercase tracking-[0.3em]"
                    style={{ color: selectedSubject.accent, fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif' }}
                  >
                    {selectedSubject.name}
                  </p>
                  <h2
                    className="mt-2 text-4xl font-black text-white"
                    style={{
                      fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif',
                      WebkitTextStroke: `4px ${selectedSubject.textStroke}`,
                    }}
                  >
                    Choose a game
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={resetSelection}
                  onMouseEnter={() => updateHoverTarget({ type: 'popup-back', id: 'popup-back' })}
                  onMouseLeave={() => updateHoverTarget(null)}
                  className="rounded-full border-[4px] border-white bg-rose-400 px-4 py-2 text-lg font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.16)]"
                >
                  Back
                </button>
              </div>

              <div className="mt-6 grid gap-4">
                {selectedSubject.games.map((game) => (
                  <motion.button
                    key={game.id}
                    type="button"
                    whileHover={{ scale: 1.03, rotate: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => launchGame(game.route, game.externalUrl)}
                    onMouseEnter={() => updateHoverTarget({ type: 'game', id: game.id })}
                    onMouseLeave={() => updateHoverTarget(null)}
                    animate={{
                      scale: hoveredTarget?.type === 'game' && hoveredTarget.id === game.id ? 1.035 : 1,
                      y: hoveredTarget?.type === 'game' && hoveredTarget.id === game.id ? -4 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="rounded-[30px] border-[5px] border-white bg-sky-200 p-5 text-left shadow-[0_14px_0_rgba(0,0,0,0.16)]"
                    style={{
                      boxShadow: `0 14px 0 rgba(0, 0, 0, 0.16), 0 0 0 5px ${selectedSubject.accent}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3
                          className="text-2xl font-black text-white"
                          style={{
                            fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif',
                            WebkitTextStroke: `3px ${selectedSubject.textStroke}`,
                          }}
                        >
                          {game.title}
                        </h3>
                        <p className="mt-2 text-base font-black text-slate-700">{game.description}</p>
                      </div>
                      
                      <div className="rounded-full border-[4px] border-white bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-slate-800">
                        {game.status === 'ready' ? (game.externalUrl ? 'Play ↗' : 'Play') : 'Soon'}
                      </div>

                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Mascot state={mascotState} line={mascotLine} nonce={mascotNonce} />
    </main>
  );
}