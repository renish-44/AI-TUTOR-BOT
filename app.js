// Configuration: set BACKEND origin if different.
// If backend runs on same machine default is http://localhost:8080
const BACKEND = window.__BACKEND_ORIGIN__ || "http://localhost:8080";

// Chat UI
const chatWindow = document.getElementById("chatWindow");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const subjectEl = document.getElementById("subject");
const modeEl = document.getElementById("mode");
const progressCountEl = document.getElementById("progressCount");
const backendStatusEl = document.getElementById("backendStatus");

// Quiz UI
const genQuizBtn = document.getElementById("genQuizBtn");
const quizTopic = document.getElementById("quizTopic");
const quizDifficulty = document.getElementById("quizDifficulty");
const quizCount = document.getElementById("quizCount");
const quizList = document.getElementById("quizList");

// OCR UI
const imageInput = document.getElementById("imageInput");
const ocrStatus = document.getElementById("ocrStatus");
const ocrText = document.getElementById("ocrText");

// Helpers
function appendChat(role, text) {
  const el = document.createElement("div");
  el.className = role === "user" ? "chat-bubble user" : "chat-bubble assistant";
  el.style.marginBottom = "8px";
  el.textContent = text;
  if (role === "user") el.style.textAlign = "right";
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Simple progress tracker
function incrementProgress() {
  const v = Number(localStorage.getItem("progress_cnt") || "0") + 1;
  localStorage.setItem("progress_cnt", String(v));
  progressCountEl.textContent = String(v);
}
function refreshProgress() {
  progressCountEl.textContent = String(localStorage.getItem("progress_cnt") || "0");
}

// Check backend health
async function checkBackend() {
  try {
    const r = await fetch(`${BACKEND}/api/health`);
    const j = await r.json();
    backendStatusEl.textContent = j?.ok ? "OK" : "No";
  } catch (e) {
    backendStatusEl.textContent = "Down";
  }
}

// Send chat
async function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  appendChat("user", text);
  chatInput.value = "";
  incrementProgress();

  appendChat("assistant", "…thinking");
  try {
    const res = await fetch(`${BACKEND}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        subject: subjectEl.value,
        mode: modeEl.value
      })
    });
    const data = await res.json();
    // remove last 'thinking' bubble
    chatWindow.lastChild.remove();
    appendChat("assistant", data.reply || data?.error || "(no reply)");
  } catch (err) {
    chatWindow.lastChild.remove();
    appendChat("assistant", "Request failed. Is backend running?");
    console.error(err);
  }
}

// Generate quiz
async function generateQuiz() {
  quizList.innerHTML = "<li>Generating...</li>";
  try {
    const res = await fetch(`${BACKEND}/api/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: quizTopic.value || "DSA",
        difficulty: quizDifficulty.value || "easy",
        count: Number(quizCount.value) || 5
      })
    });
    const data = await res.json();
    quizList.innerHTML = "";
    const items = data.items || [];
    if (items.length === 0) {
      // fallback: show raw
      quizList.innerHTML = `<li><pre style="white-space:pre-wrap">${data.raw || "No items returned"}</pre></li>`;
      return;
    }
    items.forEach((q, idx) => {
      const li = document.createElement("li");
      const qhtml = document.createElement("div");
      qhtml.innerHTML = `<strong>${q.question}</strong>`;
      const ul = document.createElement("ul");
      for (const k of ["A","B","C","D"]) {
        const opt = document.createElement("li");
        const val = (q.options && (q.options[k] || q.options[k.toLowerCase()])) || "";
        opt.textContent = `${k}. ${val}`;
        ul.appendChild(opt);
      }
      li.appendChild(qhtml);
      li.appendChild(ul);
      if (q.answer || q.explanation) {
        const det = document.createElement("details");
        det.innerHTML = `<summary>Answer & explanation</summary><div>Correct: ${q.answer || "(?)"}</div><div>${q.explanation || ""}</div>`;
        li.appendChild(det);
      }
      quizList.appendChild(li);
    });
  } catch (err) {
    quizList.innerHTML = "<li>Quiz request failed</li>";
    console.error(err);
  }
}

// OCR handling using Tesseract.js (from CDN)
imageInput?.addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  ocrStatus.textContent = "Recognizing…";
  ocrText.value = "";
  try {
    const { data } = await Tesseract.recognize(f, 'eng', { logger: m => {
      ocrStatus.textContent = `Progress: ${Math.round((m.progress||0)*100)}% ${m.status||""}`;
    }});
    ocrText.value = data.text.trim();
    ocrStatus.textContent = "Done";
  } catch (err) {
    ocrStatus.textContent = "Failed";
    console.error(err);
  }
});

// Event wiring
sendBtn.addEventListener("click", sendChat);
chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat(); });
genQuizBtn.addEventListener("click", generateQuiz);

// init
refreshProgress();
checkBackend();
// 🔵 Grid Background Generation
const grid = document.getElementById("grid");
for (let i = 0; i < 400; i++) { // 20x20
  const square = document.createElement("div");
  square.classList.add("square");
  square.addEventListener("mouseenter", () => {
    square.classList.add("active");
    setTimeout(() => {
      square.classList.remove("active");
    }, 800);
  });
  grid.appendChild(square);
}

// 🟢 Your existing tutor bot logic (placeholder)
document.getElementById("sendBtn").addEventListener("click", () => {
  const input = document.getElementById("chatInput").value;
  if (input.trim() === "") return;
  const chatWindow = document.getElementById("chatWindow");
  const msg = document.createElement("div");
  msg.textContent = "You: " + input;
  chatWindow.appendChild(msg);
  document.getElementById("chatInput").value = "";
});
