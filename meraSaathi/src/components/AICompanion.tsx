import React, { useEffect, useState } from 'react';
import { useGame } from '../store/GameContext';
import { motion, AnimatePresence } from 'framer-motion';

export function AICompanion() {
  const { aiMessage } = useGame();
  const [isVisible, setIsVisible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!aiMessage) return;
    
    setIsVisible(true);
    
    // Speak the message
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // stop previous
      const utterance = new SpeechSynthesisUtterance(aiMessage);
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      
      const voices = window.speechSynthesis.getVoices();
      const friendlyVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Female'));
      if (friendlyVoice) utterance.voice = friendlyVoice;
      
      // Sync visual state with audio engine
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback if speech isn't supported
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 3000);
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [aiMessage]);

  return (
    <AnimatePresence>
      {isVisible && aiMessage && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.5, rotateX: 45 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, y: 50, scale: 0.8, filter: 'blur(10px)' }}
          transition={{ type: "spring", stiffness: 300, damping: 25, mass: 1.2 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-end gap-6 z-[100] max-w-3xl w-full px-8 perspective-[1000px]"
        >
          {/* Holographic Drone Character */}
          <motion.div 
            className="relative w-24 h-24 shrink-0"
            // Base hover animation
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Drone Shadow on the "floor" */}
            <motion.div 
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/40 blur-md rounded-full"
              animate={{ scale: [1, 0.6, 1], opacity: [0.4, 0.2, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Glowing Orb Body */}
            <motion.div 
              className="absolute inset-0 rounded-full backdrop-blur-xl border border-cyan-300/50 flex items-center justify-center overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, rgba(6,182,212,0.4) 50%, rgba(49,46,129,0.8) 100%)',
                boxShadow: isSpeaking 
                  ? '0 0 40px 10px rgba(6,182,212,0.6), inset 0 0 20px rgba(255,255,255,0.8)' 
                  : '0 0 20px 0px rgba(6,182,212,0.3), inset 0 0 10px rgba(255,255,255,0.5)'
              }}
              // Squash & Stretch physics while talking
              animate={{ 
                scaleY: isSpeaking ? [1, 1.1, 0.95, 1.05, 1] : 1,
                scaleX: isSpeaking ? [1, 0.95, 1.05, 0.98, 1] : 1
              }}
              transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
            >
              {/* Drone Eye / Visor */}
              <div className="w-16 h-8 bg-black/60 rounded-full flex items-center justify-center relative overflow-hidden border border-white/20">
                <motion.div 
                  className="w-10 h-3 bg-cyan-300 rounded-full shadow-[0_0_15px_#67e8f9]"
                  // Eye reaction (waveform style) when talking
                  animate={{ 
                    height: isSpeaking ? [12, 4, 16, 8, 12] : 12,
                    width: isSpeaking ? [40, 30, 45, 35, 40] : 40,
                    borderRadius: isSpeaking ? ['10px', '2px', '12px', '4px', '10px'] : '10px'
                  }}
                  transition={{ duration: 0.4, repeat: isSpeaking ? Infinity : 0, ease: "linear" }}
                />
                {/* Blink Animation Overlay */}
                <motion.div 
                  className="absolute inset-0 bg-black"
                  animate={{ opacity: [0, 0, 1, 0, 0] }}
                  transition={{ duration: 4, times: [0, 0.48, 0.5, 0.52, 1], repeat: Infinity }}
                />
              </div>
            </motion.div>

            {/* Orbiting AR Rings */}
            <motion.div 
              className="absolute -inset-4 border border-cyan-400/30 rounded-full border-dashed"
              animate={{ rotate: 360, scale: isSpeaking ? 1.1 : 1 }}
              transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, scale: { duration: 0.3 } }}
            />
          </motion.div>

          {/* AR Message Panel */}
          <motion.div 
            className="relative flex-1 bg-black/60 backdrop-blur-xl border border-cyan-500/30 p-6 rounded-3xl rounded-bl-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", delay: 0.2, stiffness: 400, damping: 30 }}
          >
            {/* Holographic scanning line effect */}
            <motion.div 
              className="absolute left-0 right-0 h-1 bg-cyan-400/50 blur-[2px]"
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />

            <div className="flex items-center gap-3 mb-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              </div>
              <p className="text-cyan-400/80 text-xs font-black tracking-widest uppercase font-mono">
                Space Guide Transmission
              </p>
            </div>
            
            <p className="text-2xl font-bold text-white font-sans leading-relaxed text-shadow-sm">
              {aiMessage}
            </p>

            {/* Audio Visualizer Waves (Only visible when speaking) */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="absolute bottom-6 right-6 flex items-end gap-1 h-8"
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"
                      animate={{ height: ['20%', '100%', '40%', '80%', '20%'] }}
                      transition={{ 
                        duration: 0.5 + Math.random() * 0.5, 
                        repeat: Infinity, 
                        delay: i * 0.1 
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
        </motion.div>
      )}
    </AnimatePresence>
  );
}
