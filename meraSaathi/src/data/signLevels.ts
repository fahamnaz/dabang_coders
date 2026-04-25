export type SignType = 
  | 'one' | 'peace' | 'water' | 'highfive' | 'rock' 
  | 'ice' | 'love' | 'fox' | 'spider' | 'super';

export interface SignLevel {
  id: string;
  sign: SignType;
  title: string;
  meaning: string;
  emoji: string;
  instruction: string;
}

export const signLevels: SignLevel[] = [
  { id: 'lvl-1', sign: 'one', title: 'The Single Beam', meaning: 'Number One', emoji: '1️⃣', instruction: 'Hold up your Index finger to start the magic!' },
  { id: 'lvl-2', sign: 'peace', title: 'The Peaceful Path', meaning: 'Peace / V', emoji: '✌️', instruction: 'Make a Peace sign with two fingers!' },
  { id: 'lvl-3', sign: 'water', title: 'The Ocean Flow', meaning: 'Water / W', emoji: '💧', instruction: 'Hold up three fingers to summon the water!' },
  { id: 'lvl-4', sign: 'highfive', title: 'The Bright Sun', meaning: 'High Five / Open Hand', emoji: '🖐️', instruction: 'Open your hand wide like a shining sun!' },
  { id: 'lvl-5', sign: 'rock', title: 'The Solid Stone', meaning: 'Rock / Fist', emoji: '✊', instruction: 'Close your hand tight like a heavy stone!' },
  { id: 'lvl-6', sign: 'ice', title: 'The Frost Spark', meaning: 'Ice / Pinky', emoji: '❄️', instruction: 'Hold up just your little Pinky finger!' },
  { id: 'lvl-7', sign: 'love', title: 'The Heart Core', meaning: 'Love / Horns', emoji: '🤟', instruction: 'Index and Pinky up to share the love!' },
  { id: 'lvl-8', sign: 'fox', title: 'The Clever Fox', meaning: 'Fox / 3 Fingers', emoji: '🦊', instruction: 'Middle, Ring, and Pinky up. Index down!' },
  { id: 'lvl-9', sign: 'spider', title: 'The Web Weaver', meaning: 'Spider', emoji: '🕷️', instruction: 'Index, Middle, and Pinky up to spin a web!' },
  { id: 'lvl-10', sign: 'super', title: 'The Lumina Burst', meaning: 'Super / Thumbs Up', emoji: '👍', instruction: 'Give a big Thumbs Up to complete your journey!' },
];