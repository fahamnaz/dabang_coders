// Calculates the Levenshtein distance between two strings
export function calculateAccuracy(spoken: string, target: string): number {
  const s = spoken.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (s === t) return 100;
  if (s.length === 0 || t.length === 0) return 0;

  const matrix: number[][] = [];

  for (let i = 0; i <= t.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= t.length; i++) {
    for (let j = 1; j <= s.length; j++) {
      if (t.charAt(i - 1) === s.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1,   // insertion
            matrix[i - 1][j] + 1    // deletion
          )
        );
      }
    }
  }

  const distance = matrix[t.length][s.length];
  const maxLength = Math.max(t.length, s.length);
  
  // Convert distance to a 0-100 percentage
  const accuracy = ((maxLength - distance) / maxLength) * 100;
  return Math.max(0, Math.round(accuracy));
}   