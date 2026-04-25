export function validateEquation(elements: string[]): boolean {
  // Convert visual operators to standard math operators
  const rawString = elements.join('')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-');

  const parts = rawString.split('=');
  if (parts.length !== 2) return false;

  try {
    // Safely evaluate simple math expressions
    // Note: In a pure FE app for kids math, Function is safer than full eval() 
    // and sufficient for basic arithmetic.
    const leftSide = new Function(`return ${parts[0]}`)();
    const rightSide = new Function(`return ${parts[1]}`)();
    return leftSide === rightSide;
  } catch (e) {
    return false;
  }
}