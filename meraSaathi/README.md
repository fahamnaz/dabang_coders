# Gugglu Learning Land

Gugglu Learning Land is a playful browser-based learning app for children built with React, Vite, and MediaPipe hand tracking. It combines gesture-driven mini-games, a child onboarding flow, and a parent dashboard that shows progress, strengths, weak areas, and live activity notifications.

## Features

- `User Mode` and `Parent Mode` entry flow
- hand-tracking powered gameplay using webcam input
- animated subject hub for English, Maths, and Science
- English games:
  - Match Letters
  - Guess the Word
- Maths game:
  - Build the Equation
- Science game:
  - Solar System Adventure
- parent onboarding with saved parent email
- parent dashboard with:
  - child profile summary
  - animated progress graphs
  - strengths and weak areas
  - recommended activities
  - live child activity notifications based on reward events
- Vercel-ready SPA routing

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- MediaPipe Tasks Vision
- Canvas Confetti
- Lucide React

## Project Structure

```text
src/
  components/
    game/
    home/
  data/
  hooks/
  routes/
  store/
  utils/
public/
```

Important files:

- `src/App.tsx`: route setup and initial mode selection
- `src/components/home/HomeScreen.tsx`: child home screen and subject selection
- `src/routes/OnboardingRoute.tsx`: onboarding flow and parent email capture
- `src/routes/ParentDashboardRoute.tsx`: parent dashboard UI
- `src/utils/parentNotifications.ts`: live parent notification storage and sync
- `src/hooks/useHandTracking.ts`: webcam hand tracking logic

## Routes

- `/`: mode selection
- `/user`: child app flow
- `/parent-dashboard`: parent dashboard
- `/english-match-letters`: Match Letters game
- `/english-guess-word`: Guess the Word game
- `/math-equations`: Build the Equation game
- `/science-solar`: Solar System Adventure

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- a webcam for gesture-based gameplay

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### Type Check

```bash
npm run lint
```

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

This repo includes an `.env.example` file.

Available variables:

- `GEMINI_API_KEY`
- `APP_URL`

If needed, create a local env file like `.env.local` and add your values there.

## Parent Dashboard Notes

The parent dashboard reads child progress notifications from local storage. When a reward event happens inside supported games, a parent-facing notification is created and shown in the dashboard feed.

Current dashboard behavior includes:

- stored onboarding email
- saved onboarding completion state
- saved child activity notifications
- relative timestamps like `Just now` and `1 min ago`

## Deployment

This app is configured for Vercel.

The repo includes:

- `vercel.json` for SPA rewrites

Deploy with:

```bash
vercel --prod
```

## Notes

- Best experience is in desktop Chrome because webcam hand tracking is central to gameplay.
- Safari and some browsers may behave differently for camera permissions, speech synthesis, or MediaPipe performance.
- Some features are intentionally still marked as coming soon in the subject hub.

## Future Improvements

- code splitting to reduce bundle size
- backend-backed parent reports and persistent storage
- more learning games and subject coverage
- richer retry and struggle analytics in the dashboard
- Safari and mobile optimization pass

## License

Add your preferred license here.
# playgugglo
