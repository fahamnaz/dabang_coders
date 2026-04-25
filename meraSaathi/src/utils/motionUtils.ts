export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

export function smoothFollow(current: number, target: number, amount: number) {
  return lerp(current, target, clamp(amount, 0, 1));
}

export function easeOutCubic(value: number) {
  const clamped = clamp(value, 0, 1);
  return 1 - Math.pow(1 - clamped, 3);
}

export function easeOutBack(value: number) {
  const clamped = clamp(value, 0, 1);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(clamped - 1, 3) + c1 * Math.pow(clamped - 1, 2);
}
