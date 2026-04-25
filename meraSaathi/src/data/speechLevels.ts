export type SpeechTaskType = 'word';

export interface SpeechLevel {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: SpeechTaskType;
  targetWord: string;
  slowPronunciation: string;
  instruction: string;
  mascotIntro: string;
  mascotSuccess: string;
  emoji: string;
}

export const speechLevels: SpeechLevel[] = [
  {
    id: 'lvl-1',
    title: 'Roar like a Dragon',
    difficulty: 'easy',
    type: 'word',
    targetWord: 'roar',
    slowPronunciation: 'Rrrrrooooaaarrrr',
    instruction: 'Tell the dragon to move! Say "ROAR"',
    mascotIntro: 'The dragon is blocking the path! Tell him to ROAR!',
    mascotSuccess: 'The dragon moved! Great R sound!',
    emoji: '🐉'
  },
  {
    id: 'lvl-2',
    title: 'Call the Lion',
    difficulty: 'easy',
    type: 'word',
    targetWord: 'lion',
    slowPronunciation: 'Lllliiiiiiooonnn',
    instruction: 'Call our friend! Say "LION"',
    mascotIntro: 'Can you call the Lion? Practice your L sound!',
    mascotSuccess: 'He heard you! Perfect!',
    emoji: '🦁'
  },
  {
    id: 'lvl-3',
    title: 'Wake the Rabbit',
    difficulty: 'easy',
    type: 'word',
    targetWord: 'rabbit',
    slowPronunciation: 'Rrrrrraaabbbiiittt',
    instruction: 'Wake up the bunny! Say "RABBIT"',
    mascotIntro: 'The bunny is sleeping! Say Rabbit to wake him!',
    mascotSuccess: 'Hop hop! You did it!',
    emoji: '🐇'
  },
  {
    id: 'lvl-4',
    title: 'Pick an Apple',
    difficulty: 'easy',
    type: 'word',
    targetWord: 'apple',
    slowPronunciation: 'Aaaappppllle',
    instruction: 'Reach for the fruit! Say "APPLE"',
    mascotIntro: 'I am hungry! Can you say Apple?',
    mascotSuccess: 'Yummy! Great job!',
    emoji: '🍎'
  },
  {
    id: 'lvl-5',
    title: 'Hiss like a Snake',
    difficulty: 'medium',
    type: 'word',
    targetWord: 'snake',
    slowPronunciation: 'Sssssnnnnnaaaakkke',
    instruction: 'Talk to the reptile! Say "SNAKE"',
    mascotIntro: 'Watch out for the tall grass! Say Snake!',
    mascotSuccess: 'Sssss-uperb! You got it!',
    emoji: '🐍'
  },
  {
    id: 'lvl-6',
    title: 'Greet the Turtle',
    difficulty: 'medium',
    type: 'word',
    targetWord: 'turtle',
    slowPronunciation: 'Ttttuuurrrttllle',
    instruction: 'Say hello! Say "TURTLE"',
    mascotIntro: 'He moves so slow! Let us say Turtle!',
    mascotSuccess: 'He popped out of his shell! Nice T sound!',
    emoji: '🐢'
  },
  {
    id: 'lvl-7',
    title: 'Find the Monkey',
    difficulty: 'medium',
    type: 'word',
    targetWord: 'monkey',
    slowPronunciation: 'Mmmmooonnnkkkeeey',
    instruction: 'Look up in the trees! Say "MONKEY"',
    mascotIntro: 'Who is swinging up there? Say Monkey!',
    mascotSuccess: 'Ooh ooh ah ah! Perfect!',
    emoji: '🐒'
  },
  {
    id: 'lvl-8',
    title: 'Spot the Tiger',
    difficulty: 'hard',
    type: 'word',
    targetWord: 'tiger',
    slowPronunciation: 'Ttttiiiiggggeeeerr',
    instruction: 'Look at those stripes! Say "TIGER"',
    mascotIntro: 'Such a big cat! Practice your T and G in Tiger!',
    mascotSuccess: 'Fierce! Great pronunciation!',
    emoji: '🐅'
  },
  {
    id: 'lvl-9',
    title: 'Talk to the Parrot',
    difficulty: 'hard',
    type: 'word',
    targetWord: 'parrot',
    slowPronunciation: 'Ppppaaarrrrooottt',
    instruction: 'He copies you! Say "PARROT"',
    mascotIntro: 'He will repeat what you say! Say Parrot!',
    mascotSuccess: 'Squawk! Brilliant P sound!',
    emoji: '🦜'
  },
  {
    id: 'lvl-10',
    title: 'Cast a Spell',
    difficulty: 'hard',
    type: 'word',
    targetWord: 'magic',
    slowPronunciation: 'Mmmmaaaagggiiiccc',
    instruction: 'You are a wizard! Say "MAGIC"',
    mascotIntro: 'You reached the end! Cast your final spell... say Magic!',
    mascotSuccess: 'You are a true Speech Wizard! Amazing!',
    emoji: '🪄'
  }
];