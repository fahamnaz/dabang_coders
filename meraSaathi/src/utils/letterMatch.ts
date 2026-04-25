export interface BalloonData {
  id: string;
  letter: string;
  type: 'upper' | 'lower';
  matchId: string;
  color: string;
}

let generationCounter = 0; // Ensures every balloon ever made has a 100% unique ID

export function generateLetterPairs(pairCount = 4): BalloonData[] {
  generationCounter++;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const shuffled = alphabet.split('').sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, pairCount);

  const colors = [
    'bg-rose-400', 'bg-cyan-400', 'bg-yellow-400', 
    'bg-green-400', 'bg-purple-400', 'bg-orange-400'
  ];

  const balloons: BalloonData[] = [];

  selected.forEach((letter) => {
    const colorUpper = colors[Math.floor(Math.random() * colors.length)];
    const colorLower = colors[Math.floor(Math.random() * colors.length)];
    const uniqueHash = Math.random().toString(36).substring(2, 6); // Extra safety

    balloons.push({
      id: `upper-${letter}-gen${generationCounter}-${uniqueHash}`,
      letter: letter,
      type: 'upper',
      matchId: letter,
      color: colorUpper,
    });
    balloons.push({
      id: `lower-${letter}-gen${generationCounter}-${uniqueHash}`,
      letter: letter.toLowerCase(),
      type: 'lower',
      matchId: letter,
      color: colorLower,
    });
  });

  return balloons.sort(() => 0.5 - Math.random());
}