const questionBank = [
  {
    passageId: "P1",
    passageText:
      "Urban planners found that adding trees in dense neighborhoods reduced surface heat and improved walking rates.",
    questions: [
      {
        questionId: "P1Q1",
        type: "True, False, Can't Tell",
        questionText: "Tree planting increased neighborhood temperatures.",
        options: ["True", "False", "Can't Tell"],
        correctAnswer: "False",
        explanation: "The passage states tree planting reduced surface heat."
      },
      {
        questionId: "P1Q2",
        type: "True, False, Can't Tell",
        questionText: "Residents walked more after trees were added.",
        options: ["True", "False", "Can't Tell"],
        correctAnswer: "True",
        explanation: "The passage says walking rates improved."
      },
      {
        questionId: "P1Q3",
        type: "Mixed / Other",
        questionText: "Which effect is directly described in the passage?",
        options: [
          "Lower walking rates",
          "Reduced surface heat",
          "Higher property taxes",
          "Fewer buses"
        ],
        correctAnswer: "Reduced surface heat",
        explanation: "Only reduced surface heat is explicitly given."
      }
    ]
  },
  {
    passageId: "P2",
    passageText:
      "A hospital trial introduced text-message reminders and found fewer missed appointments over three months.",
    questions: [
      {
        questionId: "P2Q1",
        type: "True, False, Can't Tell",
        questionText: "The reminders were delivered by email.",
        options: ["True", "False", "Can't Tell"],
        correctAnswer: "False",
        explanation: "The passage specifies text-message reminders."
      },
      {
        questionId: "P2Q2",
        type: "Mixed / Other",
        questionText: "What outcome followed the reminder trial?",
        options: [
          "More missed appointments",
          "No change in attendance",
          "Fewer missed appointments",
          "Longer consultation times"
        ],
        correctAnswer: "Fewer missed appointments",
        explanation: "The passage explicitly says missed appointments decreased."
      }
    ]
  }
];

const orderedQuestions = questionBank.flatMap((passage) =>
  passage.questions.map((question) => ({
    ...question,
    passageId: passage.passageId,
    passageText: passage.passageText
  }))
);

const defaultStats = {
  totalQuestions: orderedQuestions.length,
  attempted: 0,
  correct: 0,
  totalTimeMs: 0,
  byType: {
    "True, False, Can't Tell": { attempted: 0, correct: 0, total: orderedQuestions.filter((q) => q.type === "True, False, Can't Tell").length, totalTimeMs: 0 },
    "Mixed / Other": { attempted: 0, correct: 0, total: orderedQuestions.filter((q) => q.type === "Mixed / Other").length, totalTimeMs: 0 }
  },
  sessions: []
};

function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem("ucat-vr-stats"));
    return saved ? { ...defaultStats, ...saved } : structuredClone(defaultStats);
  } catch {
    return structuredClone(defaultStats);
  }
}

function saveStats() {
  localStorage.setItem("ucat-vr-stats", JSON.stringify(state.stats));
}

const state = {
  view: "dashboard",
  stats: loadStats(),
  practice: { index: 0, answered: false, selected: null, startedAt: 0 },
  test: { index: 0, answers: {}, startTimes: {}, timings: {}, startAt: 0, durationSec: 300, intervalId: null }
};

const els = {
  dashboard: document.getElementById("dashboard-view"),
  practice: document.getElementById("practice-view"),
  test: document.getElementById("test-view"),
  statsTable: document.getElementById("stats-table"),
  startPractice: document.getElementById("start-practice"),
  startTest: document.getElementById("start-test"),
  practiceBack: document.getElementById("practice-back"),
  practicePassage: document.getElementById("practice-passage"),
  practiceQuestion: document.getElementById("practice-question"),
  practiceOptions: document.getElementById("practice-options"),
  practiceFeedback: document.getElementById("practice-feedback"),
  practiceExplanation: document.getElementById("practice-explanation"),
  practiceNext: document.getElementById("practice-next"),
  testPassage: document.getElementById("test-passage"),
  testQuestion: document.getElementById("test-question"),
  testOptions: document.getElementById("test-options"),
  testPrev: document.getElementById("test-prev"),
  testNext: document.getElementById("test-next"),
  testTimer: document.getElementById("test-timer"),
  endTest: document.getElementById("end-test")
};

let progressChart;

function setView(view) {
  state.view = view;
  ["dashboard", "practice", "test"].forEach((name) => {
    els[name].classList.toggle("active", name === view);
  });
  if (view === "dashboard") {
    renderDashboard();
  }
}

function proficiencyDots(score) {
  const filled = Math.max(0, Math.min(10, Math.round(score * 10)));
  return `<div class="dot-row">${Array.from({ length: 10 }, (_, i) => `<span class="dot ${i < filled ? "filled" : ""}"></span>`).join("")}</div>`;
}

function averageSeconds(attempted, totalMs) {
  return attempted ? `${(totalMs / attempted / 1000).toFixed(2)}s` : "0.00s";
}

function getRows() {
  const overallAccuracy = state.stats.attempted ? state.stats.correct / state.stats.attempted : 0;
  const tfct = state.stats.byType["True, False, Can't Tell"];
  const mixed = state.stats.byType["Mixed / Other"];
  return [
    {
      name: "Verbal Reasoning",
      score: overallAccuracy,
      attempted: `${state.stats.attempted} / ${state.stats.totalQuestions}`,
      correct: `${state.stats.correct} / ${state.stats.totalQuestions}`,
      timing: `${averageSeconds(state.stats.attempted, state.stats.totalTimeMs)} Target: 28.63s`
    },
    {
      name: "True, False, Can't Tell",
      score: tfct.attempted ? tfct.correct / tfct.attempted : 0,
      attempted: `${tfct.attempted} / ${tfct.total}`,
      correct: `${tfct.correct} / ${tfct.total}`,
      timing: `${averageSeconds(tfct.attempted, tfct.totalTimeMs)} Target: 28.63s`
    },
    {
      name: "Mixed / Other",
      score: mixed.attempted ? mixed.correct / mixed.attempted : 0,
      attempted: `${mixed.attempted} / ${mixed.total}`,
      correct: `${mixed.correct} / ${mixed.total}`,
      timing: `${averageSeconds(mixed.attempted, mixed.totalTimeMs)} Target: 28.63s`
    }
  ];
}

function renderDashboard() {
  const rows = getRows();
  els.statsTable.innerHTML = `
    <div class="stats-header">
      <span>Category</span>
      <span>Proficiency</span>
      <span>Attempted</span>
      <span>Correct</span>
      <span>Timing</span>
    </div>
    ${rows
      .map(
        (row) => `<div class="stats-row">
          <span>${row.name}</span>
          <span>${proficiencyDots(row.score)}</span>
          <span>${row.attempted}</span>
          <span>${row.correct}</span>
          <span>${row.timing}</span>
        </div>`
      )
      .join("")}
  `;
  renderChart();
}

function renderChart() {
  const labels = state.stats.sessions.slice(-8).map((s, i) => `Session ${i + 1}`);
  const accuracyData = state.stats.sessions.slice(-8).map((s) => s.accuracy);
  const speedData = state.stats.sessions.slice(-8).map((s) => s.avgSeconds);
  const ctx = document.getElementById("progress-chart");
  if (typeof Chart !== "function") {
    return;
  }
  if (progressChart) {
    progressChart.destroy();
  }
  progressChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Accuracy (%)", data: accuracyData, backgroundColor: "rgba(47,109,255,0.65)", yAxisID: "y" },
        { label: "Avg Time (s)", data: speedData, backgroundColor: "rgba(15,157,88,0.65)", yAxisID: "y1" }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 100 },
        y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false } }
      }
    }
  });
}

function applyPracticeAnswer(selected) {
  const q = orderedQuestions[state.practice.index];
  if (!q || state.practice.answered) {
    return;
  }
  state.practice.answered = true;
  const elapsed = Date.now() - state.practice.startedAt;
  state.stats.attempted += 1;
  state.stats.totalTimeMs += elapsed;
  const typeStats = state.stats.byType[q.type];
  typeStats.attempted += 1;
  typeStats.totalTimeMs += elapsed;
  const correct = selected === q.correctAnswer;
  if (correct) {
    state.stats.correct += 1;
    typeStats.correct += 1;
  }
  els.practiceFeedback.textContent = correct ? "Correct" : "Incorrect";
  els.practiceFeedback.className = `feedback ${correct ? "correct" : "incorrect"}`;
  els.practiceExplanation.textContent = q.explanation;
  els.practiceNext.disabled = false;
  saveStats();
}

function renderPracticeQuestion() {
  const q = orderedQuestions[state.practice.index];
  if (!q) {
    setView("dashboard");
    return;
  }
  state.practice.answered = false;
  state.practice.startedAt = Date.now();
  els.practiceNext.disabled = true;
  els.practiceFeedback.textContent = "";
  els.practiceFeedback.className = "feedback";
  els.practiceExplanation.textContent = "";
  els.practicePassage.innerHTML = `<h3>Passage ${q.passageId}</h3><p>${q.passageText}</p>`;
  els.practiceQuestion.innerHTML = `<h3>${q.questionText}</h3><p>Type: ${q.type}</p>`;
  els.practiceOptions.innerHTML = q.options
    .map((opt) => `<button class="option" data-option="${opt}">${opt}</button>`)
    .join("");
  [...els.practiceOptions.querySelectorAll("button")].forEach((btn) => {
    btn.addEventListener("click", () => applyPracticeAnswer(btn.dataset.option));
  });
}

function startPracticeMode() {
  state.practice.index = 0;
  setView("practice");
  renderPracticeQuestion();
}

function navigatePracticeNext() {
  if (!state.practice.answered) {
    return;
  }
  state.practice.index += 1;
  if (state.practice.index >= orderedQuestions.length) {
    state.stats.sessions.push({
      accuracy: state.stats.attempted ? Number(((state.stats.correct / state.stats.attempted) * 100).toFixed(1)) : 0,
      avgSeconds: state.stats.attempted ? Number((state.stats.totalTimeMs / state.stats.attempted / 1000).toFixed(2)) : 0
    });
    saveStats();
    setView("dashboard");
    return;
  }
  renderPracticeQuestion();
}

function renderTestQuestion() {
  const q = orderedQuestions[state.test.index];
  if (!q) {
    return;
  }
  if (!state.test.startTimes[q.questionId]) {
    state.test.startTimes[q.questionId] = Date.now();
  }
  els.testPassage.innerHTML = `<h3>Passage ${q.passageId}</h3><p>${q.passageText}</p>`;
  els.testQuestion.innerHTML = `<h3>${q.questionText}</h3><p>Type: ${q.type}</p>`;
  els.testOptions.innerHTML = q.options
    .map((opt) => {
      const selected = state.test.answers[q.questionId] === opt ? "selected" : "";
      return `<button class="option ${selected}" data-option="${opt}">${opt}</button>`;
    })
    .join("");
  [...els.testOptions.querySelectorAll("button")].forEach((btn) => {
    btn.addEventListener("click", () => {
      state.test.answers[q.questionId] = btn.dataset.option;
      renderTestQuestion();
    });
  });
  els.testPrev.disabled = state.test.index === 0;
  els.testNext.disabled = state.test.index === orderedQuestions.length - 1;
}

function recordTestTiming(currentQuestion) {
  const start = state.test.startTimes[currentQuestion.questionId];
  if (!start) {
    return;
  }
  const elapsed = Date.now() - start;
  state.test.timings[currentQuestion.questionId] = (state.test.timings[currentQuestion.questionId] || 0) + elapsed;
  state.test.startTimes[currentQuestion.questionId] = Date.now();
}

function startTestTimer() {
  if (state.test.intervalId) {
    clearInterval(state.test.intervalId);
  }
  state.test.intervalId = setInterval(() => {
    const elapsed = Math.floor((Date.now() - state.test.startAt) / 1000);
    const remaining = Math.max(state.test.durationSec - elapsed, 0);
    const min = String(Math.floor(remaining / 60)).padStart(2, "0");
    const sec = String(remaining % 60).padStart(2, "0");
    els.testTimer.textContent = `Time Remaining: ${min}:${sec}`;
    if (remaining <= 0) {
      endTestMode();
    }
  }, 250);
}

function startTestMode() {
  state.test = { index: 0, answers: {}, startTimes: {}, timings: {}, startAt: Date.now(), durationSec: 300, intervalId: null };
  setView("test");
  renderTestQuestion();
  startTestTimer();
}

function navigateTest(delta) {
  const current = orderedQuestions[state.test.index];
  recordTestTiming(current);
  state.test.index = Math.max(0, Math.min(orderedQuestions.length - 1, state.test.index + delta));
  renderTestQuestion();
}

function endTestMode() {
  clearInterval(state.test.intervalId);
  const current = orderedQuestions[state.test.index];
  if (current) {
    recordTestTiming(current);
  }
  let attemptedInSession = 0;
  let correctInSession = 0;
  let totalTime = 0;
  orderedQuestions.forEach((q) => {
    const answer = state.test.answers[q.questionId];
    const spent = state.test.timings[q.questionId] || 0;
    if (answer) {
      attemptedInSession += 1;
      state.stats.attempted += 1;
      state.stats.totalTimeMs += spent;
      totalTime += spent;
      const typeStats = state.stats.byType[q.type];
      typeStats.attempted += 1;
      typeStats.totalTimeMs += spent;
      if (answer === q.correctAnswer) {
        correctInSession += 1;
        state.stats.correct += 1;
        typeStats.correct += 1;
      }
    }
  });

  state.stats.sessions.push({
    accuracy: attemptedInSession ? Number(((correctInSession / attemptedInSession) * 100).toFixed(1)) : 0,
    avgSeconds: attemptedInSession ? Number((totalTime / attemptedInSession / 1000).toFixed(2)) : 0
  });
  saveStats();
  setView("dashboard");
}

els.startPractice.addEventListener("click", startPracticeMode);
els.startTest.addEventListener("click", startTestMode);
els.practiceBack.addEventListener("click", () => setView("dashboard"));
els.practiceNext.addEventListener("click", navigatePracticeNext);
els.testPrev.addEventListener("click", () => navigateTest(-1));
els.testNext.addEventListener("click", () => navigateTest(1));
els.endTest.addEventListener("click", endTestMode);

renderDashboard();
