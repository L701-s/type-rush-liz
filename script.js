const TEXTS = {
  easy: [
    "the sun is bright and the sky is blue today",
    "cats like to sleep on warm windows in the afternoon",
    "practice a little every day and your speed will grow",
    "a good keyboard and calm hands make typing easier",
    "small steps still move you closer to your goal",
  ],
  medium: [
    "Typing becomes smoother when you look at the screen instead of the keys.",
    "Accuracy matters more than speed at first; the speed will follow later.",
    "Keep your wrists relaxed and let your fingers travel the shortest path.",
    "A timer can feel intense, but it also helps you notice real progress.",
    "Focus on the next word, not the last mistake you already made.",
  ],
  hard: [
    "Rhythm, posture, and patience turn clumsy keystrokes into reliable muscle memory.",
    "Punctuation, capitals, and unusual words expose the gaps in your typing habits.",
    "When the clock is running, resist the urge to rush; clean input beats frantic speed.",
    "The difference between 40 and 80 words per minute is usually consistency, not talent.",
    "Challenge yourself with longer sentences so your fingers learn to stay in flow.",
  ],
};

const wordsEl = document.getElementById("words");
const inputEl = document.getElementById("input");
const hintEl = document.getElementById("hint");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const timerEl = document.getElementById("timer");
const bestEl = document.getElementById("best");
const resultsEl = document.getElementById("results");
const resultWpmEl = document.getElementById("result-wpm");
const resultAccuracyEl = document.getElementById("result-accuracy");
const resultCharsEl = document.getElementById("result-chars");
const resultErrorsEl = document.getElementById("result-errors");
const newBestEl = document.getElementById("new-best");

const BEST_KEY = "typerush-best-wpm";

let duration = 15;
let difficulty = "easy";
let target = "";
let started = false;
let finished = false;
let startTime = 0;
let remaining = duration;
let timerId = null;
let typed = "";
let errors = 0;

function loadBest() {
  const saved = Number(localStorage.getItem(BEST_KEY) || 0);
  bestEl.textContent = String(saved);
  return saved;
}

function pickText() {
  const pool = TEXTS[difficulty];
  let next = pool[Math.floor(Math.random() * pool.length)];
  while (pool.length > 1 && next === target) {
    next = pool[Math.floor(Math.random() * pool.length)];
  }
  target = next;
}

function renderWords() {
  wordsEl.innerHTML = "";
  [...target].forEach((ch, index) => {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = ch;
    if (index < typed.length) {
      span.classList.add(typed[index] === ch ? "correct" : "incorrect");
    } else if (index === typed.length && !finished) {
      span.classList.add("current");
    }
    wordsEl.appendChild(span);
  });
}

function calcStats() {
  const elapsedMinutes = Math.max((Date.now() - startTime) / 1000 / 60, 1 / 60);
  const correctChars = [...typed].filter((ch, i) => ch === target[i]).length;
  const wpm = Math.round((correctChars / 5) / elapsedMinutes);
  const accuracy = typed.length === 0 ? 100 : Math.round((correctChars / typed.length) * 100);
  return { wpm, accuracy, correctChars };
}

function updateLiveStats() {
  if (!started) {
    wpmEl.textContent = "0";
    accuracyEl.textContent = "100%";
    return;
  }
  const { wpm, accuracy } = calcStats();
  wpmEl.textContent = String(wpm);
  accuracyEl.textContent = `${accuracy}%`;
}

function tick() {
  remaining -= 1;
  timerEl.textContent = String(remaining);
  updateLiveStats();
  if (remaining <= 0) {
    finish();
  }
}

function start() {
  if (started || finished) return;
  started = true;
  startTime = Date.now();
  hintEl.textContent = "Keep going. Restart anytime.";
  timerId = setInterval(tick, 1000);
}

function finish() {
  if (finished) return;
  finished = true;
  clearInterval(timerId);
  timerId = null;
  remaining = 0;
  timerEl.textContent = "0";
  inputEl.blur();

  const { wpm, accuracy, correctChars } = calcStats();
  const errorCount = [...typed].filter((ch, i) => ch !== target[i]).length + errors;
  const timedOut = Date.now() - startTime >= duration * 1000;
  document.getElementById("results-title").textContent = timedOut ? "Time's up" : "Round complete";
  resultWpmEl.textContent = String(wpm);
  resultAccuracyEl.textContent = `${accuracy}%`;
  resultCharsEl.textContent = String(correctChars);
  resultErrorsEl.textContent = String(errorCount);

  const previousBest = loadBest();
  if (wpm > previousBest) {
    localStorage.setItem(BEST_KEY, String(wpm));
    bestEl.textContent = String(wpm);
    newBestEl.hidden = false;
  } else {
    newBestEl.hidden = true;
  }

  renderWords();
  resultsEl.classList.remove("hidden");
}

function reset() {
  clearInterval(timerId);
  timerId = null;
  started = false;
  finished = false;
  typed = "";
  errors = 0;
  remaining = duration;
  timerEl.textContent = String(duration);
  hintEl.textContent = "Click here or start typing to begin";
  resultsEl.classList.add("hidden");
  newBestEl.hidden = true;
  inputEl.value = "";
  pickText();
  renderWords();
  updateLiveStats();
  inputEl.focus();
}

function handleInput(event) {
  if (finished) return;
  const value = event.target.value.slice(0, target.length);
  if (!started && value.length > 0) {
    start();
  }

  if (value.length > typed.length) {
    for (let i = typed.length; i < value.length; i += 1) {
      if (value[i] !== target[i]) {
        errors += 1;
      }
    }
  }

  typed = value;
  inputEl.value = typed;
  renderWords();
  updateLiveStats();

  if (typed.length === target.length) {
    finish();
  }
}

document.getElementById("time-options").addEventListener("click", (event) => {
  const button = event.target.closest("[data-time]");
  if (!button) return;
  duration = Number(button.dataset.time);
  document.querySelectorAll("#time-options .pill").forEach((el) => el.classList.remove("active"));
  button.classList.add("active");
  reset();
});

document.getElementById("difficulty-options").addEventListener("click", (event) => {
  const button = event.target.closest("[data-difficulty]");
  if (!button) return;
  difficulty = button.dataset.difficulty;
  document.querySelectorAll("#difficulty-options .pill").forEach((el) => el.classList.remove("active"));
  button.classList.add("active");
  reset();
});

document.querySelector(".playfield").addEventListener("click", () => inputEl.focus());
document.getElementById("restart").addEventListener("click", reset);
document.getElementById("play-again").addEventListener("click", reset);
inputEl.addEventListener("input", handleInput);

document.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    reset();
  }
  if (!finished && event.key.length === 1) {
    inputEl.focus();
  }
});

loadBest();
reset();
