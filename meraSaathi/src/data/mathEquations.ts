export interface MathLevel {
  id: string;
  title: string;
  emoji: string;
  difficulty: 'easy' | 'medium' | 'hard';
  instruction: string;
  elements: string[]; // Correct order: e.g. ["2", "+", "3", "=", "5"]
}

export const mathLevels: MathLevel[] = [
  // ── EASY (Levels 1-4) ─────────────────────────────────
  {
    id: 'lvl-1',
    title: 'First Steps',
    emoji: '🐣',
    difficulty: 'easy',
    instruction: 'Arrange the blocks correctly!',
    elements: ["1", "+", "1", "=", "2"],
  },
  {
    id: 'lvl-2',
    title: 'Apple Picking',
    emoji: '🍎',
    difficulty: 'easy',
    instruction: 'Arrange the blocks correctly!',
    elements: ["2", "+", "3", "=", "5"],
  },
  {
    id: 'lvl-3',
    title: 'Take Away',
    emoji: '🎈',
    difficulty: 'easy',
    instruction: 'Arrange the blocks correctly!',
    elements: ["4", "−", "1", "=", "3"],
  },
  {
    id: 'lvl-4',
    title: 'Big Numbers',
    emoji: '🌟',
    difficulty: 'easy',
    instruction: 'Arrange the blocks correctly!',
    elements: ["6", "+", "3", "=", "9"],
  },

  // ── MEDIUM (Levels 5-7) ───────────────────────────────
  {
    id: 'lvl-5',
    title: 'Times Table',
    emoji: '✖️',
    difficulty: 'medium',
    instruction: 'Arrange the blocks correctly!',
    elements: ["5", "×", "2", "=", "10"],
  },
  {
    id: 'lvl-6',
    title: 'Share Equally',
    emoji: '🍕',
    difficulty: 'medium',
    instruction: 'Arrange the blocks correctly!',
    elements: ["8", "÷", "2", "=", "4"],
  },
  {
    id: 'lvl-7',
    title: 'Subtract Big',
    emoji: '🧩',
    difficulty: 'medium',
    instruction: 'Arrange the blocks correctly!',
    elements: ["10", "−", "4", "=", "6"],
  },

  // ── HARD (Levels 8-10) ────────────────────────────────
  {
    id: 'lvl-8',
    title: 'Double Trouble',
    emoji: '🔥',
    difficulty: 'hard',
    instruction: 'Arrange the blocks correctly!',
    elements: ["4", "×", "2", "+", "1", "=", "9"],
  },
  {
    id: 'lvl-9',
    title: 'Half & Half',
    emoji: '🧠',
    difficulty: 'hard',
    instruction: 'Arrange the blocks correctly!',
    elements: ["10", "÷", "2", "+", "3", "=", "8"],
  },
  {
    id: 'lvl-10',
    title: 'Math Wizard',
    emoji: '🪄',
    difficulty: 'hard',
    instruction: 'Arrange the blocks correctly!',
    elements: ["5", "+", "5", "−", "2", "=", "8"],
  },
];