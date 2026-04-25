import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useHandTracking } from '../hooks/useHandTracking';
import { GestureCursor } from '../components/home/GestureCursor';
import { Mascot } from '../components/home/Mascot';
import { Balloon } from '../components/game/Balloon';
import { useMascotController } from '../hooks/useMascotController';
import { generateLetterPairs, type BalloonData } from '../utils/letterMatch';
import { initPhysicsNodes, type PhysicsNode } from '../components/game/FloatingEngine';
import { createRewardNotification } from '../utils/parentNotifications';
import { useProgress } from '../store/ProgressContext';

interface CursorSparkle { id: number; x: number; y: number; }
interface FunnyPopup { id: number; x: number; y: number; text: string; }

const WRONG_MESSAGES = ["Oopsie!", "Boing!", "Silly Goose!", "Not quite! 🤪", "Try again!"];
const HOVER_RADIUS = 24;
const PINCH_GRAB_RADIUS = 34;
const DRAG_SNAP_STRENGTH = 0.58;
const COLLISION_RADIUS = 19;
const PINCH_RELEASE_GRACE_FRAMES = 18;
const LETTER_GAME_DIALOGUES = {
  hover: ['Nice!', 'Grab it!', 'Try this one!'],
  success: ['Yay!', 'Great job!', 'You matched it!'],
  error: ['Oops!', 'Try again!', 'Almost!'],
  intro: ['Match the letters!', 'Pair big and small letters!'],
} as const;

export function MatchLettersRoute() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { cursor, isReady: handTrackingReady } = useHandTracking(videoRef);
  const { mascotState, mascotLine, mascotNonce, setMascotState, speakFromGroup } =
    useMascotController(LETTER_GAME_DIALOGUES);
  const { getProgress, updateMilestone, startSession } = useProgress();

  const [score, setScore] = useState(0);
  const [balloons, setBalloons] = useState<BalloonData[]>([]);
  const [funnyPopups, setFunnyPopups] = useState<FunnyPopup[]>([]);
  const [sparkles, setSparkles] = useState<CursorSparkle[]>([]);
  
  const [hoveredBalloonId, setHoveredBalloonId] = useState<string | null>(null);
  const [draggedBalloonId, setDraggedBalloonId] = useState<string | null>(null);

  // High-performance refs 
  const physicsNodesRef = useRef<Record<string, PhysicsNode>>({});
  const domRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Interaction & Smoothing Refs
  const hoveredIdRef = useRef<string | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const pinchLossFramesRef = useRef(0);
  const collisionCooldownUntilRef = useRef(0);
  const introSpokenRef = useRef(false);
  const lastMascotHoverRef = useRef<string | null>(null);
  const hoverSpeakCooldownRef = useRef(0);
  const cursorRef = useRef(cursor);
  const balloonsRef = useRef<BalloonData[]>([]);
  const lastHoveredStateRef = useRef<string | null>(null);
  const lastDraggedStateRef = useRef<string | null>(null);
  const lastNotifiedScoreRef = useRef(0);

  // Start Level
  const startLevel = useCallback(() => {
    const newBalloons = generateLetterPairs(4);
    setBalloons(newBalloons);
    balloonsRef.current = newBalloons;
    physicsNodesRef.current = initPhysicsNodes(newBalloons.map(b => b.id), false);
  }, []);

  useEffect(() => {
    startLevel();
  }, [startLevel]);

  // Load saved score on mount
  useEffect(() => {
    getProgress('match-letters').then(progress => {
      if (progress.starsEarned > 0) setScore(progress.starsEarned);
    });
    startSession('match-letters');
  }, [getProgress, startSession]);

  useEffect(() => {
    if (score <= 0 || score <= lastNotifiedScoreRef.current) return;
    lastNotifiedScoreRef.current = score;
    createRewardNotification('matched upper and lower case letters', `popped a correct letter pair and reached ${score} stars in Match Letters.`, 'success', '🎈');
  }, [score]);

  useEffect(() => { cursorRef.current = cursor; }, [cursor]);

  useEffect(() => {
    if (!handTrackingReady || introSpokenRef.current) return;

    introSpokenRef.current = true;
    const timeoutId = window.setTimeout(() => {
      speakFromGroup('intro');
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [handTrackingReady, speakFromGroup]);

  useEffect(() => {
    const activeHoverId = draggedBalloonId ?? hoveredBalloonId;

    if (!activeHoverId) {
      lastMascotHoverRef.current = null;
      if (mascotState === 'idle' || mascotState === 'hover') {
        setMascotState('idle');
      }
      return;
    }

    if (lastMascotHoverRef.current === activeHoverId) {
      return;
    }

    lastMascotHoverRef.current = activeHoverId;
    setMascotState('hover', 600);

    const now = Date.now();
    if (now > hoverSpeakCooldownRef.current) {
      hoverSpeakCooldownRef.current = now + 2200;
      window.setTimeout(() => {
        speakFromGroup('hover');
      }, 180);
    }
  }, [draggedBalloonId, hoveredBalloonId, mascotState, setMascotState, speakFromGroup]);

  const syncInteractionState = useCallback(() => {
    if (lastHoveredStateRef.current !== hoveredIdRef.current) {
      lastHoveredStateRef.current = hoveredIdRef.current;
      setHoveredBalloonId(hoveredIdRef.current);
    }

    if (lastDraggedStateRef.current !== draggedIdRef.current) {
      lastDraggedStateRef.current = draggedIdRef.current;
      setDraggedBalloonId(draggedIdRef.current);
    }
  }, []);

  const findNearestBalloon = useCallback((nodeList: PhysicsNode[], x: number, y: number, aspectRatio: number, radius: number) => {
    let closestId: string | null = null;
    let minDist = radius;

    nodeList.forEach((node) => {
      if (node.isPopped) return;
      const dist = Math.hypot((node.x - x) * aspectRatio, node.y - y);
      if (dist < minDist) {
        minDist = dist;
        closestId = node.id;
      }
    });

    return closestId;
  }, []);

  // Audio Engine
  const playSound = useCallback((type: 'pop' | 'bounce') => {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioContextRef.current && AudioCtx) audioContextRef.current = new AudioCtx();
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);

    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(250, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    }
  }, []);

  // Show Funny Popup
  const triggerFunnyPopup = useCallback((x: number, y: number) => {
    const text = WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)];
    const id = Date.now();
    setFunnyPopups(prev => [...prev, { id, x, y, text }]);
    setTimeout(() => {
      setFunnyPopups(prev => prev.filter(p => p.id !== id));
    }, 1200);
  }, []);

  // Main 60FPS Game Loop
  useEffect(() => {
    if (!handTrackingReady) return;

    const loop = () => {
      const nodes = physicsNodesRef.current;
      const nodeList = Object.values(nodes) as PhysicsNode[];
      const aspectRatio = window.innerWidth / window.innerHeight;
      const liveCursor = cursorRef.current;
      const time = Date.now() / 1000;

      if (!liveCursor) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const cx = liveCursor.x * 100;
      const cy = liveCursor.y * 100;
      
      // Pinch smoothing so tiny tracking flickers do not drop a grabbed balloon.
      let isPinching = Boolean(liveCursor.isPinching);
      if (!isPinching) {
        pinchLossFramesRef.current++;
        if (draggedIdRef.current && pinchLossFramesRef.current <= PINCH_RELEASE_GRACE_FRAMES) {
          isPinching = true;
        }
      } else {
        pinchLossFramesRef.current = 0;
      }

      // 1. Gesture Tracking & Drag Selection
      if (!draggedIdRef.current) {
        hoveredIdRef.current = findNearestBalloon(nodeList, cx, cy, aspectRatio, HOVER_RADIUS);
      } else {
        hoveredIdRef.current = draggedIdRef.current;
      }

      if (isPinching && !draggedIdRef.current) {
        draggedIdRef.current =
          hoveredIdRef.current ?? findNearestBalloon(nodeList, cx, cy, aspectRatio, PINCH_GRAB_RADIUS);
        hoveredIdRef.current = draggedIdRef.current;
      } else if (!isPinching) {
        draggedIdRef.current = null;
      }

      syncInteractionState();

      // 2. Physics Engine
      let matchFound: [string, string] | null = null;
      let bouncePos: {x: number, y: number} | null = null;

      nodeList.forEach((node) => {
        if (node.isPopped) return;

        if (node.id === draggedIdRef.current) {
          // Smooth drag follow
          node.x += (cx - node.x) * DRAG_SNAP_STRENGTH;
          node.y += (cy - node.y) * DRAG_SNAP_STRENGTH;
          node.isDragging = true;

          // Check Collisions
          if (Date.now() > collisionCooldownUntilRef.current) {
            for (const target of nodeList) {
              if (target.id !== node.id && !target.isPopped) {
                const dist = Math.hypot((node.x - target.x) * aspectRatio, node.y - target.y);
                if (dist < COLLISION_RADIUS) {
                  const b1 = balloonsRef.current.find(b => b.id === node.id);
                  const b2 = balloonsRef.current.find(b => b.id === target.id);
                  
                  if (b1 && b2) {
                    if (b1.matchId === b2.matchId) {
                      matchFound = [node.id, target.id];
                    } else {
                      bouncePos = { x: node.x, y: node.y };
                      node.x += (node.x > target.x ? 10 : -10);
                      target.x += (target.x > node.x ? 6 : -6);
                    }
                  }
                }
              }
            }
          }
        } else {
          node.isDragging = false;
          // Smooth Natural Floating
          if (node.y > node.baseY + 5) {
            node.y += (node.baseY - node.y) * 0.03; // Float up smoothly from bottom
          } else {
            node.y = node.baseY + Math.sin(time * 1.5 + node.phaseY) * 1.5; // Gentle Bobbing
          }
          node.x += Math.sin(time * 0.8 + node.phaseX) * 0.05; // Gentle Swaying
        }

        // Apply DOM updates
        const el = domRefs.current[node.id];
        if (el) { el.style.left = `${node.x}vw`; el.style.top = `${node.y}vh`; }
      });

      // 3. Handle Game Events
      if (matchFound) {
        const [id1, id2] = matchFound;
        const nextScore = score + 1;
        nodes[id1].isPopped = true; nodes[id2].isPopped = true;
        draggedIdRef.current = null;
        hoveredIdRef.current = null;
        syncInteractionState();
        playSound('pop');
        setMascotState('happy', nextScore % 3 === 0 ? 1200 : 700);
        window.setTimeout(() => {
          speakFromGroup('success');
        }, 220);
        
        confetti({
          particleCount: nextScore % 3 === 0 ? 150 : 100,
          spread: nextScore % 3 === 0 ? 110 : 90,
          origin: { x: nodes[id1].x / 100, y: nodes[id1].y / 100 },
          shapes: ['star'],
          colors: ['#fde047', '#fbcfe8', '#67e8f9'],
        });
        setScore(nextScore);
        createRewardNotification('matched upper and lower case letters', `popped a correct letter pair and reached ${nextScore} stars in Match Letters.`, 'success', '🎈');

        // Save milestone progress to server at milestone thresholds
        if (nextScore % 5 === 0) {
          const milestone = Math.floor(nextScore / 5);
          updateMilestone('match-letters', {
            milestone,
            stars: 5,
            totalScore: nextScore,
            subjectId: 'english',
          }).catch(err => console.error('Failed to save milestone:', err));
        }

        // Replenish Balloons
        const remaining = balloonsRef.current.filter(b => b.id !== id1 && b.id !== id2);
        const newPair = generateLetterPairs(1);
        const newNodes = initPhysicsNodes(newPair.map(b => b.id), true); // true = starts below screen
        Object.assign(physicsNodesRef.current, newNodes);

        const updated = [...remaining, ...newPair];
        balloonsRef.current = updated;
        setBalloons(updated);
      } else if (bouncePos) {
        playSound('bounce');
        collisionCooldownUntilRef.current = Date.now() + 800; // Prevent spam bouncing
        triggerFunnyPopup(bouncePos.x, bouncePos.y);
        draggedIdRef.current = null;
        hoveredIdRef.current = null;
        syncInteractionState();
        setMascotState('thinking', 800);
        window.setTimeout(() => {
          speakFromGroup('error');
        }, 220);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameRef.current!);
  }, [handTrackingReady, playSound, score, setMascotState, speakFromGroup, triggerFunnyPopup]);

  // Start Camera
  useEffect(() => {
    const videoEl = videoRef.current;
    let activeStream: MediaStream | null = null;
    let isMounted = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => { 
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        activeStream = stream;
        if (videoEl) { 
          videoEl.srcObject = stream; 
          videoEl.play(); 
        } 
      })
      .catch(err => console.error(err));
      
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <video src="/homebg.mp4" autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover scale-105 blur-[6px]" />
      <div className="absolute inset-0 bg-black/40" />
      <video ref={videoRef} playsInline muted className="absolute h-0 w-0 opacity-0 pointer-events-none" />

      {/* Top HUD */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 sm:px-12 gap-4">
        <Link to="/" className="rounded-full border-[4px] border-white bg-rose-400 px-6 py-3 text-xl font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.2)] hover:scale-105 transition-transform" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
          Back Home
        </Link>
        
        <h1 className="text-5xl font-black text-white" style={{ fontFamily: '"Comic Sans MS", cursive', WebkitTextStroke: '4px #ec4899', textShadow: '0 6px 0 rgba(0,0,0,0.2)' }}>
          Match Letters!
        </h1>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-4 rounded-[24px] border-[4px] border-white bg-cyan-400 px-6 py-2 shadow-[0_8px_0_rgba(0,0,0,0.2)]">
            <span className="text-3xl">⭐</span>
            <span className="text-4xl font-black text-white" style={{ fontFamily: '"Comic Sans MS", cursive', WebkitTextStroke: '2px #0891b2' }}>{score}</span>
          </div>

          {/* INSTRUCTIONAL HAND INDICATOR */}
          <div className="rounded-[18px] border-[3px] border-white bg-indigo-500/90 px-4 py-2 shadow-lg backdrop-blur-sm animate-pulse">
            <p className="text-white font-bold text-sm" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
              🖐️ <strong className="text-yellow-300">Pinch & Hold</strong> to Grab<br/>
              ➡️ <strong className="text-green-300">Drag</strong> to match letter!
            </p>
          </div>
        </div>
      </div>

      {/* Game Arena */}
      <div className="relative h-[80vh] w-full">
        <AnimatePresence>
          {balloons.map((balloon) => (
            <Balloon
              key={balloon.id}
              ref={(el) => { domRefs.current[balloon.id] = el; }}
              data={balloon}
              isHovered={hoveredBalloonId === balloon.id}
              isDragging={draggedBalloonId === balloon.id}
            />
          ))}
        </AnimatePresence>

        {/* FUNNY POPUPS OVERLAY */}
        <AnimatePresence>
          {funnyPopups.map(popup => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: 1, scale: 1.2, y: -40, rotate: (Math.random() - 0.5) * 20 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute z-50 pointer-events-none"
              style={{ left: `${popup.x}vw`, top: `${popup.y}vh`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="rounded-full bg-white px-4 py-2 border-4 border-rose-500 shadow-xl">
                <span className="text-xl font-black text-rose-600" style={{ fontFamily: '"Comic Sans MS", cursive' }}>{popup.text}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <GestureCursor
        cursor={cursor} holdProgress={0} isVisible={handTrackingReady}
        isActive={Boolean(draggedBalloonId)}
        accentColor="#facc15" centerColor={draggedBalloonId ? '#facc15' : '#fde68a'}
        size={draggedBalloonId ? 'large' : 'default'} sparkles={sparkles}
      />

      <Mascot state={mascotState} line={mascotLine} nonce={mascotNonce} />
    </main>
  );
}
