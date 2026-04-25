import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimationFrame, AnimatePresence } from 'framer-motion';
import { Planet, PLANETS, SUN } from '../data/planets';
import { CursorPosition } from '../hooks/useHandTracking';
import { useGame } from '../store/GameContext';
import confetti from 'canvas-confetti';

interface SolarSystemProps {
  cursor: CursorPosition | null;
}

export function SolarSystem({ cursor }: SolarSystemProps) {
  // BUG FIX: Swapped setScore for addScore, and brought in playSFX
  const { mode, setAiMessage, addScore, playSFX } = useGame();
  
  const anglesRef = useRef<{ [key: string]: number }>(
    PLANETS.reduce((acc, p) => ({ ...acc, [p.id]: Math.random() * Math.PI * 2 }), {})
  );

  const [draggedPlanetId, setDraggedPlanetId] = useState<string | null>(null);
  const [hoveredPlanetId, setHoveredPlanetId] = useState<string | null>(null);
  const planetPositionsRef = useRef<{ [key: string]: { x: number, y: number } }>({});
  const [center, setCenter] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const handleResize = () => setCenter({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const centerX = center.x;
  const centerY = center.y;

  const [orderedPlanets, setOrderedPlanets] = useState<string[]>([]);
  const [findTarget, setFindTarget] = useState<Planet | null>(null);

  useEffect(() => {
    if (mode === 'FIND') {
      const randomPlanet = PLANETS[Math.floor(Math.random() * PLANETS.length)];
      setFindTarget(randomPlanet);
      setAiMessage(`Can you find ${randomPlanet.name}?`);
    } else if (mode === 'ORDER') {
      setOrderedPlanets([]);
      setAiMessage("Let's put the planets in order! Grab a planet and place it on its orbit.");
    } else if (mode === 'DISCOVERY') {
      setAiMessage("Welcome to the Magic Solar System! Point at a planet to learn about it.");
    } else if (mode === 'GALAXY') {
      setAiMessage("Whoa! We are zooming out to see the whole galaxy!");
    }
  }, [mode, setAiMessage]);

  useAnimationFrame((time, delta) => {
    if (mode === 'GALAXY') return; 

    PLANETS.forEach(planet => {
      if (draggedPlanetId !== planet.id) {
        anglesRef.current[planet.id] += planet.orbitSpeed * (delta / 16);
      }
      
      if (draggedPlanetId === planet.id && cursor) {
        const targetX = cursor.x * window.innerWidth;
        const targetY = cursor.y * window.innerHeight;
        const currentPos = planetPositionsRef.current[planet.id] || { x: targetX, y: targetY };
        
        planetPositionsRef.current[planet.id] = {
          x: currentPos.x + (targetX - currentPos.x) * 0.3,
          y: currentPos.y + (targetY - currentPos.y) * 0.3
        };
      } else {
        const angle = anglesRef.current[planet.id];
        let radius = planet.orbitRadius;
        
        if (mode === 'ORDER' && !orderedPlanets.includes(planet.id)) {
          radius = 150 + (planet.size * 2.5); 
          planetPositionsRef.current[planet.id] = {
            x: centerX + Math.cos(angle * 1.5) * radius + Math.sin(time / 800) * 60,
            y: centerY + Math.sin(angle * 1.2) * radius + Math.cos(time / 600) * 40
          };
        } else {
          planetPositionsRef.current[planet.id] = {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          };
        }
      }

      const el = document.getElementById(`planet-${planet.id}`);
      if (el) {
        const pos = planetPositionsRef.current[planet.id];
        el.style.transform = `translate3d(${pos.x - planet.size / 2}px, ${pos.y - planet.size / 2}px, 0)`;
      }
    });

    if (cursor) {
      const cursorX = cursor.x * window.innerWidth;
      const cursorY = cursor.y * window.innerHeight;
      let foundHover = null;

      const sunDist = Math.hypot(cursorX - centerX, cursorY - centerY);
      if (sunDist < SUN.size / 2 + 30) foundHover = SUN.id;

      if (!foundHover) {
        for (const planet of PLANETS) {
          const pos = planetPositionsRef.current[planet.id];
          if (pos) {
            const dist = Math.hypot(cursorX - pos.x, cursorY - pos.y);
            if (dist < planet.size / 2 + 40) { 
              foundHover = planet.id;
              break;
            }
          }
        }
      }

      // Handle Hover state and sound
      if (foundHover !== hoveredPlanetId) {
        setHoveredPlanetId(foundHover);
        
        if (foundHover) {
          playSFX('hover'); // Play futuristic blip on hover
          
          if (mode === 'DISCOVERY' && !cursor.isPinching) {
            const p = foundHover === 'sun' ? SUN : PLANETS.find(p => p.id === foundHover);
            if (p) setAiMessage(`This is ${p.name}. ${p.facts[0]}`);
          }
        }
      }

      // Handle Grab state and sound
      if (cursor.isPinching && foundHover && !draggedPlanetId && foundHover !== 'sun') {
        setDraggedPlanetId(foundHover);
        playSFX('grab'); // Play deep thud when grabbing
      }

      if (!cursor.isPinching && draggedPlanetId) {
        handleRelease(draggedPlanetId, cursorX, cursorY);
        setDraggedPlanetId(null);
      }
    } else {
      setHoveredPlanetId(null);
      if (draggedPlanetId) setDraggedPlanetId(null);
    }
  });

  const handleRelease = (planetId: string, x: number, y: number) => {
    const planet = PLANETS.find(p => p.id === planetId);
    if (!planet) return;

    if (mode === 'FIND' && findTarget) {
      if (planetId === findTarget.id) {
        playSFX('success'); // Play happy chime
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: [planet.color, '#FFF'] });
        setAiMessage(`Great job! You found ${planet.name}! ${planet.facts[1]}`);
        addScore(10); // BUG FIXED: Now uses the Context's addScore
        
        setTimeout(() => {
          const newTarget = PLANETS[Math.floor(Math.random() * PLANETS.length)];
          setFindTarget(newTarget);
          setAiMessage(`Now, can you find ${newTarget.name}?`);
        }, 4000);
      } else {
        playSFX('error'); // Play buzz sound
        setAiMessage(`Oops, that's ${planet.name}. Keep looking for ${findTarget.name}!`);
      }
    } else if (mode === 'ORDER') {
      const distFromCenter = Math.hypot(x - centerX, y - centerY);
      const orbitDiff = Math.abs(distFromCenter - planet.orbitRadius);
      
      if (orbitDiff < 60) {
        if (!orderedPlanets.includes(planetId)) {
          playSFX('snap'); // Play magnetic snap sound
          setOrderedPlanets(prev => [...prev, planetId]);
          confetti({ particleCount: 80, spread: 60, origin: { x: x / window.innerWidth, y: y / window.innerHeight }, colors: [planet.color] });
          setAiMessage(`Perfect! ${planet.name} is in its correct orbit.`);
          addScore(15); // Added a score reward for placing planets!
          anglesRef.current[planetId] = Math.atan2(y - centerY, x - centerX);
        }
      } else {
        playSFX('error');
        setAiMessage(`Try placing ${planet.name} on its correct orbit ring!`);
      }
    }
  };

  const isGalaxyMode = mode === 'GALAXY';

  const generateStars = (count: number) => {
    let shadow = '';
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * 200) - 50; 
      const y = Math.floor(Math.random() * 200) - 50; 
      const size = Math.random() * 2 + 1;
      shadow += `${x}vw ${y}vh 0px ${size}px rgba(255, 255, 255, ${Math.random() * 0.7 + 0.3}), `;
    }
    return shadow.slice(0, -2);
  };
  const starShadows = useRef(generateStars(150));

  return (
    <motion.div 
      className="absolute inset-0 overflow-hidden pointer-events-none perspective-[1000px]"
      animate={{
        scale: isGalaxyMode ? 0.15 : 1,
        rotateX: isGalaxyMode ? 45 : 0, 
        opacity: isGalaxyMode ? 0.9 : 1
      }}
      transition={{ duration: 2.5, ease: [0.25, 0.1, 0.25, 1] }} 
    >
      <motion.div 
        className="absolute inset-[-50%] w-[200%] h-[200%]"
        animate={{ 
          rotate: isGalaxyMode ? 15 : 0,
          opacity: isGalaxyMode ? 1 : 0.4
        }}
        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
      >
        <div 
          className="w-[1px] h-[1px] bg-transparent rounded-full"
          style={{ boxShadow: starShadows.current }}
        />
      </motion.div>

      <svg className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {!isGalaxyMode && PLANETS.map(planet => {
          const isHovered = hoveredPlanetId === planet.id;
          const isScrambled = mode === 'ORDER' && !orderedPlanets.includes(planet.id);
          
          return (
            <motion.circle
              key={`orbit-${planet.id}`}
              cx={centerX}
              cy={centerY}
              r={planet.orbitRadius}
              fill="none"
              stroke={isHovered ? planet.color : 'rgba(255,255,255,0.15)'}
              strokeWidth={isHovered ? 2 : 1}
              strokeDasharray={isScrambled ? "15 25" : "none"}
              filter={isHovered ? "url(#glow)" : "none"}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: 1,
                rotate: isScrambled ? 360 : 0 
              }}
              transition={{ 
                pathLength: { duration: 2, ease: "easeOut" },
                rotate: { duration: 50, repeat: Infinity, ease: "linear" }
              }}
              style={{ transformOrigin: `${centerX}px ${centerY}px` }}
            />
          );
        })}
      </svg>

      <motion.div
        className="absolute z-10"
        style={{
          left: centerX - SUN.size / 2,
          top: centerY - SUN.size / 2,
          width: SUN.size,
          height: SUN.size,
        }}
      >
        <motion.div 
          className="w-full h-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          dangerouslySetInnerHTML={{ __html: SUN.svg }}
        />
        <motion.div 
          className="absolute inset-[-50%] rounded-full z-[-1] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(255,140,0,0) 70%)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {PLANETS.map(planet => {
        const isHovered = hoveredPlanetId === planet.id;
        const isDragged = draggedPlanetId === planet.id;
        const isTarget = mode === 'FIND' && findTarget?.id === planet.id;
        const isScrambled = mode === 'ORDER' && !orderedPlanets.includes(planet.id);
        
        return (
          <div
            key={planet.id}
            id={`planet-${planet.id}`}
            className="absolute will-change-transform"
            style={{
              width: planet.size,
              height: planet.size,
              zIndex: isDragged ? 50 : 20,
              willChange: 'transform' 
            }}
          >
            <motion.div
              animate={{ 
                scale: isDragged ? 1.4 : isHovered ? 1.15 : isScrambled && !isDragged ? 0.8 : 1,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-full h-full relative"
            >
              {isTarget && (
                <motion.div 
                  className="absolute inset-[-30%] rounded-full border-2 border-dashed"
                  style={{ borderColor: planet.color }}
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
              )}
              
              <div 
                className="w-full h-full"
                style={{ 
                  filter: isHovered || isDragged ? `drop-shadow(0 0 25px ${planet.color})` : 'none',
                  opacity: isScrambled && !isDragged ? 0.7 : 1
                }}
                dangerouslySetInnerHTML={{ __html: planet.svg }}
              />
            </motion.div>
            
            <AnimatePresence>
              {(isHovered || isDragged) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-[110%] left-1/2 -translate-x-1/2 flex flex-col items-center"
                >
                  <div className="w-[2px] h-3 bg-gradient-to-b from-white/50 to-transparent mb-1" />
                  <div 
                    className="bg-black/40 backdrop-blur-md border-t border-white/30 text-white px-4 py-1.5 rounded-xl text-sm font-black tracking-widest uppercase shadow-2xl"
                    style={{ borderTopColor: planet.color, textShadow: `0 0 10px ${planet.color}` }}
                  >
                    {planet.name}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.div>
  );
}
