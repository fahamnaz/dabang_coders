/**
 * Calculates a 0-100 score based on how closely the spoken text matches the target word.
 * Uses Levenshtein Distance to handle partial matches (e.g., "lonak" vs "ronak").
 */
export function calculateSpeechScore(spokenText: string, targetWord: string): number {
  if (!spokenText || !targetWord) return 0;

  const spoken = spokenText.toLowerCase().trim();
  const target = targetWord.toLowerCase().trim();

  if (spoken === target) return 100;

  // Check if the target word is anywhere in the spoken phrase (highly forgiving)
  if (spoken.includes(target)) return 100;

  // Levenshtein Distance Algorithm (calculates how many edits are needed to match)
  const matrix = Array(target.length + 1).fill(null).map(() => Array(spoken.length + 1).fill(null));

  for (let i = 0; i <= target.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= spoken.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= target.length; i++) {
    for (let j = 1; j <= spoken.length; j++) {
      const indicator = target[i - 1] === spoken[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + indicator // substitution
      );
    }
  }

  const distance = matrix[target.length][spoken.length];
  const maxLength = Math.max(target.length, spoken.length);
  
  // Convert distance to a percentage score
  let score = ((maxLength - distance) / maxLength) * 100;

  // Kids Therapy Boosts: 
  // If they got the first letter right (important for articulation therapy), give a small boost
  if (spoken.charAt(0) === target.charAt(0)) {
    score += 10;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}