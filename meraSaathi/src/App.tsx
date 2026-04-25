import React from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HomeScreen } from './components/home/HomeScreen';
import { OnboardingRoute } from './routes/OnboardingRoute';
import { ScienceSolarRoute } from './routes/ScienceSolarRoute';
import { MatchLettersRoute } from './routes/MatchLettersRoute';
import { GuessWordRoute } from './routes/GuessWordRoute';
import { MathEquationRoute } from './routes/MathEquationRoute';
import { ParentDashboardRoute } from './routes/ParentDashboardRoute';
import { SpeechTherapyRoute } from './routes/SpeechTherapyRoute';
import { DeafLuminaRoute } from './routes/DeafLuminaRoute';
import { SpeechMatchingRoute } from './routes/SpeechMatchingRoute';
import { DrawingMultiplayerRoute } from './routes/DrawingMultiplayerRoute';
import { LoginRoute } from './routes/LoginRoute';
import { SignupRoute } from './routes/SignupRoute';
import { AuthProvider, useAuth } from './store/AuthContext';
import { ProgressProvider } from './store/ProgressContext';
import { RewardPopup } from './components/RewardPopup';

function NotFoundPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <p className="text-cyan-300 text-sm uppercase tracking-[0.35em] mb-4">404</p>
        <h1 className="text-4xl font-black">Route not found</h1>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/5 transition-colors"
          >
            Back to Hub
          </Link>
        </div>
      </div>
    </main>
  );
}

// Loading screen while auth is checking
function AuthLoadingScreen() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-sky-200 flex items-center justify-center">
      <img src="/gardenbg2.jpeg" alt="Loading" className="absolute inset-0 h-full w-full object-cover scale-105 blur-[3px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-sky-300/50" />
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="text-[80px]"
        >
          ⚙️
        </motion.div>
        <p
          className="mt-6 text-3xl font-black text-violet-600"
          style={{ fontFamily: '"Comic Sans MS", cursive' }}
        >
          Loading PlaySpark...
        </p>
      </div>
    </main>
  );
}

function ModeSelectRoute() {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;

  // If not logged in, redirect to login
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-sky-200">
      <img src="/gardenbg2.jpeg" alt="PlaySpark garden" className="absolute inset-0 h-full w-full object-cover scale-105 blur-[3px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-sky-200/30 to-lime-200/40" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          className="w-full max-w-4xl rounded-[44px] border-[6px] border-white bg-white/80 p-8 shadow-[0_24px_0_rgba(0,0,0,0.12)] backdrop-blur-md sm:p-10"
        >
          <div className="text-center">
            <p
              className="inline-flex rounded-full border-[4px] border-white bg-pink-400 px-4 py-2 text-sm font-black uppercase tracking-[0.24em] text-white shadow-[0_8px_0_rgba(0,0,0,0.12)]"
              style={{ fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif' }}
            >
              Choose Mode
            </p>
            <h1
              className="mt-5 text-5xl font-black text-yellow-200 sm:text-7xl"
              style={{ fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif', WebkitTextStroke: '4px #7c3aed', textShadow: '0 6px 0 rgba(0,0,0,0.12)' }}
            >
              PlayGugglu
            </h1>
            <p className="mt-4 text-xl font-black text-slate-700 sm:text-2xl">
              Pick how you want to enter the app.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate('/user')}
              className="rounded-[36px] border-[5px] border-white bg-gradient-to-b from-sky-300 to-cyan-400 p-6 text-left shadow-[0_16px_0_rgba(0,0,0,0.14)] transition-transform hover:-translate-y-1"
            >
              <div className="text-5xl">🎮</div>
              <h2
                className="mt-4 text-3xl font-black text-white"
                style={{ fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif', WebkitTextStroke: '2px #0f766e' }}
              >
                User Mode
              </h2>
              <p className="mt-3 text-lg font-black text-cyan-950">
                Open the app normally and play the learning games.
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/parent-dashboard')}
              className="rounded-[36px] border-[5px] border-white bg-gradient-to-b from-yellow-200 to-orange-300 p-6 text-left shadow-[0_16px_0_rgba(0,0,0,0.14)] transition-transform hover:-translate-y-1"
            >
              <div className="text-5xl">👨‍👩‍👧</div>
              <h2
                className="mt-4 text-3xl font-black text-white"
                style={{ fontFamily: '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif', WebkitTextStroke: '2px #c2410c' }}
              >
                Parent Mode
              </h2>
              <p className="mt-3 text-lg font-black text-orange-950">
                Open the parent dashboard directly and view child progress.
              </p>
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

// AUTH GUARD: Redirects to login if not authenticated
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  if (isLoading) return <AuthLoadingScreen />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// SMART WRAPPER: Shows onboarding if user hasn't onboarded, else HomeScreen
function RootWrapper() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  if (!user.onboarded) {
    return (
      <OnboardingRoute
        onComplete={() => {
          // The onboarding route now saves to server via AuthContext.updateProfile
          // Refresh user to get updated onboarded flag
          window.location.reload();
        }}
      />
    );
  }

  return <HomeScreen />;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/signup" element={<SignupRoute />} />

        {/* Protected routes */}
        <Route path="/" element={<ModeSelectRoute />} />
        <Route path="/user" element={<RequireAuth><RootWrapper /></RequireAuth>} />

        <Route path="/science-solar" element={<RequireAuth><ScienceSolarRoute /></RequireAuth>} />
        <Route path="/english-match-letters" element={<RequireAuth><MatchLettersRoute /></RequireAuth>} />
        <Route path="/english-guess-word" element={<RequireAuth><GuessWordRoute /></RequireAuth>} />
        <Route path="/math-equations" element={<RequireAuth><MathEquationRoute /></RequireAuth>} />
        <Route path="/parent-dashboard" element={<RequireAuth><ParentDashboardRoute /></RequireAuth>} />
        <Route path="/speech-therapy" element={<RequireAuth><SpeechTherapyRoute /></RequireAuth>} />
        <Route path="/speech-matching" element={<RequireAuth><SpeechMatchingRoute /></RequireAuth>} />
        <Route path="/deaf-lumina" element={<RequireAuth><DeafLuminaRoute /></RequireAuth>} />
        <Route path="/drawing-multiplayer" element={<RequireAuth><DrawingMultiplayerRoute /></RequireAuth>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Global reward popup - shows when new badges are earned */}
      <RewardPopup />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <AppRoutes />
      </ProgressProvider>
    </AuthProvider>
  );
}
