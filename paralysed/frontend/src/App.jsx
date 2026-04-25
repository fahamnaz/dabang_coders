import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import './index.css';

const WS_SERVER_URL = "ws://localhost:8080";
const API_SERVER_URL = "http://localhost:5000/api";

// ═══════════════════════════════════════════════════════════════
// QUESTION BANK
// ═══════════════════════════════════════════════════════════════
const QUESTIONS = {
  animals: [
    { q: "Which animal says Moo? 🐮", left: { emoji: "🐱", text: "Cat" }, right: { emoji: "🐄", text: "Cow" }, answer: "right" },
    { q: "Which animal can fly? 🦅", left: { emoji: "🐦", text: "Bird" }, right: { emoji: "🐟", text: "Fish" }, answer: "left" },
    { q: "Which animal has a trunk? 🐘", left: { emoji: "🐘", text: "Elephant" }, right: { emoji: "🐕", text: "Dog" }, answer: "left" },
    { q: "Which animal lives in water? 🌊", left: { emoji: "🦁", text: "Lion" }, right: { emoji: "🐠", text: "Fish" }, answer: "right" },
    { q: "Which animal hops? 🦘", left: { emoji: "🐢", text: "Turtle" }, right: { emoji: "🐰", text: "Rabbit" }, answer: "right" },
    { q: "Which animal says Woof? 🐶", left: { emoji: "🐕", text: "Dog" }, right: { emoji: "🐈", text: "Cat" }, answer: "left" },
    { q: "Which one is the King of the Jungle? 👑", left: { emoji: "🐁", text: "Mouse" }, right: { emoji: "🦁", text: "Lion" }, answer: "right" },
  ],
  colors: [
    { q: "Which one is Red? ❤️", left: { emoji: "🔴", text: "Red" }, right: { emoji: "🔵", text: "Blue" }, answer: "left" },
    { q: "Which one is Yellow? ☀️", left: { emoji: "🟢", text: "Green" }, right: { emoji: "🟡", text: "Yellow" }, answer: "right" },
    { q: "What color is the sky? 🌤️", left: { emoji: "🔵", text: "Blue" }, right: { emoji: "🟠", text: "Orange" }, answer: "left" },
    { q: "What color is grass? 🌿", left: { emoji: "🟣", text: "Purple" }, right: { emoji: "🟢", text: "Green" }, answer: "right" },
    { q: "What color is the sun? ☀️", left: { emoji: "🟡", text: "Yellow" }, right: { emoji: "⚫", text: "Black" }, answer: "left" },
    { q: "What color is snow? ❄️", left: { emoji: "🟤", text: "Brown" }, right: { emoji: "⚪", text: "White" }, answer: "right" },
  ],
  numbers: [
    { q: "Which number is bigger?", left: { emoji: "3️⃣", text: "Three" }, right: { emoji: "7️⃣", text: "Seven" }, answer: "right" },
    { q: "Which number is smaller?", left: { emoji: "2️⃣", text: "Two" }, right: { emoji: "9️⃣", text: "Nine" }, answer: "left" },
    { q: "What is 1 + 1?", left: { emoji: "2️⃣", text: "Two" }, right: { emoji: "3️⃣", text: "Three" }, answer: "left" },
    { q: "What is 2 + 3?", left: { emoji: "4️⃣", text: "Four" }, right: { emoji: "5️⃣", text: "Five" }, answer: "right" },
    { q: "Which is bigger?", left: { emoji: "🔟", text: "Ten" }, right: { emoji: "5️⃣", text: "Five" }, answer: "left" },
    { q: "What comes after 3?", left: { emoji: "4️⃣", text: "Four" }, right: { emoji: "6️⃣", text: "Six" }, answer: "left" },
  ],
  shapes: [
    { q: "Which is a Circle? ⭕", left: { emoji: "⭐", text: "Star" }, right: { emoji: "🔵", text: "Circle" }, answer: "right" },
    { q: "Which has 3 sides? 📐", left: { emoji: "🔺", text: "Triangle" }, right: { emoji: "🟥", text: "Square" }, answer: "left" },
    { q: "Which is a Star? ✨", left: { emoji: "🔷", text: "Diamond" }, right: { emoji: "⭐", text: "Star" }, answer: "right" },
    { q: "Which is a Square? 🟩", left: { emoji: "🟩", text: "Square" }, right: { emoji: "🔺", text: "Triangle" }, answer: "left" },
    { q: "Which is a Heart? 💖", left: { emoji: "❤️", text: "Heart" }, right: { emoji: "🔵", text: "Circle" }, answer: "left" },
    { q: "Which has 4 equal sides?", left: { emoji: "🔺", text: "Triangle" }, right: { emoji: "🟧", text: "Square" }, answer: "right" },
  ],
};

const CATEGORIES = [
  { id: "animals", label: "Animals", emoji: "🦁", cardClass: "card-animals" },
  { id: "colors", label: "Colors", emoji: "🎨", cardClass: "card-colors" },
  { id: "numbers", label: "Numbers", emoji: "🔢", cardClass: "card-numbers" },
  { id: "shapes", label: "Shapes", emoji: "⭐", cardClass: "card-shapes" },
];

const QUESTIONS_PER_ROUND = 5;

// ═══════════════════════════════════════════════════════════════
// TTS Helper
// ═══════════════════════════════════════════════════════════════
function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.15;
    window.speechSynthesis.speak(utterance);
  }
}

// ═══════════════════════════════════════════════════════════════
// Confetti Helper
// ═══════════════════════════════════════════════════════════════
function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#4facfe', '#00f2fe', '#a855f7', '#f472b6', '#34d399', '#fbbf24'],
  });
}

function fireBigConfetti() {
  const duration = 1500;
  const end = Date.now() + duration;
  const frame = () => {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#4facfe', '#34d399', '#fbbf24'] });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#a855f7', '#f472b6', '#fb923c'] });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

// Shuffle array utility
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
function App() {
  // ── Global state ──
  const [screen, setScreen] = useState("welcome"); // welcome | mode | category | quiz | results
  const [mode, setMode] = useState(null); // "neck" | "eye"
  const [hoveredDir, setHoveredDir] = useState(null); // "left" | "right" | null
  const [dwellProgress, setDwellProgress] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const lockRef = useRef(false); // prevents input during feedback animations

  // ── Category state ──
  const [categoryPage, setCategoryPage] = useState(0);

  // ── Quiz state ──
  const [category, setCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState(null); // "correct" | "wrong" | null
  const [feedbackDir, setFeedbackDir] = useState(null); // which side was selected

  // ── WebSocket ──
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(WS_SERVER_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        // Send mode to engine if we already picked one
        if (mode) {
          ws.send(JSON.stringify({ set_mode: mode }));
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Auto-reconnect after 2s
        setTimeout(connect, 2000);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.hovering !== undefined) {
          setHoveredDir(data.hovering === "none" ? null : data.hovering);
          setDwellProgress(data.dwell_progress);
        }

        if (data.triggered) {
          handleTrigger(data.triggered);
        }
      };
    };

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // ── Trigger handler (dispatches based on current screen) ──
  const handleTrigger = useCallback((direction) => {
    if (lockRef.current) return; // ignore during animation lock

    // We read screen from a ref-like approach using setState callback
    setScreen((currentScreen) => {
      switch (currentScreen) {
        case "welcome":
          speak("Let's get started!");
          return "mode";

        case "mode":
          handleModeTrigger(direction);
          return currentScreen; // screen change happens inside handler

        case "category":
          handleCategoryTrigger(direction);
          return currentScreen;

        case "quiz":
          handleQuizTrigger(direction);
          return currentScreen;

        case "results":
          handleResultsTrigger(direction);
          return currentScreen;

        default:
          return currentScreen;
      }
    });
  }, []);

  // ── Mode Selection ──
  const handleModeTrigger = useCallback((direction) => {
    const selectedMode = direction === "left" ? "neck" : "eye";
    setMode(selectedMode);

    // Send mode to Python engine
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ set_mode: selectedMode }));
    }

    const label = direction === "left" ? "Neck movement mode" : "Eye tracking mode";
    speak(label + " selected!");

    lockRef.current = true;
    setTimeout(() => {
      lockRef.current = false;
      setCategoryPage(0);
      setScreen("category");
      speak("Pick a category! Look left or right.");
    }, 1000);
  }, []);

  // ── Category Selection ──
  const handleCategoryTrigger = useCallback((direction) => {
    setCategoryPage((prevPage) => {
      const startIdx = prevPage * 2;
      const leftCat = CATEGORIES[startIdx];
      const rightCat = CATEGORIES[startIdx + 1];

      if (direction === "left" && leftCat) {
        startQuiz(leftCat.id);
      } else if (direction === "right" && rightCat) {
        startQuiz(rightCat.id);
      }
      return prevPage;
    });
  }, []);

  const startQuiz = useCallback((catId) => {
    const allQs = QUESTIONS[catId];
    const selected = shuffle(allQs).slice(0, QUESTIONS_PER_ROUND);
    setCategory(catId);
    setQuestions(selected);
    setQIndex(0);
    setScore(0);
    setStreak(0);
    setCorrectCount(0);
    setFeedback(null);
    setFeedbackDir(null);

    const catLabel = CATEGORIES.find(c => c.id === catId)?.label || catId;
    speak(`Let's play ${catLabel}!`);

    lockRef.current = true;
    setTimeout(() => {
      lockRef.current = false;
      setScreen("quiz");
      setTimeout(() => {
        // Read the first question
        if (selected[0]) speak(selected[0].q);
      }, 600);
    }, 800);
  }, []);

  // ── Quiz Answer ──
  const handleQuizTrigger = useCallback((direction) => {
    setQuestions((currentQuestions) => {
      setQIndex((currentQIndex) => {
        const currentQ = currentQuestions[currentQIndex];
        if (!currentQ) return currentQIndex;

        const isCorrect = direction === currentQ.answer;
        setFeedback(isCorrect ? "correct" : "wrong");
        setFeedbackDir(direction);

        if (isCorrect) {
          setScore((s) => s + 10);
          setStreak((s) => s + 1);
          setCorrectCount((c) => c + 1);
          fireConfetti();
          speak("Great job!");
        } else {
          setStreak(0);
          speak("Not quite! The answer was " + (currentQ.answer === "left" ? currentQ.left.text : currentQ.right.text));
        }

        lockRef.current = true;

        setTimeout(() => {
          setFeedback(null);
          setFeedbackDir(null);

          const nextIdx = currentQIndex + 1;
          if (nextIdx >= currentQuestions.length) {
            // Quiz complete
            lockRef.current = false;
            setScreen("results");
            setTimeout(() => {
              fireBigConfetti();
              speak("Amazing! You finished!");
            }, 500);
          } else {
            setQIndex(nextIdx);
            lockRef.current = false;
            setTimeout(() => {
              speak(currentQuestions[nextIdx].q);
            }, 400);
          }
        }, 1800);

        return currentQIndex;
      });
      return currentQuestions;
    });
  }, []);

  // ── Results Actions ──
  const handleResultsTrigger = useCallback((direction) => {
    if (direction === "left") {
      // Play again same category
      speak("Let's play again!");
      lockRef.current = true;
      setTimeout(() => {
        lockRef.current = false;
        startQuiz(category);
      }, 500);
    } else {
      // Back to categories
      speak("Picking a new category!");
      lockRef.current = true;
      setTimeout(() => {
        lockRef.current = false;
        setCategoryPage(0);
        setScreen("category");
      }, 500);
    }
  }, [category, startQuiz]);

  // ── Log session to backend (best effort) ──
  const logSession = useCallback(async () => {
    try {
      await fetch(`${API_SERVER_URL}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          mode,
          score,
          totalQuestions: questions.length,
          correctAnswers: correctCount,
        }),
      });
    } catch (err) {
      // Silent fail — backend is optional
    }
  }, [category, mode, score, questions, correctCount]);

  // Log when we reach results
  useEffect(() => {
    if (screen === "results" && questions.length > 0) {
      logSession();
    }
  }, [screen]);

  // ── Render helpers ──
  const isHovered = (dir) => hoveredDir === dir && !lockRef.current;

  const renderDwell = (dir) => {
    if (!isHovered(dir) || dwellProgress <= 0) return null;
    return (
      <>
        <div className="dwell-ring" style={{ '--progress': `${dwellProgress}%` }} />
        <div className="dwell-bar" style={{ width: `${dwellProgress}%` }} />
      </>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // SCREENS
  // ═══════════════════════════════════════════════════════════

  // ── Welcome ──
  if (screen === "welcome") {
    return (
      <div className="app">
        {!wsConnected && <div className="status-badge">⏳ Waiting for Eye Tracker...</div>}
        <div className="screen welcome-screen">
          <div className="welcome-logo">🧠</div>
          <h1 className="welcome-title">Play Gugglu</h1>
          <p className="welcome-subtitle">Learning made magical ✨</p>
          <p className="welcome-start-hint">
            Look <span>left</span> or <span>right</span> to start
          </p>
        </div>
      </div>
    );
  }

  // ── Mode Selection ──
  if (screen === "mode") {
    return (
      <div className="app">
        {!wsConnected && <div className="status-badge">⏳ Waiting for Eye Tracker...</div>}
        <div className="screen">
          <div className="screen-header">
            <span className="screen-emoji">🎯</span>
            <h1 className="screen-title">How do you interact?</h1>
            <p className="screen-subtitle">Look at your choice to select</p>
          </div>
          <div className="choice-container">
            <div className={`choice-card card-neck slide-left ${isHovered("left") ? "hovered" : ""}`}>
              {renderDwell("left")}
              <div className="card-icon">🦒</div>
              <div className="card-label">I can move my neck</div>
              <div className="card-sublabel">Head movement tracking</div>
              <div className="direction-label">◀ LOOK LEFT</div>
            </div>
            <div className={`choice-card card-eye slide-right ${isHovered("right") ? "hovered" : ""}`}>
              {renderDwell("right")}
              <div className="card-icon">👁️</div>
              <div className="card-label">I can move my eyes</div>
              <div className="card-sublabel">Eye-only tracking</div>
              <div className="direction-label">LOOK RIGHT ▶</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Category Selection ──
  if (screen === "category") {
    const startIdx = categoryPage * 2;
    const leftCat = CATEGORIES[startIdx];
    const rightCat = CATEGORIES[startIdx + 1];
    const totalPages = Math.ceil(CATEGORIES.length / 2);

    return (
      <div className="app">
        {!wsConnected && <div className="status-badge">⏳ Waiting for Eye Tracker...</div>}
        <div className="screen">
          <div className="screen-header">
            <span className="screen-emoji">📚</span>
            <h1 className="screen-title">Pick a Category</h1>
            <p className="screen-subtitle">What do you want to learn?</p>
          </div>
          <div className="choice-container">
            {leftCat && (
              <div className={`choice-card ${leftCat.cardClass} slide-left ${isHovered("left") ? "hovered" : ""}`}>
                {renderDwell("left")}
                <div className="card-icon">{leftCat.emoji}</div>
                <div className="card-label">{leftCat.label}</div>
                <div className="direction-label">◀ LOOK LEFT</div>
              </div>
            )}
            {rightCat && (
              <div className={`choice-card ${rightCat.cardClass} slide-right ${isHovered("right") ? "hovered" : ""}`}>
                {renderDwell("right")}
                <div className="card-icon">{rightCat.emoji}</div>
                <div className="card-label">{rightCat.label}</div>
                <div className="direction-label">LOOK RIGHT ▶</div>
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="category-nav">
              {Array.from({ length: totalPages }, (_, i) => (
                <div key={i} className={`category-dot ${i === categoryPage ? "active" : ""}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Quiz ──
  if (screen === "quiz") {
    const currentQ = questions[qIndex];
    if (!currentQ) return null;

    const leftFeedback = feedbackDir === "left" ? feedback : (feedback === "correct" && currentQ.answer === "left" ? "correct" : null);
    const rightFeedback = feedbackDir === "right" ? feedback : (feedback === "correct" && currentQ.answer === "right" ? "correct" : null);

    // Show correct answer highlight when wrong
    const showCorrectLeft = feedback === "wrong" && currentQ.answer === "left";
    const showCorrectRight = feedback === "wrong" && currentQ.answer === "right";

    return (
      <div className="app">
        {!wsConnected && <div className="status-badge">⏳ Waiting for Eye Tracker...</div>}
        <div className="screen">
          <div className="quiz-header">
            <div className="quiz-stats">
              <div className="quiz-stat stat-score">
                <span className="stat-icon">⭐</span> {score}
              </div>
              <div className="quiz-stat stat-streak">
                <span className="stat-icon">🔥</span> {streak}
              </div>
            </div>
            <div className="quiz-stat stat-progress-text">
              {qIndex + 1} / {questions.length}
            </div>
          </div>

          <div className="quiz-question-box">
            <div className="quiz-question-text">{currentQ.q}</div>
          </div>

          <div className="choice-container quiz-choices">
            <div className={`choice-card card-left slide-left ${isHovered("left") ? "hovered" : ""} ${leftFeedback || ""} ${showCorrectLeft ? "correct" : ""}`}>
              {renderDwell("left")}
              <div className="answer-emoji">{currentQ.left.emoji}</div>
              <div className="answer-text">{currentQ.left.text}</div>
              {leftFeedback === "correct" && <div className="feedback-overlay feedback-correct">✅</div>}
              {leftFeedback === "wrong" && <div className="feedback-overlay feedback-wrong">❌</div>}
              <div className="direction-label">◀ LOOK LEFT</div>
            </div>
            <div className={`choice-card card-right slide-right ${isHovered("right") ? "hovered" : ""} ${rightFeedback || ""} ${showCorrectRight ? "correct" : ""}`}>
              {renderDwell("right")}
              <div className="answer-emoji">{currentQ.right.emoji}</div>
              <div className="answer-text">{currentQ.right.text}</div>
              {rightFeedback === "correct" && <div className="feedback-overlay feedback-correct">✅</div>}
              {rightFeedback === "wrong" && <div className="feedback-overlay feedback-wrong">❌</div>}
              <div className="direction-label">LOOK RIGHT ▶</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Results ──
  if (screen === "results") {
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const stars = accuracy >= 80 ? "⭐⭐⭐" : accuracy >= 50 ? "⭐⭐" : "⭐";
    const catLabel = CATEGORIES.find(c => c.id === category)?.label || "";

    return (
      <div className="app">
        <div className="screen results-screen">
          <div className="results-stars">{stars}</div>
          <div className="results-score-big">{score} pts</div>
          <div className="results-label">{catLabel} Complete!</div>
          <div className="results-accuracy">
            {correctCount} / {questions.length} correct — {accuracy}% accuracy
          </div>
          <div className="choice-container results-actions">
            <div className={`choice-card card-left slide-left ${isHovered("left") ? "hovered" : ""}`}>
              {renderDwell("left")}
              <div className="card-icon">🔄</div>
              <div className="card-label">Play Again</div>
              <div className="card-sublabel">Same category</div>
              <div className="direction-label">◀ LOOK LEFT</div>
            </div>
            <div className={`choice-card card-right slide-right ${isHovered("right") ? "hovered" : ""}`}>
              {renderDwell("right")}
              <div className="card-icon">📚</div>
              <div className="card-label">New Category</div>
              <div className="card-sublabel">Pick something else</div>
              <div className="direction-label">LOOK RIGHT ▶</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
