export interface WordData {
  id: string;
  word: string;
  hint: string;
  imageEmoji: string;
}

export const words: WordData[] = [
  { id: '1', word: 'APPLE', hint: 'A sweet, crunchy fruit!', imageEmoji: '🍎' },
  { id: '2', word: 'BALL', hint: 'You bounce and throw it!', imageEmoji: '⚽' },
  { id: '3', word: 'SUN', hint: 'Hot and bright in the sky!', imageEmoji: '☀️' },
  { id: '4', word: 'CAT', hint: 'Says meow!', imageEmoji: '🐱' },
  { id: '5', word: 'TREE', hint: 'Tall with green leaves!', imageEmoji: '🌳' },
];