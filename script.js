// Add the deployed Apps Script /exec URL here when the Sheet is ready.
const API_URL = "https://script.google.com/macros/s/AKfycbzu_xfW5g23onYUc7UVLjk_aCDuGeUGE12JFGFZYt1pwK0hes-8O4VcHU3AZxjabkRg/exec";

const demoResults = {
  "STU-1001": [
    { name: "Rahman", section: "A", courseCode: "CSE-101", semester: "Fall 2025", caMarks: "24", midtermMarks: "22", finalExamMarks: "42", totalMarks: "88" },
    { name: "Rahman", section: "A", courseCode: "MAT-110", semester: "Fall 2025", caMarks: "25", midtermMarks: "23", finalExamMarks: "44", totalMarks: "92" }
  ],
  "STU-2048": [
    { name: "Noah", section: "B", courseCode: "ENG-120", semester: "Fall 2025", caMarks: "21", midtermMarks: "20", finalExamMarks: "38", totalMarks: "79" }
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
    <tr><td>${escapeHtml(record.courseCode)}</td><td>${escapeHtml(record.section)}</td><td>${escapeHtml(record.semester)}</td><td>${escapeHtml(record.caMarks)}</td><td>${escapeHtml(record.midtermMarks)}</td><td>${escapeHtml(record.finalExamMarks)}</td><td>${escapeHtml(record.totalMarks)}</td></tr>
  `).join("");
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function requestResult(studentId, attempt = 0) {
  if (!API_URL) {
    return Promise.resolve(demoResults[studentId] || null);
  }

  return new Promise((resolve, reject) => {
    const callbackName = `resultCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    script.async = true;
    script.referrerPolicy = "no-referrer";
    const timeout = window.setTimeout(() => {
      cleanup();
      if (attempt === 0) {
        requestResult(studentId, 1).then(resolve, reject);
        return;
      }
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
    script.onerror = () => {
      cleanup();
      if (attempt === 0) {
        requestResult(studentId, 1).then(resolve, reject);
        return;
      }
      reject(new Error("Chrome blocked the result service. Allow site data and third-party cookies or switch to incognito mode, then try again."));
    };
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
    setMessage(error.message || "The result service is unavailable. Please try again.");
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
