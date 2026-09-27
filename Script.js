/* =========================================================
   SMARTSTUDY AI — CORE APP LOGIC
   Works fully offline with a broad built-in knowledge base.
   If you add a real AI backend at /api/tutor (see README),
   it will automatically use that instead — see callSmartAI().
========================================================= */
 
/* ---------- PAGE NAVIGATION ---------- */
 
function showPage(pageName, button) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(pageName).classList.add("active");
 
    document.querySelectorAll(".menu-btn").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
 
    if (pageName === "dashboard") renderDashboard();
}
 
function toggleTheme() {
    document.body.classList.toggle("dark");
    localStorage.setItem("ss_theme", document.body.classList.contains("dark") ? "dark" : "light");
}
 
/* ---------- ACTIVITY TRACKING (localStorage) ----------
   Powers the dashboard: subjects touched, streak, quiz scores. */
 
function getActivity() {
    try {
        return JSON.parse(localStorage.getItem("ss_activity")) || { subjects: {}, streak: 0, lastActive: null };
    } catch (e) {
        return { subjects: {}, streak: 0, lastActive: null };
    }
}
 
function saveActivity(a) {
    localStorage.setItem("ss_activity", JSON.stringify(a));
}
 
function touchSubject(subject) {
    const a = getActivity();
    if (!a.subjects[subject]) a.subjects[subject] = { asked: 0, quizzes: 0, scoreSum: 0, scoreMax: 0 };
    a.subjects[subject].asked++;
    bumpStreak(a);
    saveActivity(a);
}
 
function recordQuiz(subject, score, max) {
    const a = getActivity();
    if (!a.subjects[subject]) a.subjects[subject] = { asked: 0, quizzes: 0, scoreSum: 0, scoreMax: 0 };
    a.subjects[subject].quizzes++;
    a.subjects[subject].scoreSum += score;
    a.subjects[subject].scoreMax += max;
    bumpStreak(a);
    saveActivity(a);
    renderDashboard();
}
 
function bumpStreak(a) {
    const today = new Date().toDateString();
    if (a.lastActive === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    a.streak = (a.lastActive === yesterday) ? a.streak + 1 : 1;
    a.lastActive = today;
}
 
/* ---------- DASHBOARD RENDERING ---------- */
 
function renderDashboard() {
    const a = getActivity();
    const subjects = Object.keys(a.subjects);
 
    document.getElementById("subjectCount").textContent = subjects.length;
    document.getElementById("streakCount").textContent = a.streak + (a.streak === 1 ? " Day" : " Days");
 
    let totalQuizzes = 0, totalScore = 0, totalMax = 0;
    subjects.forEach(s => {
        totalQuizzes += a.subjects[s].quizzes;
        totalScore += a.subjects[s].scoreSum;
        totalMax += a.subjects[s].scoreMax;
    });
    document.getElementById("quizCount").textContent = totalQuizzes;
    document.getElementById("progressPercent").textContent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) + "%" : "—";
 
    const list = document.getElementById("progressList");
    if (subjects.length === 0) {
        list.innerHTML = `<p style="color:#888">Nothing yet — ask the tutor a question or take a quiz to see progress here.</p>`;
        return;
    }
    list.innerHTML = subjects.map(s => {
        const d = a.subjects[s];
        const pct = d.scoreMax > 0 ? Math.round((d.scoreSum / d.scoreMax) * 100) : Math.min(100, d.asked * 10);
        return `
            <div class="progress">
                <div class="progress-title"><span>${s}</span><b>${pct}%</b></div>
                <div class="bar"><div style="width:${pct}%"></div></div>
            </div>`;
    }).join("");
}
 
/* ---------- NEW CHAT ---------- */
 
function newChat() {
    document.getElementById("chatMessages").innerHTML = `
        <div class="welcome">
            <div class="ai-logo">✦</div>
            <h1>How can I help you learn?</h1>
            <p>Ask about any subject — tech or non-tech.</p>
        </div>
        <div class="suggestions">
            <button onclick="askQuestion('Explain C++ pointers in simple language')">
                💡<div><b>Explain a concept</b><small>Explain C++ pointers</small></div>
            </button>
            <button onclick="askQuestion('Explain the French Revolution simply')">
                📖<div><b>Any subject</b><small>Explain the French Revolution</small></div>
            </button>
        </div>`;
}
 
/* ---------- CHAT ---------- */
 
function sendMessage() {
    const input = document.getElementById("messageInput");
    const message = input.value.trim();
    if (message === "") return;
 
    addMessage("user", message);
    input.value = "";
 
    const thinkingId = addMessage("ai", "Thinking…", true);
 
    callSmartAI(message, buildTutorPrompt(message)).then(answer => {
        updateMessage(thinkingId, answer);
    });
}
 
function askQuestion(question) {
    document.getElementById("messageInput").value = question;
    sendMessage();
}
 
function addMessage(type, text, returnId) {
    const chat = document.getElementById("chatMessages");
    const message = document.createElement("div");
    const id = "msg-" + Date.now() + Math.random().toString(36).slice(2, 6);
    message.id = id;
    message.className = "chat-message " + type;
    message.innerHTML = `<div class="bubble">${text}</div>`;
    chat.appendChild(message);
    window.scrollTo(0, document.body.scrollHeight);
    return id;
}
 
function updateMessage(id, text) {
    const el = document.getElementById(id);
    if (el) el.querySelector(".bubble").innerHTML = text;
}
 
function buildTutorPrompt(message) {
    return "You are a patient tutor for a student of any background — tech or non-tech. " +
        "Explain clearly in short paragraphs with a simple example. Question: " + message;
}
 
/* =========================================================
   SMART AI LAYER
   Tries a real backend first (POST /api/tutor -> {answer}).
   If that route doesn't exist yet (this static site has none
   out of the box), it falls back to the built-in knowledge base
   below so the app is never broken — see README for adding a
   real backend.
========================================================= */
 
async function callSmartAI(rawMessage, prompt) {
    try {
        const res = await fetch("/api/tutor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.answer) {
                trackSubjectFromText(rawMessage);
                return data.answer;
            }
        }
    } catch (e) {
        /* no backend configured yet — fall through to local knowledge */
    }
    return getLocalAnswer(rawMessage);
}
 
function trackSubjectFromText(text) {
    const t = text.toLowerCase();
    let subject = "General";
    if (/pointer|loop|array|c\+\+|dsa|algorithm/.test(t)) subject = "C++ / DSA";
    else if (/html|css|javascript|react|web/.test(t)) subject = "Web Development";
    else if (/ai|ml|machine learning|neural/.test(t)) subject = "AI / ML";
    else if (/history|revolution|war|empire/.test(t)) subject = "History";
    else if (/physics|chemistry|biology|science/.test(t)) subject = "Science";
    else if (/account|finance|business|commerce|economics/.test(t)) subject = "Commerce";
    else if (/math|equation|algebra|geometry/.test(t)) subject = "Math";
    touchSubject(subject);
}
 
/* ---------- LOCAL KNOWLEDGE BASE (fallback, works offline) ---------- */
 
function getLocalAnswer(message) {
    const t = message.toLowerCase();
    trackSubjectFromText(message);
 
    if (t.includes("pointer")) return topicPointer();
    if (t.includes("loop")) return topicLoop();
    if (t.includes("html") && t.includes("css")) return topicHtmlCss();
    if (t.includes("react")) return topicReact();
    if (t.includes("revolution") || t.includes("history")) return topicHistory();
    if (t.includes("photosynthesis") || t.includes("biology")) return topicBiology();
    if (t.includes("physics") || t.includes("newton")) return topicPhysics();
    if (t.includes("account") || t.includes("commerce") || t.includes("finance")) return topicCommerce();
    if (t.includes("study plan")) return topicStudyPlan();
    if (t.includes("quiz")) return `Head to <b>Quiz Generator</b> in the sidebar — pick any subject, tech or non-tech, and generate one instantly.`;
    if (t.includes("career") || t.includes("learn next")) return topicCareer();
 
    return `
        Good question! I don't have a ready-made explanation for that exact phrase yet,
        but I can help if you make it a bit more specific.
        <br><br>
        Try things like:
        <br>• "Explain arrays in C++"
        <br>• "What caused World War 1?"
        <br>• "How does supply and demand work?"
        <br>• "Explain photosynthesis"
        <br><br>
        Or open <b>Problem Solving</b> in the sidebar and paste an exact question or problem —
        that mode walks through it step by step.`;
}
 
function topicPointer() {
    return `<b>What is a pointer (C++)?</b><br><br>
        A pointer is a variable that stores the <b>memory address</b> of another variable,
        instead of storing a value directly.<br><br>
        <code>int x = 10;<br>int *p = &x;</code><br><br>
        <b>&x</b> → address of x<br><b>p</b> → stores that address<br><b>*p</b> → gives you x's value back (10)`;
}
function topicLoop() {
    return `<b>Loops in C++</b><br><br>
        A loop repeats a block of code without rewriting it.<br><br>
        1. <b>for</b> — when you know how many times to repeat<br>
        2. <b>while</b> — repeats while a condition is true<br>
        3. <b>do-while</b> — runs at least once, then checks the condition<br><br>
        <code>for(int i = 1; i <= 5; i++) { cout << i; }</code>`;
}
function topicHtmlCss() {
    return `HTML builds the <b>structure</b> of a page (headings, text, buttons).<br><br>
        CSS controls the <b>look</b> — color, spacing, layout.<br><br>
        Example: HTML says "this is a heading"; CSS says "make it blue and centered."<br><br>
        After HTML + CSS, most people learn <b>JavaScript</b> next to make pages interactive.`;
}
function topicReact() {
    return `<b>React</b> is a JavaScript library for building interfaces out of reusable
        <b>components</b> — small pieces of UI (a button, a card, a form) that manage their own data
        and re-render automatically when that data changes. It's usually learned after
        core HTML, CSS, and JavaScript.`;
}
function topicHistory() {
    return `<b>The French Revolution (1789–1799), simply:</b><br><br>
        France was deeply in debt, ordinary people faced high taxes and food shortages,
        while the king and nobles lived well. Anger built up until people stormed the
        Bastille prison (a symbol of royal power) in 1789.<br><br>
        This led to the end of the monarchy, the rise of ideas like "liberty, equality,
        fraternity," and eventually paved the way for Napoleon's rise to power.`;
}
function topicBiology() {
    return `<b>Photosynthesis, simply:</b><br><br>
        Plants take in <b>sunlight, water, and carbon dioxide</b>, and convert them into
        <b>glucose (food/energy)</b> and <b>oxygen</b> — which they release into the air.<br><br>
        <code>6CO2 + 6H2O + light → C6H12O6 + 6O2</code><br><br>
        It happens mainly in the leaves, inside structures called chloroplasts.`;
}
function topicPhysics() {
    return `<b>Newton's Second Law:</b><br><br>
        Force = Mass × Acceleration (<code>F = ma</code>).<br><br>
        In plain terms: the heavier an object, the more force you need to speed it up
        by the same amount. Push the same force on a bicycle vs. a truck — the bicycle
        accelerates much faster because it's lighter.`;
}
function topicCommerce() {
    return `<b>Basics of accounting/finance:</b><br><br>
        Every business tracks three things: what it <b>owns</b> (assets), what it <b>owes</b>
        (liabilities), and what's left over for the owner (equity).<br><br>
        <code>Assets = Liabilities + Equity</code><br><br>
        Profit is simply: <code>Revenue − Expenses</code>. Everything in basic accounting
        builds on these two ideas.`;
}
function topicStudyPlan() {
    return `<b>Simple daily study plan:</b><br><br>
        📚 1 hour → your toughest subject first (when your mind is freshest)<br>
        💻 1 hour → practice problems, not just reading<br>
        📖 30 min → a subject you enjoy less (little and often beats cramming)<br>
        🔁 30 min → revise yesterday's topic<br><br>
        Open <b>Study Planner</b> in the sidebar to generate one tailored to your subjects.`;
}
function topicCareer() {
    return `Open <b>Career Guide</b> in the sidebar and tell it your background —
        tech, commerce, arts, or science — plus your skills and interests, and it'll
        suggest a concrete next-step roadmap for you, not just for programmers.`;
}
 
/* =========================================================
   PROBLEM SOLVING
========================================================= */
 
async function solveProblem() {
    const problem = document.getElementById("solveInput").value.trim();
    const box = document.getElementById("solveBox");
    if (!problem) return;
 
    box.innerHTML = `<div class="output">Working through it…</div>`;
    const prompt = "Solve this step by step, numbering each step and explaining the reasoning, " +
        "then give a one-line final answer. Problem: " + problem;
 
    const answer = await callSmartAI(problem, prompt);
    box.innerHTML = `<div class="output"><h2>🧩 Step-by-step</h2><br>${answer}
        <br><br><i>Tip: for word problems, break it into "what am I given" → "what am I finding" →
        "which formula connects them" — that's usually 80% of the work.</i></div>`;
}
 
/* =========================================================
   QUIZ GENERATOR — now with real question banks per subject
========================================================= */
 
const QUIZ_BANK = {
    "C++": [
        { q: "What does 'int' declare?", options: ["A text value", "A whole number", "A decimal", "A loop"], correct: 1 },
        { q: "Which loop always runs at least once?", options: ["for", "while", "do-while", "if"], correct: 2 }
    ],
    "HTML": [
        { q: "Which tag creates a hyperlink?", options: ["<link>", "<a>", "<href>", "<url>"], correct: 1 },
        { q: "Which tag is used for the largest heading?", options: ["<h6>", "<head>", "<h1>", "<title>"], correct: 2 }
    ],
    "CSS": [
        { q: "Which property changes text color?", options: ["font-color", "text-color", "color", "background"], correct: 2 },
        { q: "Which unit is relative to the root font size?", options: ["px", "rem", "cm", "pt"], correct: 1 }
    ],
    "JavaScript": [
        { q: "Which keyword declares a constant?", options: ["var", "let", "const", "static"], correct: 2 },
        { q: "What does '===' check?", options: ["Value only", "Type only", "Value and type", "Nothing"], correct: 2 }
    ],
    "AI / ML": [
        { q: "What is 'training data' used for?", options: ["Styling a UI", "Teaching a model patterns", "Storing passwords", "Compiling code"], correct: 1 },
        { q: "Which term means a model gives wrong confident answers?", options: ["Overfitting", "Hallucination", "Compilation", "Indexing"], correct: 1 }
    ],
    "General Science": [
        { q: "What gas do plants release during photosynthesis?", options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"], correct: 1 },
        { q: "What is the boiling point of water at sea level (°C)?", options: ["50", "90", "100", "120"], correct: 2 }
    ],
    "History": [
        { q: "The French Revolution began in which year?", options: ["1689", "1789", "1889", "1901"], correct: 1 },
        { q: "Who was the first President of the United States?", options: ["Lincoln", "Jefferson", "Washington", "Adams"], correct: 2 }
    ],
    "Commerce": [
        { q: "Assets = Liabilities + ?", options: ["Revenue", "Equity", "Expense", "Tax"], correct: 1 },
        { q: "Profit is calculated as?", options: ["Revenue + Expenses", "Revenue − Expenses", "Assets − Liabilities", "Equity × Tax"], correct: 1 }
    ],
    "General Knowledge": [
        { q: "How many continents are there?", options: ["5", "6", "7", "8"], correct: 2 },
        { q: "What is the currency of Japan?", options: ["Won", "Yen", "Yuan", "Ringgit"], correct: 1 }
    ]
};
 
function generateQuiz() {
    const subject = document.getElementById("quizSubject").value;
    const topic = document.getElementById("quizTopic").value;
    const quizBox = document.getElementById("quizBox");
    const questions = QUIZ_BANK[subject] || QUIZ_BANK["General Knowledge"];
 
    quizBox.innerHTML = `
        <div class="output">
            <h2>${subject} Quiz</h2>
            <p>Topic: ${topic || "Basics"}</p>
            ${questions.map((item, i) => `
                <div class="question">
                    <h3>${i + 1}. ${item.q}</h3>
                    ${item.options.map((opt, j) => `
                        <label class="option">
                            <input type="radio" name="q${i}" value="${j === item.correct ? 'correct' : 'wrong'}">
                            ${opt}
                        </label>`).join("")}
                </div>`).join("")}
            <button class="primary-btn" onclick="checkQuiz('${subject}', ${questions.length})">Check Score</button>
            <p id="score" style="margin-top:15px"></p>
        </div>`;
}
 
function checkQuiz(subject, total) {
    let score = 0;
    document.querySelectorAll('input[value="correct"]').forEach(a => { if (a.checked) score++; });
    document.getElementById("score").innerHTML = `<b>Your Score: ${score} / ${total}</b>`;
    recordQuiz(subject, score, total);
}
 
/* =========================================================
   STUDY PLANNER
========================================================= */
 
function generatePlan() {
    const subjects = document.getElementById("subjects").value || "your subjects";
    const hours = document.getElementById("hours").value;
    const goal = document.getElementById("goal").value || "improve your skills";
    const box = document.getElementById("planBox");
 
    box.innerHTML = `
        <div class="output">
            <h2>📅 Your Study Plan</h2><br>
            <b>Subjects:</b> ${subjects}<br><br>
            <b>Daily Time:</b> ${hours} hours<br><br>
            <b>Goal:</b> ${goal}<br><br>
            <b>Day 1</b><br>Learn basic concepts<br><br>
            <b>Day 2</b><br>Practice questions<br><br>
            <b>Day 3</b><br>Continue new topics<br><br>
            <b>Day 4</b><br>Practice + revision<br><br>
            <b>Day 5</b><br>Solve problems<br><br>
            <b>Day 6</b><br>Project / mock test practice<br><br>
            <b>Day 7</b><br>Full revision + self-test
        </div>`;
}
 
/* =========================================================
   CAREER GUIDE — now branches by background, not just tech
========================================================= */
 
const CAREER_PATHS = {
    tech: ["JavaScript", "Git & GitHub", "Data Structures & Algorithms", "React", "Backend basics (Node/Django)", "System design fundamentals"],
    commerce: ["Excel & financial modeling", "Basic accounting (Tally/QuickBooks)", "Digital marketing basics", "Business communication", "Introductory data analysis (Excel/SQL)"],
    arts: ["Strong writing & research skills", "Public speaking / communication", "Basic design tools (Canva/Figma)", "Social media & content strategy", "A portfolio of writing or projects"],
    science: ["Lab technique & data recording", "Statistics fundamentals", "Scientific writing", "A specialization (bio/chem/physics track)", "Research internships"]
};
 
function careerGuide() {
    const background = document.getElementById("background").value;
    const skills = document.getElementById("skills").value || "just getting started";
    const interest = document.getElementById("interest").value || "still exploring";
    const box = document.getElementById("careerBox");
    const path = CAREER_PATHS[background] || CAREER_PATHS.tech;
 
    box.innerHTML = `
        <div class="output">
            <h2>🎯 Your Learning Roadmap</h2><br>
            <b>Background:</b> ${background}<br><br>
            <b>Your Skills:</b> ${skills}<br><br>
            <b>Your Interest:</b> ${interest}<br><br>
            <b>Recommended Next Steps:</b><br><br>
            ${path.map((step, i) => `${i + 1}️⃣ ${step}`).join("<br><br>")}
        </div>`;
}
 
/* ---------- INIT ---------- */
 
window.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("ss_theme") === "dark") document.body.classList.add("dark");
    initCgpaCalculator();
    initTimetable();
    updateExamCountdown();
});
 
/* =========================================================
   CGPA CALCULATOR
   Standard 10-point grade scale — edit GRADE_POINTS below if
   your college uses a different scale.
========================================================= */
 
const GRADE_POINTS = { "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "F": 0 };
 
function initCgpaCalculator() {
    const rows = document.getElementById("cgpaRows");
    if (!rows) return;
    rows.innerHTML = "";
    addCgpaRow();
    addCgpaRow();
}
 
function addCgpaRow() {
    const rows = document.getElementById("cgpaRows");
    const row = document.createElement("div");
    row.className = "cgpa-row";
    row.innerHTML = `
        <input type="text" placeholder="Subject name" class="cgpa-subject">
        <input type="number" placeholder="Credits" min="0" class="cgpa-credits">
        <select class="cgpa-grade">
            ${Object.keys(GRADE_POINTS).map(g => `<option>${g}</option>`).join("")}
        </select>
        <button class="remove-btn" onclick="this.parentElement.remove()">✕</button>`;
    rows.appendChild(row);
}
 
function calculateCGPA() {
    const rows = document.querySelectorAll(".cgpa-row");
    let totalCredits = 0, totalPoints = 0;
 
    rows.forEach(row => {
        const credits = parseFloat(row.querySelector(".cgpa-credits").value) || 0;
        const grade = row.querySelector(".cgpa-grade").value;
        totalCredits += credits;
        totalPoints += credits * (GRADE_POINTS[grade] ?? 0);
    });
 
    const result = document.getElementById("cgpaResult");
    if (totalCredits === 0) {
        result.innerHTML = `<div class="output">Enter at least one subject's credits to calculate.</div>`;
        return;
    }
    const cgpa = (totalPoints / totalCredits).toFixed(2);
    result.innerHTML = `<div class="output"><h2>Your CGPA: ${cgpa}</h2><p>Based on ${rows.length} subject(s), ${totalCredits} total credits.</p></div>`;
}
 
/* =========================================================
   TIMETABLE + EXAM COUNTDOWN
   Saved to localStorage (per device) for now — will move to
   Supabase once accounts are added, so it follows you anywhere.
========================================================= */
 
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOTS = ["9-10", "10-11", "11-12", "12-1", "2-3", "3-4"];
 
function initTimetable() {
    const grid = document.getElementById("timetableGrid");
    if (!grid) return;
 
    const saved = JSON.parse(localStorage.getItem("ss_timetable") || "{}");
 
    let html = `<div class="tt-row tt-header"><div></div>${DAYS.map(d => `<div>${d}</div>`).join("")}</div>`;
    SLOTS.forEach(slot => {
        html += `<div class="tt-row"><div class="tt-slot">${slot}</div>`;
        DAYS.forEach(day => {
            const key = day + "_" + slot;
            const value = saved[key] || "";
            html += `<input class="tt-cell" data-key="${key}" value="${value}" placeholder="—">`;
        });
        html += `</div>`;
    });
    grid.innerHTML = html;
 
    const examData = JSON.parse(localStorage.getItem("ss_exam") || "null");
    if (examData) {
        document.getElementById("examName").value = examData.name;
        document.getElementById("examDate").value = examData.date;
    }
}
 
function saveTimetable() {
    const data = {};
    document.querySelectorAll(".tt-cell").forEach(cell => {
        if (cell.value.trim()) data[cell.dataset.key] = cell.value.trim();
    });
    localStorage.setItem("ss_timetable", JSON.stringify(data));
    alert("Timetable saved!");
}
 
function saveExam() {
    const name = document.getElementById("examName").value.trim();
    const date = document.getElementById("examDate").value;
    if (!name || !date) { alert("Enter both exam name and date."); return; }
    localStorage.setItem("ss_exam", JSON.stringify({ name, date }));
    updateExamCountdown();
}
 
function updateExamCountdown() {
    const el = document.getElementById("examCountdown");
    if (!el) return;
    const examData = JSON.parse(localStorage.getItem("ss_exam") || "null");
    if (!examData) { el.textContent = ""; return; }
 
    const days = Math.ceil((new Date(examData.date) - new Date()) / 86400000);
    el.textContent = days > 0
        ? `⏳ ${examData.name}: ${days} day${days === 1 ? "" : "s"} left`
        : days === 0
            ? `📌 ${examData.name} is today!`
            : `${examData.name} has passed.`;
}
 