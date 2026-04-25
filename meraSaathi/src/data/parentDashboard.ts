export interface ParentSkillPoint {
  label: string;
  score: number;
  color: string;
}

export interface ParentProgressCard {
  label: string;
  value: string;
  note: string;
  tone: string;
  icon: 'sessions' | 'minutes' | 'tasks' | 'streak';
}

export interface ParentRecommendation {
  title: string;
  body: string;
  cta: string;
  tone: string;
  emoji: string;
  highlights: readonly string[];
  footer: string;
}

export interface ParentNotification {
  title: string;
  detail: string;
  time: string;
  tone: 'success' | 'warning' | 'info';
  emoji: string;
}

export const parentDashboardData = {
  childName: 'Alex',
  ageBand: 'Early Primary',
  avatarEmoji: '🧒',
  learningStyle: 'Movement + Visual Cues',
  focusAnimal: 'Rainbow Fox',
  currentStrength: 'Visual Matching',
  currentScore: 9.1,
  confidence: 84,
  completionRate: 92,
  weeklyStars: 48,
  nextMilestone: '60 stars unlocks a surprise badge',
  skillPoints: [
    { label: 'Visual Match', score: 94, color: '#ff78b6' },
    { label: 'Memory', score: 86, color: '#ffd54a' },
    { label: 'Trend', score: 90, color: '#69db96' },
    { label: 'Attention', score: 74, color: '#7dbaff' },
    { label: 'Phonics', score: 68, color: '#a78bfa' },
    { label: 'Counting', score: 79, color: '#fb923c' },
  ] satisfies ParentSkillPoint[],
  progressCards: [
    { label: 'Sessions', value: '3', note: 'completed today', tone: 'from-pink-300 to-pink-500', icon: 'sessions' },
    { label: 'Minutes', value: '25', note: 'focused play', tone: 'from-yellow-200 to-yellow-400', icon: 'minutes' },
    { label: 'Tasks', value: '12', note: 'finished', tone: 'from-lime-300 to-green-400', icon: 'tasks' },
    { label: 'Streak', value: '5', note: 'days active', tone: 'from-sky-300 to-cyan-500', icon: 'streak' },
  ] satisfies ParentProgressCard[],
  strengths: ['Visual Matching', 'Memory Recall', 'Patient Hand Control', 'Story Picture Clues'],
  weakAreas: ['Number Sequencing', 'Shape Recognition', 'Word Order', 'Fast Equation Recall'],
  sparkMoments: [
    'Stayed calm while fixing a wrong answer',
    'Used hand tracking for 8 smooth drops in a row',
    'Recognized image hints quickly in Guess the Word',
  ],
  recommendedActivities: [
    {
      title: 'Recommended Next Activity',
      body: 'Count-and-Move Game to boost number order with big body movement and color prompts.',
      cta: 'Play Count-and-Move',
      tone: 'from-pink-300 via-rose-300 to-orange-300',
      emoji: '🎲',
      highlights: ['Big body movement', 'Rainbow number prompts', 'Quick win in 5 mins'],
      footer: 'Best for after-school energy',
    },
    {
      title: 'Home Practice Idea',
      body: 'Ask Alex to step on paper numbers in the right order and shout the answer aloud.',
      cta: 'Try At Home',
      tone: 'from-amber-200 via-yellow-200 to-orange-200',
      emoji: '🏠',
      highlights: ['Uses paper cards', 'Parent joins in', 'Boosts sequencing confidence'],
      footer: 'Easy setup with household items',
    },
  ] satisfies ParentRecommendation[],
  parentActions: [
    'Count steps to the kitchen and match them with number cards.',
    'Hide shapes around the room and do a tiny treasure hunt.',
    'Ask Alex to retell the mascot instructions after each round.',
  ],
  weeklyTrend: [42, 51, 48, 64, 67, 72, 84],
  subjectBreakdown: [
    { label: 'English', value: 36, color: '#fb7185' },
    { label: 'Maths', value: 28, color: '#a78bfa' },
    { label: 'Science', value: 22, color: '#34d399' },
    { label: 'Creative', value: 14, color: '#fbbf24' },
  ],
  notifications: [
    {
      title: 'Big win in Guess the Word',
      detail: 'Alex solved APPLE without help and placed all letters in the correct order.',
      time: '2 mins ago',
      tone: 'success',
      emoji: '🌟',
    },
    {
      title: 'Needed help in Maths',
      detail: 'Alex struggled with number sequencing for one round, then corrected it on the second try.',
      time: '8 mins ago',
      tone: 'warning',
      emoji: '🧮',
    },
    {
      title: 'Hand tracking got smoother',
      detail: 'Alex completed 8 drag-and-drop actions in a row with steady control.',
      time: '14 mins ago',
      tone: 'info',
      emoji: '🖐️',
    },
    {
      title: 'Confidence bounced back',
      detail: 'After one wrong match, Alex stayed calm and finished the next task successfully.',
      time: '21 mins ago',
      tone: 'success',
      emoji: '💪',
    },
  ] satisfies ParentNotification[],
} as const;
