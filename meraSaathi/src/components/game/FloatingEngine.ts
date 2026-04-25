export interface PhysicsNode {
  id: string;
  x: number;
  y: number;
  baseY: number;
  phaseX: number;
  phaseY: number;
  isDragging: boolean;
  isPopped: boolean;
}

export function initPhysicsNodes(ids: string[], isReplenish = false): Record<string, PhysicsNode> {
  const nodes: Record<string, PhysicsNode> = {};
  
  ids.forEach((id, index) => {
    nodes[id] = {
      id,
      x: 10 + Math.random() * 80, // Random X between 10vw and 90vw
      y: isReplenish ? 110 + (index * 15) : (15 + Math.random() * 60), // Start offscreen if replenishing
      baseY: 15 + Math.random() * 55, // The natural height it wants to float at
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      isDragging: false,
      isPopped: false,
    };
  });
  return nodes;
}