export interface Planet {
  id: string;
  name: string;
  color: string;
  size: number;
  orbitRadius: number;
  orbitSpeed: number;
  facts: string[];
  svg: string;
}

export const SUN: Planet = {
  id: 'sun',
  name: 'Sun',
  color: '#FFD700',
  size: 120,
  orbitRadius: 0,
  orbitSpeed: 0,
  facts: ['The Sun is a star!', 'It gives us light and keeps us warm.'],
  svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
        <stop offset="60%" stop-color="#FFE600" stop-opacity="1"/>
        <stop offset="100%" stop-color="#FF8A00" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="sunBody" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#FFFFFF"/>
        <stop offset="30%" stop-color="#FFD700"/>
        <stop offset="100%" stop-color="#FF5E00"/>
      </radialGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <style>
      @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } }
      @keyframes blink { 0%, 96%, 100% { transform: scaleY(1); } 98% { transform: scaleY(0.1); } }
      .sun-aura { animation: pulse 3s ease-in-out infinite; transform-origin: center; }
      .eye { animation: blink 4s infinite; transform-origin: center; }
    </style>
    <circle class="sun-aura" cx="50" cy="50" r="48" fill="url(#sunGlow)"/>
    <circle cx="50" cy="50" r="42" fill="url(#sunBody)" filter="url(#glow)"/>
    <circle class="eye" cx="35" cy="42" r="5" fill="#2D1B00"/>
    <circle class="eye" cx="35" cy="40" r="2" fill="#FFF"/> <circle class="eye" cx="65" cy="42" r="5" fill="#2D1B00"/>
    <circle class="eye" cx="65" cy="40" r="2" fill="#FFF"/> <path d="M 40 55 Q 50 68 60 55" stroke="#2D1B00" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="25" cy="48" r="6" fill="#FF5E00" opacity="0.4"/> <circle cx="75" cy="48" r="6" fill="#FF5E00" opacity="0.4"/>
  </svg>`
};

export const PLANETS: Planet[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    color: '#A8A8A8',
    size: 30,
    orbitRadius: 100,
    orbitSpeed: 0.02,
    facts: ['Mercury is the smallest planet.', 'It is closest to the Sun!'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mercBody" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#E0E0E0"/>
          <stop offset="100%" stop-color="#606060"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#mercBody)"/>
      <path d="M 25 35 A 8 8 0 1 0 25 36" stroke="#505050" stroke-width="2" fill="#808080" opacity="0.6"/>
      <path d="M 75 60 A 12 12 0 1 0 75 61" stroke="#505050" stroke-width="2" fill="#808080" opacity="0.6"/>
      <path d="M 40 80 A 6 6 0 1 0 40 81" stroke="#505050" stroke-width="2" fill="#808080" opacity="0.6"/>
      <circle cx="35" cy="45" r="4" fill="#1A1A1A"/>
      <circle cx="65" cy="45" r="4" fill="#1A1A1A"/>
      <path d="M 45 60 Q 50 65 55 60" stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'venus',
    name: 'Venus',
    color: '#EED053',
    size: 45,
    orbitRadius: 160,
    orbitSpeed: 0.015,
    facts: ['Venus is the hottest planet.', 'It shines very bright in the sky.'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="venusBody" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#FFF0A8"/>
          <stop offset="70%" stop-color="#EAA612"/>
          <stop offset="100%" stop-color="#A55300"/>
        </radialGradient>
        <filter id="venusAtmo">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="44" fill="url(#venusBody)" filter="url(#venusAtmo)"/>
      <path d="M 10 40 Q 40 20 90 45" stroke="#FFF0A8" stroke-width="6" fill="none" opacity="0.4" stroke-linecap="round"/>
      <path d="M 15 65 Q 60 80 85 55" stroke="#C86A00" stroke-width="5" fill="none" opacity="0.4" stroke-linecap="round"/>
      <circle cx="35" cy="45" r="5" fill="#2E1800"/>
      <circle cx="65" cy="45" r="5" fill="#2E1800"/>
      <path d="M 42 62 Q 50 72 58 62" stroke="#2E1800" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <circle cx="22" cy="52" r="5" fill="#FF5E00" opacity="0.5"/>
      <circle cx="78" cy="52" r="5" fill="#FF5E00" opacity="0.5"/>
    </svg>`
  },
  {
    id: 'earth',
    name: 'Earth',
    color: '#4B9CD3',
    size: 50,
    orbitRadius: 230,
    orbitSpeed: 0.01,
    facts: ['Earth is our home!', 'It has water, plants, and animals.'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="earthBody" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#64E1FF"/>
          <stop offset="60%" stop-color="#0065C4"/>
          <stop offset="100%" stop-color="#00215E"/>
        </radialGradient>
        <filter id="earthGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="46" fill="#64E1FF" opacity="0.3" filter="url(#earthGlow)"/>
      <circle cx="50" cy="50" r="44" fill="url(#earthBody)"/>
      <path d="M 15 40 Q 30 15 55 30 T 80 25 Q 85 55 65 70 T 25 75 Q 5 60 15 40" fill="#4CAF50" opacity="0.9"/>
      <path d="M 20 45 Q 35 25 50 40 T 70 35 Q 75 55 60 65 T 30 65 Q 15 55 20 45" fill="#2E7D32" opacity="0.5"/>
      <path d="M 10 30 Q 30 25 40 35" stroke="#FFFFFF" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round"/>
      <path d="M 60 70 Q 75 75 90 65" stroke="#FFFFFF" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round"/>
      <circle cx="35" cy="45" r="5" fill="#1A2E40"/>
      <circle cx="34" cy="43" r="2" fill="#FFF"/>
      <circle cx="65" cy="45" r="5" fill="#1A2E40"/>
      <circle cx="64" cy="43" r="2" fill="#FFF"/>
      <path d="M 40 60 Q 50 72 60 60" stroke="#1A2E40" stroke-width="4" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'mars',
    name: 'Mars',
    color: '#E27B58',
    size: 40,
    orbitRadius: 300,
    orbitSpeed: 0.008,
    facts: ['Mars is the red planet.', 'It has the biggest volcano!'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="marsBody" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FF9E79"/>
          <stop offset="60%" stop-color="#C24115"/>
          <stop offset="100%" stop-color="#5E1400"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="url(#marsBody)"/>
      <path d="M 35 12 Q 50 18 65 12 Q 50 4 35 12" fill="#FFF2EC" opacity="0.9"/>
      <path d="M 15 60 Q 40 40 70 55 T 90 70 Q 50 95 15 60" fill="#8C2500" opacity="0.4"/>
      <circle cx="25" cy="45" r="6" fill="#7A1D00" opacity="0.5"/>
      <circle cx="75" cy="65" r="8" fill="#7A1D00" opacity="0.5"/>
      <circle cx="35" cy="45" r="4" fill="#3A0D00"/>
      <circle cx="65" cy="45" r="4" fill="#3A0D00"/>
      <path d="M 42 62 Q 50 55 58 62" stroke="#3A0D00" stroke-width="3" fill="none" stroke-linecap="round"/> </svg>`
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    color: '#D39C7E',
    size: 90,
    orbitRadius: 400,
    orbitSpeed: 0.005,
    facts: ['Jupiter is the biggest planet!', 'It has a giant red spot.'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="jupBody" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#FCE1CD"/>
          <stop offset="50%" stop-color="#C78A66"/>
          <stop offset="100%" stop-color="#5C3621"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="url(#jupBody)"/>
      <path d="M 10 30 Q 50 25 90 30" stroke="#965D40" stroke-width="8" fill="none" opacity="0.6"/>
      <path d="M 6 50 Q 50 45 94 50" stroke="#E3BCA3" stroke-width="12" fill="none" opacity="0.7"/>
      <path d="M 12 70 Q 50 75 88 70" stroke="#7A4225" stroke-width="9" fill="none" opacity="0.5"/>
      <ellipse cx="65" cy="60" rx="14" ry="8" fill="#A83C22"/>
      <ellipse cx="65" cy="60" rx="9" ry="4" fill="#7A220E"/>
      <circle cx="35" cy="40" r="5" fill="#361C10"/>
      <circle cx="34" cy="38" r="2" fill="#FFF"/>
      <circle cx="65" cy="40" r="5" fill="#361C10"/>
      <circle cx="64" cy="38" r="2" fill="#FFF"/>
      <path d="M 40 55 Q 50 68 60 55" stroke="#361C10" stroke-width="4" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'saturn',
    name: 'Saturn',
    color: '#EAD6B8',
    size: 80,
    orbitRadius: 520,
    orbitSpeed: 0.003,
    facts: ['Saturn has beautiful rings!', 'The rings are made of ice and rock.'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="satBody" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FFF2D6"/>
          <stop offset="60%" stop-color="#DAB784"/>
          <stop offset="100%" stop-color="#735A38"/>
        </radialGradient>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF5E6" stop-opacity="0.9"/>
          <stop offset="50%" stop-color="#BCA075" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#5C4D35" stop-opacity="0.9"/>
        </linearGradient>
      </defs>
      <path d="M 5 50 A 45 15 0 0 1 95 50" fill="none" stroke="url(#ringGrad)" stroke-width="10" transform="rotate(-15 50 50)"/>
      <circle cx="50" cy="50" r="32" fill="url(#satBody)"/>
      <path d="M 22 40 Q 50 35 78 40" stroke="#C2A170" stroke-width="4" fill="none" opacity="0.6"/>
      <path d="M 95 50 A 45 15 0 0 1 5 50" fill="none" stroke="url(#ringGrad)" stroke-width="10" transform="rotate(-15 50 50)"/>
      <path d="M 95 50 A 45 15 0 0 1 5 50" fill="none" stroke="#FFF" stroke-width="1.5" transform="rotate(-15 50 50)" opacity="0.4"/> <circle cx="38" cy="42" r="4" fill="#3D2E1A"/>
      <circle cx="62" cy="42" r="4" fill="#3D2E1A"/>
      <path d="M 45 52 Q 50 60 55 52" stroke="#3D2E1A" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'uranus',
    name: 'Uranus',
    color: '#AEEEEE',
    size: 60,
    orbitRadius: 630,
    orbitSpeed: 0.002,
    facts: ['Uranus spins on its side!', 'It is an ice giant.'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="uraBody" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#E0FFFF"/>
          <stop offset="60%" stop-color="#5BCEFA"/>
          <stop offset="100%" stop-color="#0E5E8A"/>
        </radialGradient>
        <filter id="uraGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <path d="M 50 5 A 12 45 0 0 0 50 95" fill="none" stroke="#90E0EF" stroke-width="3" opacity="0.4"/>
      <circle cx="50" cy="50" r="40" fill="url(#uraBody)" filter="url(#uraGlow)"/>
      <path d="M 12 50 Q 50 50 88 50" stroke="#FFF" stroke-width="2" fill="none" opacity="0.3"/> <path d="M 50 95 A 12 45 0 0 0 50 5" fill="none" stroke="#FFF" stroke-width="4" opacity="0.7"/>
      <g transform="rotate(-90 50 50)">
        <circle cx="38" cy="42" r="4" fill="#0A3652"/>
        <circle cx="62" cy="42" r="4" fill="#0A3652"/>
        <path d="M 45 55 Q 50 62 55 55" stroke="#0A3652" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
    </svg>`
  },
  {
    id: 'neptune',
    name: 'Neptune',
    color: '#4682B4',
    size: 58,
    orbitRadius: 730,
    orbitSpeed: 0.001,
    facts: ['Neptune is very windy and cold.', 'It is the farthest planet.'],
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="nepBody" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#6495ED"/>
          <stop offset="60%" stop-color="#1E448A"/>
          <stop offset="100%" stop-color="#071433"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="42" fill="url(#nepBody)"/>
      <path d="M 10 35 Q 50 25 90 35" stroke="#4169E1" stroke-width="5" fill="none" opacity="0.5"/>
      <path d="M 12 65 Q 50 75 88 65" stroke="#4169E1" stroke-width="6" fill="none" opacity="0.5"/>
      <ellipse cx="70" cy="55" rx="10" ry="5" fill="#0B1E4A" opacity="0.8"/>
      <circle cx="35" cy="42" r="5" fill="#00071A"/>
      <circle cx="34" cy="40" r="2" fill="#FFF"/>
      <circle cx="65" cy="42" r="5" fill="#00071A"/>
      <circle cx="64" cy="40" r="2" fill="#FFF"/>
      <path d="M 42 60 Q 50 65 58 60" stroke="#00071A" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`
  }
];