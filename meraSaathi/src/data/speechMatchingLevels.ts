export interface MatchingPair {
  id: string;
  objectName: string;
  objectEmoji: string;
  categoryName: string;
  categoryEmoji: string;
}

export interface MatchingLevel {
  id: string;
  title: string;
  pairs: MatchingPair[];
}

export const matchingLevels: MatchingLevel[] = [
  {
    id: 'lvl-1',
    title: 'Colors & Shapes',
    pairs: [
      { id: 'p1-1', objectName: 'Apple', objectEmoji: '🍎', categoryName: 'Red', categoryEmoji: '🔴' },
      { id: 'p1-2', objectName: 'Sun', objectEmoji: '☀️', categoryName: 'Yellow', categoryEmoji: '🟡' },
      { id: 'p1-3', objectName: 'Leaf', objectEmoji: '🍃', categoryName: 'Green', categoryEmoji: '🟢' },
      { id: 'p1-4', objectName: 'Sky', objectEmoji: '🌌', categoryName: 'Blue', categoryEmoji: '🔵' },
      { id: 'p1-5', objectName: 'Snowman', objectEmoji: '⛄', categoryName: 'White', categoryEmoji: '⚪' },
    ]
  },
  {
    id: 'lvl-2',
    title: 'Animal Kingdom',
    pairs: [
      { id: 'p2-1', objectName: 'Lion', objectEmoji: '🦁', categoryName: 'Animal', categoryEmoji: '🐾' },
      { id: 'p2-2', objectName: 'Butterfly', objectEmoji: '🦋', categoryName: 'Insect', categoryEmoji: '🐛' },
      { id: 'p2-3', objectName: 'Parrot', objectEmoji: '🦜', categoryName: 'Bird', categoryEmoji: '🪶' },
      { id: 'p2-4', objectName: 'Shark', objectEmoji: '🦈', categoryName: 'Fish', categoryEmoji: '🐟' },
      { id: 'p2-5', objectName: 'Snake', objectEmoji: '🐍', categoryName: 'Reptile', categoryEmoji: '🦎' },
    ]
  },
  {
    id: 'lvl-3',
    title: 'Food & Drinks',
    pairs: [
      { id: 'p3-1', objectName: 'Water', objectEmoji: '💧', categoryName: 'Drink', categoryEmoji: '🥤' },
      { id: 'p3-2', objectName: 'Carrot', objectEmoji: '🥕', categoryName: 'Vegetable', categoryEmoji: '🥗' },
      { id: 'p3-3', objectName: 'Banana', objectEmoji: '🍌', categoryName: 'Fruit', categoryEmoji: '🍇' },
      { id: 'p3-4', objectName: 'Cake', objectEmoji: '🍰', categoryName: 'Dessert', categoryEmoji: '🍩' },
      { id: 'p3-5', objectName: 'Chicken', objectEmoji: '🍗', categoryName: 'Meat', categoryEmoji: '🥩' },
    ]
  },
  {
    id: 'lvl-4',
    title: 'Transportation',
    pairs: [
      { id: 'p4-1', objectName: 'Car', objectEmoji: '🚗', categoryName: 'Road', categoryEmoji: '🛣️' },
      { id: 'p4-2', objectName: 'Airplane', objectEmoji: '✈️', categoryName: 'Sky', categoryEmoji: '☁️' },
      { id: 'p4-3', objectName: 'Boat', objectEmoji: '⛵', categoryName: 'Water', categoryEmoji: '🌊' },
      { id: 'p4-4', objectName: 'Train', objectEmoji: '🚂', categoryName: 'Track', categoryEmoji: '🛤️' },
      { id: 'p4-5', objectName: 'Rocket', objectEmoji: '🚀', categoryName: 'Space', categoryEmoji: '🌌' },
    ]
  },
  {
    id: 'lvl-5',
    title: 'Clothing & Weather',
    pairs: [
      { id: 'p5-1', objectName: 'Jacket', objectEmoji: '🧥', categoryName: 'Cold', categoryEmoji: '❄️' },
      { id: 'p5-2', objectName: 'Sunglasses', objectEmoji: '🕶️', categoryName: 'Sunny', categoryEmoji: '☀️' },
      { id: 'p5-3', objectName: 'Umbrella', objectEmoji: '☂️', categoryName: 'Rain', categoryEmoji: '🌧️' },
      { id: 'p5-4', objectName: 'Scarf', objectEmoji: '🧣', categoryName: 'Winter', categoryEmoji: '⛄' },
      { id: 'p5-5', objectName: 'Hat', objectEmoji: '🧢', categoryName: 'Summer', categoryEmoji: '🏖️' },
    ]
  }
];
