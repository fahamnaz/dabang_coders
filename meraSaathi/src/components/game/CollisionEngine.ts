import type { PhysicsNode } from './FloatingEngine';

// Basic Circle/Radius Collision checking based on screen percentages
export function checkCollision(nodeA: PhysicsNode, nodeB: PhysicsNode, aspectRatio: number): boolean {
  if (nodeA.isPopped || nodeB.isPopped) return false;

  // Adjust distance calculation for non-square screens to make collision radius feel circular
  const dx = (nodeA.x - nodeB.x) * aspectRatio;
  const dy = nodeA.y - nodeB.y;
  
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Slightly generous threshold so kids can match without pixel-perfect placement
  return distance < 15; 
}
