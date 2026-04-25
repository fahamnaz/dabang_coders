import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, BookHeart, Brain, CalendarDays, CheckCheck, ChevronRight, CircleAlert, Clock3, Home, Medal, MessageCircleHeart, PieChart, Rocket, Sparkles, Trophy, Users } from 'lucide-react';
import { Mascot } from '../components/home/Mascot';
import { parentDashboardData } from '../data/parentDashboard';
import { getStoredParentNotifications, subscribeToParentNotifications } from '../utils/parentNotifications';

const HF = '"Comic Sans MS", "Trebuchet MS", "Marker Felt", sans-serif';
const BF = '"Nunito", "Quicksand", "Segoe UI", sans-serif';

function Panel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`rounded-[28px] border-[4px] border-white bg-white/92 p-3 shadow-[0_10px_0_rgba(125,90,255,0.18)] ${className}`}><h2 className="mb-2 px-1 text-[0.82rem] font-black uppercase tracking-[0.18em] text-slate-700" style={{ fontFamily: HF }}>{title}</h2>{children}</section>;
}

export function ParentDashboardRoute() {
  const currentDate = useMemo(() => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()), []);
  const [notifications, setNotifications] = useState(() => [...parentDashboardData.notifications]);
  const pts = useMemo(() => { const max = Math.max(...parentDashboardData.skillPoints.map((x) => x.score)); return parentDashboardData.skillPoints.map((x, i) => ({ ...x, x1: 12 + i * (76 / Math.max(parentDashboardData.skillPoints.length - 1, 1)), y1: 88 - (x.score / max) * 58 })); }, []);
  const trend = useMemo(() => { const v = parentDashboardData.weeklyTrend; const max = Math.max(...v); const min = Math.min(...v); return v.map((n, i) => `${i === 0 ? 'M' : 'L'} ${10 + i * (80 / Math.max(v.length - 1, 1))} ${78 - ((n - min) / Math.max(max - min, 1)) * 42}`).join(' '); }, []);
  const tb = useMemo(() => ({ max: Math.max(...parentDashboardData.weeklyTrend), min: Math.min(...parentDashboardData.weeklyTrend) }), []);
  const picons = { sessions: CalendarDays, minutes: Clock3, tasks: CheckCheck, streak: Sparkles } as const;
  const successCount = notifications.filter((item) => item.tone === 'success').length;
  const warningCount = notifications.filter((item) => item.tone === 'warning').length;
  const infoCount = notifications.filter((item) => item.tone === 'info').length;

  useEffect(() => {
    const syncNotifications = async () => {
      try {
        const stored = await getStoredParentNotifications();
        setNotifications(stored.length > 0 ? stored : [...parentDashboardData.notifications]);
      } catch {
        setNotifications([...parentDashboardData.notifications]);
      }
    };
    syncNotifications();
    const unsubscribe = subscribeToParentNotifications(() => syncNotifications());
    const refreshInterval = window.setInterval(syncNotifications, 30000);
    return () => {
      unsubscribe();
      window.clearInterval(refreshInterval);
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#93d7ff] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_24%),radial-gradient(circle_at_top_right,rgba(255,235,130,0.55),transparent_24%),linear-gradient(180deg,#8fd9ff_0%,#b4f0ff_20%,#d8f7d1_52%,#ffe9a9_100%)]" />
      <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.9),transparent_18%),radial-gradient(circle_at_80%_12%,rgba(255,255,255,0.9),transparent_18%),radial-gradient(circle_at_50%_8%,rgba(255,113,181,0.35),transparent_16%),radial-gradient(circle_at_55%_10%,rgba(255,213,74,0.5),transparent_18%),radial-gradient(circle_at_61%_12%,rgba(107,228,154,0.5),transparent_20%)] opacity-90" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(circle_at_20%_100%,rgba(87,196,120,0.9),transparent_22%),radial-gradient(circle_at_35%_100%,rgba(255,197,94,0.85),transparent_18%),radial-gradient(circle_at_56%_100%,rgba(255,123,172,0.7),transparent_18%),radial-gradient(circle_at_80%_100%,rgba(97,182,255,0.85),transparent_18%)]" />
      <div className="pointer-events-none absolute left-8 top-24 text-5xl opacity-80">🧸</div><div className="pointer-events-none absolute right-8 top-28 text-4xl opacity-80">✨</div><div className="pointer-events-none absolute left-12 bottom-28 text-5xl opacity-75">🎈</div><div className="pointer-events-none absolute right-16 bottom-32 text-5xl opacity-80">🧩</div>
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-start justify-center px-4 py-5 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 20 }} className="w-full rounded-[34px] border-[5px] border-white bg-white/65 p-3 shadow-[0_18px_0_rgba(82,110,191,0.18)] backdrop-blur-md">
          <div className="rounded-[30px] border-[4px] border-white bg-gradient-to-b from-sky-200/95 via-cyan-100/90 to-yellow-100/90 p-3 shadow-[inset_0_2px_0_rgba(255,255,255,0.9)]">
            <div className="flex items-start justify-between gap-3">
              <Link to="/" className="inline-flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-pink-400 text-white shadow-[0_6px_0_rgba(190,24,93,0.45)]"><Home size={18} /></Link>
              <div className="flex-1 text-center"><div className="inline-block rounded-[26px] border-[4px] border-white bg-gradient-to-b from-sky-500 to-blue-500 px-5 py-2 shadow-[0_8px_0_rgba(37,99,235,0.35)]"><h1 className="text-[2.2rem] font-black uppercase leading-none text-yellow-200 sm:text-[2.7rem]" style={{ fontFamily: HF, WebkitTextStroke: '2px #2563eb', textShadow: '0 4px 0 rgba(0,0,0,0.15)' }}>Parent Dashboard</h1></div><p className="mt-2 text-[0.82rem] font-black uppercase tracking-[0.2em] text-slate-600" style={{ fontFamily: HF }}>Smart Learning Companion</p></div>
              <div className="h-10 w-10" />
            </div>

            <div className="mt-3 grid gap-3 rounded-[24px] border-[3px] border-white bg-white/85 px-3 py-3 shadow-[0_8px_0_rgba(148,163,184,0.18)] lg:grid-cols-[1.15fr_1fr_0.9fr]">
              <div><p className="text-[0.76rem] font-bold uppercase tracking-[0.16em] text-slate-500" style={{ fontFamily: BF }}>Child Profile</p><div className="mt-1 flex items-center gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-b from-orange-200 to-rose-300 text-lg shadow-[0_4px_0_rgba(244,114,182,0.28)]">{parentDashboardData.avatarEmoji}</div><div><p className="text-sm font-black text-slate-500">Name</p><p className="text-[1.35rem] font-black text-slate-900" style={{ fontFamily: HF }}>{parentDashboardData.childName.toUpperCase()}</p></div></div></div>
              <div className="rounded-[18px] bg-sky-50 px-3 py-2"><p className="text-[0.76rem] font-bold uppercase tracking-[0.16em] text-slate-500">Learning Profile</p><p className="mt-1 text-[1rem] font-black text-slate-800" style={{ fontFamily: HF }}>{parentDashboardData.learningStyle}</p><p className="mt-1 text-[0.88rem] font-bold text-slate-600">Age band: {parentDashboardData.ageBand} • Focus animal: {parentDashboardData.focusAnimal}</p></div>
              <div className="rounded-[18px] bg-amber-50 px-3 py-2 text-right"><p className="text-[0.76rem] font-bold uppercase tracking-[0.16em] text-slate-500">Current Date</p><p className="mt-1 text-[1rem] font-black text-slate-700" style={{ fontFamily: BF }}>{currentDate}</p><p className="mt-1 text-[0.86rem] font-bold text-slate-500">Confidence {parentDashboardData.confidence}% • Completion {parentDashboardData.completionRate}%</p></div>
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-[1.3fr_0.9fr]">
              <Panel title="Live Skill Graph">
                <div className="grid gap-3 md:grid-cols-[1fr_110px]">
                  <div className="relative h-[180px] overflow-hidden rounded-[22px] border-[3px] border-white bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(230,222,255,0.9)_40%,rgba(255,183,208,0.95)_100%)] p-2">
                    <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:24px_24px]" />
                    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full"><defs><linearGradient id="skillLine" x1="0%" x2="100%" y1="100%" y2="0%"><stop offset="0%" stopColor="#ff8dc2" /><stop offset="50%" stopColor="#ffc94f" /><stop offset="100%" stopColor="#65dca1" /></linearGradient></defs><motion.path d={pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x1} ${p.y1}`).join(' ')} fill="none" stroke="url(#skillLine)" strokeWidth="6" strokeLinecap="round" initial={{ pathLength: 0, opacity: 0.35 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.8, ease: 'easeInOut' }} /></svg>
                    {pts.map((p) => <motion.div key={p.label} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${p.x1}%`, top: `${p.y1}%` }} animate={{ y: [0, -6, 0], scale: [1, 1.04, 1] }} transition={{ duration: 2.8, repeat: Infinity, delay: p.x1 / 35, ease: 'easeInOut' }}><motion.div className="flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white text-[0.68rem] font-black text-white shadow-[0_5px_0_rgba(0,0,0,0.12)]" style={{ backgroundColor: p.color, fontFamily: HF }} animate={{ boxShadow: ['0 5px 0 rgba(0,0,0,0.12)', `0 0 0 8px ${p.color}33`, '0 5px 0 rgba(0,0,0,0.12)'] }} transition={{ duration: 2.8, repeat: Infinity, delay: p.x1 / 35, ease: 'easeInOut' }}>{p.score}</motion.div><span className="mt-1 max-w-[64px] text-center text-[0.56rem] font-black uppercase leading-tight text-slate-600">{p.label}</span></motion.div>)}
                  </div>
                  <div className="flex flex-col justify-between gap-2 rounded-[22px] border-[3px] border-white bg-gradient-to-b from-yellow-100 to-orange-100 p-2 text-center">
                    <div className="rounded-[18px] bg-white/80 px-2 py-2"><Sparkles className="mx-auto mb-1 text-yellow-500" size={18} /><p className="text-[0.62rem] font-black uppercase text-slate-500">Current</p><p className="text-[0.88rem] font-black text-rose-500" style={{ fontFamily: HF }}>{parentDashboardData.currentStrength}</p></div>
                    <div className="rounded-[18px] bg-white/80 px-2 py-2"><p className="text-[0.62rem] font-black uppercase text-slate-500">Score</p><p className="text-[1.2rem] font-black text-orange-500" style={{ fontFamily: HF }}>{parentDashboardData.currentScore}</p></div>
                    <div className="rounded-[18px] bg-white/80 px-2 py-2"><p className="text-[0.62rem] font-black uppercase text-slate-500">Stars</p><p className="text-[1.2rem] font-black text-yellow-500" style={{ fontFamily: HF }}>{parentDashboardData.weeklyStars}</p></div>
                  </div>
                </div>
              </Panel>
              <Panel title="Daily Progress Summary"><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">{parentDashboardData.progressCards.map((it) => { const I = picons[it.icon]; return <div key={it.label} className="flex items-center gap-2 rounded-[18px] border-[3px] border-white bg-white px-2 py-2 shadow-[0_5px_0_rgba(148,163,184,0.14)]"><div className={`flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-b ${it.tone} text-white shadow-[0_4px_0_rgba(0,0,0,0.12)]`}><I size={18} /></div><div className="min-w-0 flex-1"><p className="text-[0.8rem] font-black uppercase text-slate-500">{it.label}</p><p className="text-[1.18rem] font-black text-slate-900" style={{ fontFamily: HF }}>{it.value}<span className="ml-1 text-[0.84rem] text-slate-500">{it.note}</span></p></div><ChevronRight className="text-slate-300" size={16} /></div>; })}</div></Panel>
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1fr_0.95fr]">
              <Panel title="Strong Skills"><div className="space-y-2">{parentDashboardData.strengths.map((x) => <div key={x} className="flex items-center gap-2 rounded-[16px] bg-green-50 px-2 py-2"><CheckCheck size={16} className="text-green-600" /><span className="text-[0.92rem] font-black text-slate-700">{x}</span></div>)}</div></Panel>
              <Panel title="Weak Areas"><div className="space-y-2">{parentDashboardData.weakAreas.map((x) => <div key={x} className="flex items-center gap-2 rounded-[16px] bg-rose-50 px-2 py-2"><CircleAlert size={16} className="text-rose-500" /><span className="text-[0.92rem] font-black text-slate-700">{x}</span></div>)}</div></Panel>
              <Panel title="Spark Moments" className="bg-gradient-to-b from-fuchsia-100 to-pink-100"><div className="space-y-2">{parentDashboardData.sparkMoments.map((x) => <div key={x} className="rounded-[16px] bg-white/85 px-3 py-3"><div className="flex items-start gap-2"><Sparkles className="mt-0.5 text-pink-500" size={16} /><p className="text-[0.92rem] font-black leading-snug text-slate-700">{x}</p></div></div>)}</div></Panel>
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-[1.1fr_0.8fr_1fr]">
              <Panel title="Learning Style Insights" className="bg-gradient-to-b from-cyan-100 to-sky-100"><div className="flex items-center justify-between gap-2 rounded-[18px] bg-white/75 px-3 py-3"><div><p className="text-[0.8rem] font-black uppercase text-slate-500">Best response</p><p className="text-[1rem] font-black text-slate-800" style={{ fontFamily: HF }}>{parentDashboardData.learningStyle}</p></div><div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-200 text-xl shadow-[0_4px_0_rgba(0,0,0,0.1)]">🧠</div></div></Panel>
              <Panel title="Today Badge" className="bg-gradient-to-b from-yellow-100 to-orange-100"><div className="flex h-full items-center justify-center rounded-[18px] bg-white/80 p-3"><div className="text-center"><Trophy className="mx-auto text-yellow-500" size={22} /><p className="mt-1 text-[0.72rem] font-black uppercase text-slate-500">Focus Hero</p><p className="text-[1rem] font-black text-orange-500" style={{ fontFamily: HF }}>Level 2</p></div></div></Panel>
              <Panel title="Weekly Trend" className="bg-gradient-to-b from-violet-100 to-indigo-100"><div className="rounded-[18px] bg-white/80 p-3"><div className="flex items-center justify-between"><p className="text-[0.8rem] font-black uppercase text-slate-500">Attention + confidence</p><BarChart3 size={16} className="text-violet-500" /></div><svg viewBox="0 0 100 60" className="mt-3 h-24 w-full"><motion.path d={trend} fill="none" stroke="#8b5cf6" strokeWidth="3.5" strokeLinecap="round" initial={{ pathLength: 0, opacity: 0.4 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.6, ease: 'easeInOut' }} />{parentDashboardData.weeklyTrend.map((v, i) => { const x = 10 + i * (80 / Math.max(parentDashboardData.weeklyTrend.length - 1, 1)); const y = 78 - ((v - tb.min) / Math.max(tb.max - tb.min, 1)) * 42; return <motion.circle key={i} cx={x} cy={y} r="3.5" fill="#f472b6" stroke="white" strokeWidth="2" animate={{ r: [3.5, 4.8, 3.5] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }} />; })}</svg><div className="mt-2 flex justify-between text-[0.72rem] font-black uppercase text-slate-500"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></Panel>
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-[1.15fr_1.15fr_1.45fr]">
              {parentDashboardData.recommendedActivities.map((card) => <section key={card.title} className={`rounded-[28px] border-[4px] border-white bg-gradient-to-b ${card.tone} p-3 shadow-[0_10px_0_rgba(255,255,255,0.12)]`}><div className="flex h-full flex-col rounded-[20px] bg-white/76 p-3"><div className="flex items-center gap-2"><div className="flex h-11 w-11 items-center justify-center rounded-[16px] border-[3px] border-white bg-white text-2xl shadow-[0_4px_0_rgba(0,0,0,0.08)]">{card.emoji}</div><h2 className="text-[0.9rem] font-black uppercase leading-tight text-slate-700" style={{ fontFamily: HF }}>{card.title}</h2></div><div className="mt-3 flex flex-1 flex-col justify-between rounded-[18px] border-[3px] border-white bg-white/92 px-3 py-3"><div><p className="text-[1.08rem] font-black leading-snug text-slate-800" style={{ fontFamily: BF }}>{card.body}</p><div className="mt-4 grid gap-2">{card.highlights.map((h) => <div key={h} className="flex items-center gap-2 rounded-[14px] bg-slate-50/90 px-3 py-2"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[0.9rem]">{card.emoji}</span><span className="text-[0.88rem] font-black text-slate-700">{h}</span></div>)}</div></div><div className="mt-4 flex items-end justify-between gap-3"><p className="text-[0.86rem] font-bold text-slate-500">{card.footer}</p><button type="button" className="self-start rounded-full border-[3px] border-white bg-white px-4 py-2 text-[0.8rem] font-black uppercase tracking-[0.12em] text-slate-800">{card.cta}</button></div></div></div></section>)}

              <Panel title="Child Activity Notifications" className="bg-gradient-to-b from-sky-100 via-cyan-100 to-emerald-100">
                <div className="grid gap-3">
                  <div className="rounded-[20px] border-[3px] border-white bg-white/92 p-4 shadow-[0_6px_0_rgba(14,165,233,0.12)]"><div className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-sky-500 text-2xl text-white shadow-[0_4px_0_rgba(59,130,246,0.25)]">🔔</div><div className="min-w-0 flex-1"><p className="text-[0.75rem] font-black uppercase tracking-[0.14em] text-slate-500">Live Parent Feed</p><p className="mt-1 text-[1.08rem] font-black text-slate-900" style={{ fontFamily: BF }}>Alex&apos;s learning alerts</p><p className="mt-2 text-[0.92rem] font-bold leading-snug text-emerald-600">Each reward event now creates a real dashboard alert, so new wins appear here as soon as the child earns them.</p></div></div></div>
                  <div className="grid gap-3">
                    {notifications.map((n, i) => <motion.div key={`${n.title}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-[18px] border-[3px] border-white bg-white/90 p-3"><div className="flex items-start gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border-[3px] border-white text-xl shadow-[0_4px_0_rgba(0,0,0,0.08)] ${n.tone === 'success' ? 'bg-green-300' : n.tone === 'warning' ? 'bg-yellow-300' : 'bg-sky-300'}`}>{n.emoji}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="text-[0.98rem] font-black text-slate-900" style={{ fontFamily: HF }}>{n.title}</p><span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[0.72rem] font-black uppercase text-slate-500">{n.time}</span></div><p className="mt-2 text-[0.92rem] font-bold leading-snug text-slate-600">{n.detail}</p></div></div></motion.div>)}
                    <div className="rounded-[18px] border-[3px] border-white bg-white/90 p-3"><p className="text-[0.75rem] font-black uppercase text-slate-500">Parent Summary</p><div className="mt-2 grid gap-2 sm:grid-cols-3 xl:grid-cols-1"><div className="flex items-center gap-2 rounded-[14px] bg-green-50 px-3 py-2"><CheckCheck size={14} className="text-green-600" /><span className="text-[0.9rem] font-black text-slate-700">{successCount} success alerts captured</span></div><div className="flex items-center gap-2 rounded-[14px] bg-yellow-50 px-3 py-2"><CircleAlert size={14} className="text-yellow-600" /><span className="text-[0.9rem] font-black text-slate-700">{warningCount} retry or struggle alerts</span></div><div className="flex items-center gap-2 rounded-[14px] bg-cyan-50 px-3 py-2"><Sparkles size={14} className="text-cyan-600" /><span className="text-[0.9rem] font-black text-slate-700">{infoCount} progress update alerts</span></div></div></div>
                  </div>
                </div>
              </Panel>
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
              <Panel title="Subject Time Split" className="bg-gradient-to-b from-rose-100 to-orange-100"><div className="grid gap-3 md:grid-cols-[0.9fr_1.1fr]"><div className="flex items-center justify-center rounded-[20px] bg-white/85 p-4"><motion.div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-[conic-gradient(#fb7185_0_36%,#a78bfa_36%_64%,#34d399_64%_86%,#fbbf24_86%_100%)]" animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}><div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-center"><div><PieChart className="mx-auto text-orange-400" size={18} /><p className="text-[0.62rem] font-black uppercase text-slate-500">Mix</p></div></div></motion.div></div><div className="space-y-2">{parentDashboardData.subjectBreakdown.map((it) => <div key={it.label} className="rounded-[16px] bg-white/85 px-3 py-2"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: it.color }} /><span className="text-[0.92rem] font-black text-slate-700">{it.label}</span></div><span className="text-[0.92rem] font-black text-slate-500">{it.value}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><motion.div className="h-full rounded-full" style={{ backgroundColor: it.color }} initial={{ width: 0 }} animate={{ width: `${it.value}%` }} transition={{ duration: 1.2, delay: it.value / 1000, ease: 'easeOut' }} /></div></div>)}</div></div></Panel>
              <Panel title="Parent Action Rocket" className="bg-gradient-to-b from-violet-100 to-fuchsia-100"><div className="grid gap-3 md:grid-cols-[0.75fr_1.25fr]"><div className="flex items-center justify-center rounded-[20px] bg-white/80 p-4"><div className="text-center"><Rocket className="mx-auto text-fuchsia-500" size={42} /><p className="mt-2 text-[1rem] font-black text-fuchsia-500" style={{ fontFamily: HF }}>Family Mission</p><p className="mt-1 text-[0.86rem] font-bold text-slate-600">{parentDashboardData.nextMilestone}</p></div></div><div className="space-y-2">{parentDashboardData.parentActions.map((a) => <div key={a} className="flex items-start gap-2 rounded-[16px] bg-white/85 px-3 py-3"><Users className="mt-0.5 text-violet-500" size={16} /><p className="text-[0.92rem] font-black leading-snug text-slate-700">{a}</p></div>)}</div></div></Panel>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-2 rounded-[26px] border-[4px] border-white bg-white/90 px-2 py-2 shadow-[0_10px_0_rgba(148,163,184,0.14)]">
              {[{ icon: Home, active: true, color: '#60a5fa' }, { icon: Brain, active: false, color: '#f472b6' }, { icon: MessageCircleHeart, active: false, color: '#a78bfa' }, { icon: Medal, active: false, color: '#f59e0b' }, { icon: BookHeart, active: false, color: '#34d399' }].map((it, i) => { const I = it.icon; return <div key={i} className={`flex items-center justify-center rounded-[18px] border-[3px] border-white py-2 ${it.active ? 'bg-sky-100 shadow-[0_5px_0_rgba(96,165,250,0.25)]' : 'bg-slate-50'}`}><I size={18} style={{ color: it.color }} /></div>; })}
            </div>
          </div>
        </motion.div>
      </div>
      <Mascot state="happy" line="Alex's newest reward wins now pop into this parent feed automatically." nonce={1} />
    </main>
  );
}
