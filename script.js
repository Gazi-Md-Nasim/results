// Add the deployed Apps Script /exec URL here when the Sheet is ready.
const API_URL = "https://script.google.com/macros/s/AKfycbypm91jY0zjxoaaVWcr6n2-1nw4mgq86fWq_6nubC2EsCEvr6yak1IfVQuBbWfzdEqVPA/exec";

const demoResults = {
  "STU-1001": [
    { name: "Rahman", section: "A", courseCode: "CSE-101", semester: "Fall 2025", marksOf: "Final Exam", result: "A" },
    { name: "Rahman", section: "A", courseCode: "MAT-110", semester: "Fall 2025", marksOf: "Final Exam", result: "A+" }
  ],
  "STU-2048": [
    { name: "Noah", section: "B", courseCode: "ENG-120", semester: "Fall 2025", marksOf: "Final Exam", result: "B+" }
  ]
};

const form = document.querySelector("#lookup-form");
const input = document.querySelector("#student-id");
const message = document.querySelector("#form-message");
const resultSection = document.querySelector("#result-section");
const newSearch = document.querySelector("#new-search");

function setMessage(text, isSuccess = false) {
  message.textContent = text;
  message.classList.toggle("success", isSuccess);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showResult(result) {
  document.querySelector("#student-name").textContent = result[0].name;
  document.querySelector("#student-id-value").textContent = input.value.trim().toUpperCase();
  document.querySelector("#result-count").textContent = `${result.length} record${result.length === 1 ? "" : "s"}`;
  document.querySelector("#marks-body").innerHTML = result.map(record => `
    <tr><td>${escapeHtml(record.name)}</td><td>${escapeHtml(record.section)}</td><td>${escapeHtml(record.courseCode)}</td><td>${escapeHtml(record.semester)}</td><td>${escapeHtml(record.marksOf)}</td><td>${escapeHtml(record.result)}</td></tr>
  `).join("");
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function requestResult(studentId) {
  if (!API_URL) {
    return Promise.resolve(demoResults[studentId] || null);
  }

  return new Promise((resolve, reject) => {
    const callbackName = `resultCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("The result service took too long to respond. Check your connection and try again."));
    }, 30000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = payload => {
      cleanup();
      resolve(payload.found ? payload.results : null);
    };
    script.onerror = () => { cleanup(); reject(new Error("The result service is unavailable. Check the Apps Script deployment access.")); };
    script.src = `${API_URL}?id=${encodeURIComponent(studentId)}&callback=${callbackName}&_=${Date.now()}`;
    document.body.appendChild(script);
  });
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const studentId = input.value.trim().toUpperCase();
  resultSection.hidden = true;
  if (!studentId) {
    setMessage("Please enter your student ID.");
    input.focus();
    return;
  }

  setMessage("Checking your record...", true);
  const button = form.querySelector("button");
  button.disabled = true;
  try {
    const result = await requestResult(studentId);
    if (!result) {
      setMessage("No Record found. Contact your Teacher.");
      return;
    }
    setMessage("Record found.", true);
    showResult(result);
  } catch (error) {
    setMessage("The result service is unavailable. Please try again.");
  } finally {
    button.disabled = false;
  }
});

newSearch.addEventListener("click", () => {
  resultSection.hidden = true;
  setMessage("");
  input.value = "";
  input.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
