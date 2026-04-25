import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MascotState, mascotVideos } from '../../data/mascotConfig';

interface MascotProps {
  state: MascotState;
  line: string;
  nonce: number;
  position?: 'left' | 'right';
}

type MascotSourceMode = 'remote' | 'fallback';

const mascotStates = Object.keys(mascotVideos) as MascotState[];

function buildStateRecord<T>(createValue: (state: MascotState) => T) {
  return mascotStates.reduce<Record<MascotState, T>>((acc, currentState) => {
    acc[currentState] = createValue(currentState);
    return acc;
  }, {} as Record<MascotState, T>);
}

function createMascotPlaceholder(state: MascotState) {
  const { posterAccent, posterLabel } = mascotVideos[state];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
      <defs>
        <radialGradient id="fur" cx="30%" cy="28%" r="75%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="${posterAccent}"/>
        </radialGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="rgba(0,0,0,0.22)"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <ellipse cx="160" cy="154" rx="108" ry="102" fill="url(#fur)" stroke="rgba(255,255,255,0.88)" stroke-width="10"/>
        <ellipse cx="160" cy="106" rx="62" ry="24" fill="rgba(255,255,255,0.45)"/>
        <circle cx="122" cy="148" r="15" fill="#172033"/>
        <circle cx="198" cy="148" r="15" fill="#172033"/>
        <ellipse cx="160" cy="206" rx="46" ry="16" fill="rgba(255,255,255,0.78)"/>
      </g>
      <g transform="translate(78 242)">
        <rect x="0" y="0" rx="24" ry="24" width="164" height="48" fill="#fcd34d" stroke="#ffffff" stroke-width="8"/>
        <text x="82" y="32" font-family="Comic Sans MS, Trebuchet MS, sans-serif" font-size="26" font-weight="900" text-anchor="middle" fill="#e11d48">${posterLabel}</text>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function Mascot({ state, line, nonce, position = 'right' }: MascotProps) {
  const [sourceModes, setSourceModes] = useState<Record<MascotState, MascotSourceMode>>(() =>
    buildStateRecord(() => 'remote'),
  );
  const [readyStates, setReadyStates] = useState<Record<MascotState, boolean>>(() =>
    buildStateRecord(() => false),
  );
  const [visibleState, setVisibleState] = useState<MascotState>(state);
  const placeholderSrc = useMemo(() => createMascotPlaceholder(visibleState), [visibleState]);

  useEffect(() => {
    if (readyStates[state]) {
      setVisibleState((currentState) => (currentState === state ? currentState : state));
      return;
    }

    if (!readyStates[visibleState] && readyStates.idle) {
      setVisibleState('idle');
    }
  }, [readyStates, state, visibleState]);

  const handleReady = (nextState: MascotState) => {
    setReadyStates((currentStates) => {
      if (currentStates[nextState]) {
        return currentStates;
      }

      return {
        ...currentStates,
        [nextState]: true,
      };
    });
  };

  const handleError = (nextState: MascotState) => {
    setReadyStates((currentStates) => ({
      ...currentStates,
      [nextState]: false,
    }));

    setSourceModes((currentModes) => {
      if (currentModes[nextState] === 'fallback') {
        return currentModes;
      }

      return {
        ...currentModes,
        [nextState]: 'fallback',
      };
    });
  };

  return (
    <div
      className={`fixed bottom-3 sm:bottom-5 z-[70] pointer-events-none ${position === 'left' ? 'left-2 sm:left-5' : 'right-2 sm:right-5'}`}
      data-mascot-visual={`${visibleState}-${nonce}`}
    >
      <AnimatePresence mode="wait">
        {line && (
          <motion.div
            key={line}
            initial={{ opacity: 0, y: 14, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.92 }}
            transition={{ duration: 0.28 }}
            className={`mb-3 max-w-[220px] sm:max-w-[280px] rounded-[28px] border-[4px] border-white bg-amber-200 px-4 py-3 shadow-[0_16px_0_rgba(0,0,0,0.2)] ${position === 'left' ? 'mr-auto text-left' : 'ml-auto text-right'}`}
          >
            <p
              className="text-xl font-black text-rose-600 leading-tight"
              style={{
                fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif',
                WebkitTextStroke: '1px #ffffff',
              }}
            >
              {line}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <div className="absolute inset-0 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="relative aspect-square w-[214px] sm:w-[286px] drop-shadow-[0_22px_44px_rgba(0,0,0,0.26)]">
          <motion.img
            src={placeholderSrc}
            alt="Mascot"
            animate={{
              opacity: readyStates[visibleState] ? 0 : 1,
              scale: readyStates[visibleState] ? 0.97 : 1,
            }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute inset-0 h-full w-full object-contain"
          />

          {mascotStates.map((videoState) => {
            const sourceConfig = mascotVideos[videoState];
            const src = sourceModes[videoState] === 'fallback' ? sourceConfig.fallback : sourceConfig.remote;
            const isVisible = readyStates[videoState] && visibleState === videoState;

            return (
              <video
                key={videoState}
                src={src}
                preload="auto"
                autoPlay
                muted
                loop
                playsInline
                onLoadedData={() => handleReady(videoState)}
                onCanPlayThrough={() => handleReady(videoState)}
                onError={() => handleError(videoState)}
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
                  isVisible ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ visibility: isVisible ? 'visible' : 'hidden' }}
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
