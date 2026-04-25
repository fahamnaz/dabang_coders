export interface SubjectGame {
  id: string;
  title: string;
  description: string;
  route?: string;
  externalUrl?: string; // ADDED: Required for external links
  status: 'ready' | 'coming-soon';
}

export interface SubjectDefinition {
  id: 'english' | 'maths' | 'science' | 'social-science' | "speech" | "sign-language" | 'exercise' | 'drawing';
  name: string;
  emoji: string;
  accent: string;
  shadow: string;
  textStroke: string;
  mascotPrompt: string;
  games: SubjectGame[];
}

export const subjects: SubjectDefinition[] = [
  {
    id: 'speech',
    name: 'Speech & Therapy',
    emoji: '🗣️',
    accent: '#8b5cf6',
    shadow: 'rgba(139, 92, 246, 0.35)',
    textStroke: '#5b21b6',
    mascotPrompt: 'Let\'s make some magic sounds!',
    games: [
      {
        id: 'speech-playground',
        title: 'Speech Magic',
        description: 'Use your voice to cast magic spells and move obstacles!',
        status: 'ready',
        route: '/speech-therapy',
      },
      {
        id: 'speech-matching',
        title: 'Categorize It!',
        description: 'Match objects to their categories using your voice!',
        status: 'ready',
        route: '/speech-matching',
      }
    ]
  },
  {
    id: 'english',
    name: 'English',
    emoji: '📖',
    accent: '#ff7a45',
    shadow: 'rgba(255, 122, 69, 0.34)',
    textStroke: '#ef5a29',
    mascotPrompt: 'Story time!',
    games: [
      {
        id: 'match-letters',
        title: 'Match Letters',
        description: 'Drag uppercase and lowercase balloons together.',
        route: '/english-match-letters',
        status: 'ready',
      },
      {
        id: 'draw-letters',
        title: 'Draw Letters',
        description: 'Trace giant letters with your hand.',
        status: 'coming-soon',
      },
      {
        id: 'guess-word',
        title: 'Guess the Word',
        description: 'Look at the picture and drag letters to spell the word!',
        status: 'ready',
        route: '/english-guess-word',
      }
    ],
  },
  {
    id: 'maths',
    name: 'Maths',
    emoji: '🔢',
    accent: '#8b5cf6',
    shadow: 'rgba(139, 92, 246, 0.35)',
    textStroke: '#6d28d9',
    mascotPrompt: 'Number power!',
    games: [
      {
        id: 'count-fingers',
        title: 'Count Fingers',
        description: 'Count and match with your hands.',
        status: 'coming-soon',
      },
      {
        id: 'build-equation',
        title: 'Build the Equation',
        description: 'Drag numbers and symbols to build a correct math problem!',
        status: 'ready',
        route: '/math-equations',
      },
      // NEW GAME INTEGRATION
      {
        id: 'football-math',
        title: 'Football Math',
        description: 'Solve math equations to score epic goals!',
        status: 'ready',
        externalUrl: 'https://game-five-flax.vercel.app/',
      }
    ],
  },
  {
    id: 'science',
    name: 'Science',
    emoji: '🔬',
    accent: '#22c55e',
    shadow: 'rgba(34, 197, 94, 0.35)',
    textStroke: '#15803d',
    mascotPrompt: 'Blast into space!',
    games: [
      {
        id: 'color-match',
        title: 'Solar System Adventure',
        description: 'Jump straight into the live solar system game.',
        route: '/science-solar',
        status: 'ready',
      },
      {
        id: 'science-advanced',
        title: 'Science Advanced',
        description: 'Explore advanced chemistry concepts and experiments!',
        status: 'ready',
        externalUrl: 'https://chemistrygame-cyan.vercel.app/',
      },
      ,
      {
        id: 'body-organs',
        title: 'Body Organs',
        description: 'Explore advanced biology concepts and experiments!',
        status: 'ready',
        externalUrl: 'https://bodyorganss.vercel.app/',
      },
    ],
  },
  {
    id: 'social-science',
    name: 'Social Science',
    emoji: '🌍',
    accent: '#06b6d4',
    shadow: 'rgba(6, 182, 212, 0.35)',
    textStroke: '#0f766e',
    mascotPrompt: 'Let us explore the world!',
    games: [
      {
        id: 'basic-quiz',
        title: 'Basic Quiz',
        description: 'Travel the world with easy prompts.',
        status: 'coming-soon',
      },
    ],
  },
  // NEW SUBJECT: EXERCISE GAMES
  {
    id: 'exercise',
    name: 'Exercise Games',
    emoji: '🏃‍♂️',
    accent: '#fb923c', // Vibrant Orange
    shadow: 'rgba(251, 146, 60, 0.35)',
    textStroke: '#9a3412',
    mascotPrompt: 'Time to move your body!',
    games: [
      {
        id: 'fitness-adventure',
        title: 'Fitness Adventure',
        description: 'Jump, duck, and move to play the game!',
        status: 'ready',
        externalUrl: 'https://exercisesfinal.vercel.app/',
      },
      {
        id: 'exercise-advanced',
        title: 'Exercise Game',
        description: 'Another fun way to stay active and healthy!',
        status: 'ready',
        externalUrl: 'https://exercisegamee.vercel.app/',
      }
    ]
  },
  {
    id: 'sign-language',
    name: 'Sign Language',
    emoji: '👐',
    accent: '#38bdf8', // Sky blue
    shadow: 'rgba(56, 189, 248, 0.35)',
    textStroke: '#0284c7',
    mascotPrompt: 'Watch my hands!',
    games: [
      {
        id: 'path-of-lumina',
        title: 'Path of Lumina',
        description: 'Use your hands to bring light back to the world!',
        status: 'ready',
        route: '/deaf-lumina',
      },
      // NEW GAME INTEGRATION
      {
        id: 'deaf-practice',
        title: 'Deaf Practice Hub',
        description: 'Advanced sign language practices and games!',
        status: 'ready',
        externalUrl: 'https://playguugle-deaf.vercel.app/',
      }
    ]
  },
  {
    id: 'drawing',
    name: 'Drawing',
    emoji: '🎨',
    accent: '#f43f5e', // Rose
    shadow: 'rgba(27, 10, 13, 0.35)',
    textStroke: '#9f1239',
    mascotPrompt: 'Let\'s create a masterpiece together!',
    games: [
      {
        id: 'drawing-multiplayer',
        title: 'Multiplayer Drawing',
        description: 'Draw and color objects together with your friend!',
        status: 'ready',
        route: '/drawing-multiplayer',
      }
    ]
  }
];