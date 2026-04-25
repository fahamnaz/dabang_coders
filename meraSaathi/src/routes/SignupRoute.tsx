import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../store/AuthContext';
import { Mascot } from '../components/home/Mascot';
import type { MascotState } from '../data/mascotConfig';

const HEADING_FONT = '"Fredoka One", "Arial Rounded MT Bold", "Varela Round", "Comic Sans MS", sans-serif';
const BODY_FONT = '"Nunito", "Quicksand", "Segoe UI Rounded", "Comic Sans MS", sans-serif';

export function SignupRoute() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [childName, setChildName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mascotState, setMascotState] = useState<MascotState>('happy');
  const [mascotLine, setMascotLine] = useState("Let's create your world! ✨");
  const [mascotNonce, setMascotNonce] = useState(0);

  const speak = (text: string, state: MascotState) => {
    setMascotLine(text);
    setMascotState(state);
    setMascotNonce(n => n + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signup(email, password, childName);
      speak(`Welcome ${childName}! 🎉`, 'happy');
      // Navigate to onboarding after signup
      setTimeout(() => navigate('/user'), 800);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
      speak('Oops! Try again!', 'thinking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-sky-200 flex items-center justify-center">
      <img src="/gardenbg2.jpeg" alt="Garden Theme" className="absolute inset-0 h-full w-full object-cover scale-105 blur-[3px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-sky-300/50 backdrop-blur-[2px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className="relative z-10 w-full max-w-xl px-6"
      >
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center text-center rounded-[50px] border-[8px] border-white bg-pink-400/90 p-10 sm:p-12 shadow-[0_20px_0_rgba(190,24,93,0.8)] backdrop-blur-sm"
        >
          <motion.span
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="text-[80px] drop-shadow-xl"
          >
            ✨
          </motion.span>

          <h1
            className="mt-4 text-5xl font-black text-white"
            style={{
              fontFamily: HEADING_FONT,
              WebkitTextStroke: '3px #be185d',
              textShadow: '0 6px 0 rgba(0,0,0,0.15)',
            }}
          >
            Join PlaySpark!
          </h1>
          <p className="mt-3 text-xl font-bold text-pink-100" style={{ fontFamily: BODY_FONT }}>
            Create an account to start your learning adventure!
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 w-full rounded-2xl border-4 border-white bg-rose-600 px-4 py-3 shadow-lg"
            >
              <p className="text-lg font-black text-white" style={{ fontFamily: BODY_FONT }}>{error}</p>
            </motion.div>
          )}

          <div className="mt-6 w-full space-y-4">
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="👶 Child's Name"
              required
              className="w-full rounded-[24px] border-[6px] border-white bg-white/95 px-6 py-4 text-2xl font-black text-slate-700 placeholder-slate-300 shadow-[0_8px_0_rgba(0,0,0,0.12)] outline-none transition-all focus:border-yellow-400 text-center"
              style={{ fontFamily: BODY_FONT }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="📧 Parent Email"
              required
              className="w-full rounded-[24px] border-[6px] border-white bg-white/95 px-6 py-4 text-2xl font-black text-slate-700 placeholder-slate-300 shadow-[0_8px_0_rgba(0,0,0,0.12)] outline-none transition-all focus:border-yellow-400 text-center"
              style={{ fontFamily: BODY_FONT }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="🔒 Create Password (6+ chars)"
              required
              minLength={6}
              className="w-full rounded-[24px] border-[6px] border-white bg-white/95 px-6 py-4 text-2xl font-black text-slate-700 placeholder-slate-300 shadow-[0_8px_0_rgba(0,0,0,0.12)] outline-none transition-all focus:border-yellow-400 text-center"
              style={{ fontFamily: BODY_FONT }}
            />
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={!isSubmitting ? { scale: 1.05 } : {}}
            whileTap={!isSubmitting ? { scale: 0.95, y: 4 } : {}}
            className={`mt-8 rounded-3xl border-[6px] border-white px-10 py-5 text-3xl font-black shadow-[0_12px_0_rgba(21,128,61,0.8)] transition-all
              ${isSubmitting
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-green-400 text-green-950 hover:bg-green-300'
              }`}
            style={{ fontFamily: HEADING_FONT }}
          >
            {isSubmitting ? '⏳ Creating...' : 'Create My World! 🌍'}
          </motion.button>

          <p className="mt-6 text-lg font-bold text-pink-200" style={{ fontFamily: BODY_FONT }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-yellow-300 underline underline-offset-4 hover:text-yellow-100 transition-colors"
            >
              Login here!
            </Link>
          </p>
        </form>
      </motion.div>

      <Mascot state={mascotState} line={mascotLine} nonce={mascotNonce} />
    </main>
  );
}
