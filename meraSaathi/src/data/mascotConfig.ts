export type MascotState = 'idle' | 'talking' | 'happy' | 'hover' | 'thinking';
export type MascotDialogueGroup = 'home' | 'hover' | 'success' | 'error';

export interface MascotVideoSource {
  remote: string;
  fallback: string;
  posterLabel: string;
  posterAccent: string;
}

export const mascotVideos: Record<MascotState, MascotVideoSource> = {
  idle: {
    remote: 'https://assets.masko.ai/218728/fluffpuff-3aa6/mascot-stays-completely-still-only-a-soft-natural--b2de8396.webm',
    fallback: '/blinking.mp4',
    posterLabel: 'Hi!',
    posterAccent: '#67e8f9',
  },
  talking: {
    remote: 'https://assets.masko.ai/845c23/fluffball-9564/mascot-moves-body-minimal-but-cutely-feel-alive-li-0e372774.webm',
    fallback: '/speaking.mp4',
    posterLabel: 'Talk',
    posterAccent: '#f59e0b',
  },
  happy: {
    remote: 'https://assets.masko.ai/fdbe91/fluffernuffball-3f39/joyful-bounce-5efb6fac.webm',
    fallback: '/jumping.mp4',
    posterLabel: 'Yay!',
    posterAccent: '#f472b6',
  },
  hover: {
    remote: 'https://assets.masko.ai/fdbe91/fluffernuffball-3f39/joyful-bounce-5efb6fac.webm',
    fallback: '/liking-leg.mp4',
    posterLabel: 'Play',
    posterAccent: '#a78bfa',
  },
  thinking: {
    remote: 'https://assets.masko.ai/60a441/fluffern-e04f/a-cute-fluffy-chibi-style-mascot-in-a-calm-idle-po-b130a813.webm',
    fallback: '/thinking.mp4',
    posterLabel: 'Hmm',
    posterAccent: '#34d399',
  },
};

export const mascotDialogues: Record<MascotDialogueGroup, string[]> = {
  home: ['Hi!', "Let's play!", 'Pick a subject!'],
  hover: ['Nice!', 'Try this!'],
  success: ['Yay!', 'Great job!'],
  error: ['Oops!', 'Try again!'],
};
