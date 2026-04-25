export interface ReferenceObject {
  id: string;
  name: string;
  emoji: string;
  path: Path2D; // SVG Path to draw the outline
  expectedColors: string[]; // E.g., ['#fde047'] for yellow sun
  viewBox: { w: number, h: number };
}

// Draw the reference path to a hidden canvas, scale it to match user canvas
export function createMaskFromPath(path: Path2D, width: number, height: number, viewBox: {w: number, h: number}): Uint8ClampedArray {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return new Uint8ClampedArray(width * height * 4);

  // Scale path to fit nicely in canvas (80% of size)
  const scale = Math.min(width / viewBox.w, height / viewBox.h) * 0.8;
  const tx = (width - viewBox.w * scale) / 2;
  const ty = (height - viewBox.h * scale) / 2;

  ctx.translate(tx, ty);
  ctx.scale(scale, scale);
  
  ctx.fillStyle = '#000000';
  ctx.fill(path); // Fill the shape to create a solid mask
  
  return ctx.getImageData(0, 0, width, height).data;
}

export function evaluateDrawing(
  userCanvas: HTMLCanvasElement, 
  reference: ReferenceObject
): { shapeScore: number, colorScore: number, totalScore: number, fillRatio: number } {
  const width = userCanvas.width;
  const height = userCanvas.height;
  
  const ctx = userCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { shapeScore: 0, colorScore: 0, totalScore: 0 };
  
  const userData = ctx.getImageData(0, 0, width, height).data;
  const maskData = createMaskFromPath(reference.path, width, height, reference.viewBox);
  
  // Calculate IoU (Intersection over Union) for Shape Score
  // Intersection = user painted AND mask is black
  // Union = user painted OR mask is black
  let intersection = 0;
  let maskPixels = 0;
  let userPixels = 0;
  
  // Color Evaluation
  // Let's assume the reference has 1 main color for simplicity in prototyping
  const mainExpectedColorHex = reference.expectedColors[0] || '#000000';
  // convert hex to rgb
  const hex = mainExpectedColorHex.replace('#', '');
  const expR = parseInt(hex.substring(0, 2), 16);
  const expG = parseInt(hex.substring(2, 4), 16);
  const expB = parseInt(hex.substring(4, 6), 16);

  let colorMatchPixels = 0;
  let colorCheckedPixels = 0;

  for (let i = 0; i < userData.length; i += 4) {
    // User painted if alpha > 0 and it's not the background white
    // Assuming background is transparent or white
    const uR = userData[i];
    const uG = userData[i+1];
    const uB = userData[i+2];
    const uA = userData[i+3];
    
    // Simple heuristic for "is painted pixel" (not white, not transparent)
    const isUserPainted = uA > 10 && !(uR > 240 && uG > 240 && uB > 240);
    
    // Mask is black if alpha > 128
    const isMaskBlack = maskData[i+3] > 128;
    
    if (isMaskBlack) maskPixels++;
    if (isUserPainted) userPixels++;
    if (isMaskBlack && isUserPainted) intersection++;
    
    // Color checking: only check inside the mask where the user painted
    if (isMaskBlack && isUserPainted) {
      colorCheckedPixels++;
      // Simple RGB distance
      const dist = Math.sqrt(
        Math.pow(uR - expR, 2) + 
        Math.pow(uG - expG, 2) + 
        Math.pow(uB - expB, 2)
      );
      // If distance < 80, consider it a color match
      if (dist < 80) {
        colorMatchPixels++;
      }
    }
  }

  // IoU calculation
  const union = maskPixels + userPixels - intersection;
  const shapeScoreRaw = union === 0 ? 0 : intersection / union;
  
  // A perfect IoU is hard, human drawings usually get 0.6 - 0.8 at best.
  // Normalize score so 0.7 IoU = 100%
  const shapeScore = Math.min(100, Math.round((shapeScoreRaw / 0.7) * 100));
  
  // Color Score: % of correctly colored pixels inside the mask
  // Also we want them to fill a good portion of the mask!
  const fillRatio = maskPixels === 0 ? 0 : intersection / maskPixels;
  // If they filled < 20% of the mask, heavily penalize color score
  const colorAccuracyRaw = colorCheckedPixels === 0 ? 0 : colorMatchPixels / colorCheckedPixels;
  const colorScore = Math.min(100, Math.round(colorAccuracyRaw * fillRatio * 100 * 1.5)); // Boost multiplier to be forgiving

  // Total Score according to prompt: (shape * 0.7) + (color * 0.3)
  const totalScore = Math.round((shapeScore * 0.7) + (colorScore * 0.3));

  return { shapeScore, colorScore, totalScore, fillRatio };
}
