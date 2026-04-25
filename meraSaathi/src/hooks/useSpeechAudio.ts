import { useState, useEffect, useRef, useCallback } from 'react';
import { calculateSpeechScore } from '../utils/speechScorer';

export function useSpeechAudio() {
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [pronunciationScore, setPronunciationScore] = useState(0);
  const [isListening, setIsListening] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false); 
  const targetWordRef = useRef('');

  const stopEverything = useCallback(() => {
    shouldListenRef.current = false;
    setIsListening(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.onend = null; 
        recognitionRef.current.stop(); 
      } catch (e) {}
      recognitionRef.current = null;
    }
  }, []);

  const startVolumeTracking = useCallback(async () => {
    try {
      stopEverything();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsListening(true);
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        let average = sum / bufferLength;
        
        const volPercent = Math.min(100, Math.max(0, (average / 80) * 100));
        setVolume(volPercent);
        
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (err) {
      console.error("Mic error:", err);
      setIsListening(false);
    }
  }, [stopEverything]);

  // HARD FLUSH RESTART: Destroys the old mic and builds a completely fresh one
  const startSpeechRecognition = useCallback((targetWord: string) => {
    stopEverything();

    // The 150ms delay guarantees the browser has fully released the microphone before we grab it again.
    // This prevents the notorious "recognition has already started" crash.
    setTimeout(() => {
      shouldListenRef.current = true;
      targetWordRef.current = targetWord;
      setPronunciationScore(0);
      setTranscript('');

      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          console.error("Speech Recognition not supported.");
          return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true; 
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        
        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          
          const cleanedTranscript = currentTranscript.trim().toLowerCase();
          setTranscript(cleanedTranscript);

          // Real-time custom scoring
          const score = calculateSpeechScore(cleanedTranscript, targetWordRef.current);
          setPronunciationScore(score);
        };

        recognition.onerror = (e: any) => {
          if (e.error === 'not-allowed') setIsListening(false);
        };

        // Auto-restart heartbeat if the browser drops the mic due to silence
        recognition.onend = () => {
          setIsListening(false);
          if (shouldListenRef.current) {
            setTimeout(() => {
              if (shouldListenRef.current && recognitionRef.current) {
                try { recognitionRef.current.start(); } catch (e) {}
              }
            }, 50);
          }
        };

        recognition.start();

      } catch (err) {
        setIsListening(false);
      }
    }, 150); 
  }, [stopEverything]);

  useEffect(() => {
    return () => stopEverything();
  }, [stopEverything]);

  return { 
    volume, transcript, pronunciationScore, isListening, 
    startVolumeTracking, startSpeechRecognition, stopEverything, 
    setTranscript, setPronunciationScore 
  };
}