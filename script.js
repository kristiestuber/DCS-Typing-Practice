// --- State ---
let targetText = "";
let currentIndex = 0;
let startTime = null;
let totalKeystrokes = 0;
let correctKeystrokes = 0;

// --- DOM ---
const typingArea  = document.getElementById("typing-area");
const keyboard    = document.getElementById("keyboard");
const message     = document.getElementById("message");
const feedback    = document.getElementById("feedback");
const results     = document.getElementById("results");
const audioToggle = document.getElementById("audio-toggle");
const applause    = document.getElementById("applause-sound");
const errorSound  = document.getElementById("error-sound");

// --- Maps ---
const shiftedChars = {
  "!": "1", "@": "2", "#": "3", "$": "4", "%": "5", "^": "6", "&": "7",
  "*": "8", "(": "9", ")": "0", "_": "-", "+": "=", "{": "[", "}": "]",
  "|": "\\", ":": ";", "\"": "'", "<": ",", ">": ".", "?": "/"
};

const spokenChars = {
  "!": "exclamation mark", "?": "question mark", ".": "period", ",": "comma",
  ":": "colon", ";": "semicolon", "\"": "quotation mark", "'": "apostrophe",
  "-": "dash", "_": "underscore", "(": "left parenthesis", ")": "right parenthesis",
  "&": "ampersand", "#": "hashtag", "*": "asterisk", "+": "plus", "=": "equals",
  "/": "slash", "\\": "backslash", " ": "space"
};

// We color keys by their final DOM id (key-<id>) to avoid label/ID mismatches.
function getKeyColor(keyId) {
  keyId = keyId.toLowerCase();
  const colorKeyIds = {
    lightblue: [
      "key-`", "key-1", "key-tab", "key-q", "key-caps lock", "key-a", "key-shift", "key-z",
      "key-control", "key-option", "key-0", "key--", "key-=", "key-p", "key-[", "key-]",
      "key-\\", "key-;", "key-'", "key-return", "key-/", "key-option" // option twice is fine
    ],
    yellow: [
      "key-2", "key-w", "key-s", "key-x", "key-command", "key-9", "key-o", "key-l", "key-."
    ],
    pink:   [ "key-3", "key-e", "key-d", "key-c", "key-8", "key-i", "key-k", "key-," ],
    orange: [ "key-4", "key-5", "key-r", "key-t", "key-f", "key-g", "key-v", "key-b" ],
    green:  [ "key-6", "key-7", "key-y", "key-u", "key-h", "key-j", "key-n", "key-m" ],
    gray:   [ "key-space" ]
  };
  for (const [color, ids] of Object.entries(colorKeyIds)) {
    if (ids.includes(keyId)) return color;
  }
  return "";
}

// Build a safe key id used in the DOM. Keep words as-is (lowercase), single punctuation as itself.
function toKeyId(label) {
  if (label === " ") return "key-space";
  // keep multi-word labels exactly, lowercase (e.g., "caps lock")
  if (/[a-z]/i.test(label) && label.length > 1) return `key-${label.toLowerCase()}`;
  // single character key: letters/numbers/punct
  return `key-${label}`;
}

function speak(char) {
  if (!audioToggle || !audioToggle.checked) return;
  if (/[A-Z]/.test(char)) {
    speechSynthesis.speak(new SpeechSynthesisUtterance("capital " + char));
  } else {
    const word = spokenChars[char] || char;
    speechSynthesis.speak(new SpeechSynthesisUtterance(word));
  }
}

function createKeyboard() {
  const lowercase = document.getElementById("case-toggle").checked;
  const layout = [
    ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "delete"],
    ["tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
    ["caps lock", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "return"],
    ["shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "shift"],
    ["control", "option", "command", " ", "command", "option"]
  ];

  keyboard.innerHTML = "";
  layout.forEach(row => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "row";
    row.forEach(keyLabel => {
      const keyDiv = document.createElement("div");
      const displayKey = keyLabel === " " ? "Space" : (lowercase ? keyLabel : keyLabel.toUpperCase());
      keyDiv.textContent = displayKey;

      const keyId = toKeyId(keyLabel);
      keyDiv.id = keyId;

      const colorClass = getKeyColor(keyId);
      keyDiv.className = `key ${colorClass}`;

      if (keyLabel === " ") keyDiv.classList.add("spacebar");
      rowDiv.appendChild(keyDiv);
    });
    keyboard.appendChild(rowDiv);
  });
}

function highlightKey(char) {
  document.querySelectorAll(".key").forEach(k => k.classList.remove("highlight"));
  let baseKey = char;
  let shiftNeeded = false;

  if (shiftedChars[char]) {
    baseKey = shiftedChars[char];
    shiftNeeded = true;
  } else if (/[A-Z]/.test(char)) {
    baseKey = char.toLowerCase();
    shiftNeeded = true;
  }

  const keyId = toKeyId(baseKey);
  const keyEl = document.getElementById(keyId);
  if (keyEl) keyEl.classList.add("highlight");

  if (shiftNeeded) {
    const shiftKey = document.getElementById("key-shift");
    if (shiftKey) shiftKey.classList.add("highlight");
  }
}

function startTyping() {
  targetText = document.getElementById("custom-text").value;
  if (!targetText) return;
  currentIndex = 0;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  startTime = new Date();
  message.textContent = "";
  feedback.textContent = "";
  results.textContent = "";
  typingArea.value = "";
  typingArea.disabled = false;
  typingArea.focus();
  createKeyboard();
  promptNext();
}

function promptNext() {
  if (currentIndex >= targetText.length) return;
  const char = targetText[currentIndex];
  highlightKey(char);
  speak(char === " " ? " " : char);
}

document.addEventListener("keydown", e => {
  if (typingArea.disabled) return;

  // Ignore modifier/management keys
  const ignored = ["Shift", "CapsLock", "Control", "Alt", "Meta", "Delete"];
  if (ignored.includes(e.key)) return;

  const expected = targetText[currentIndex];
  const key = e.key;

  totalKeystrokes++;
  if (key === expected) {
    correctKeystrokes++;
    feedback.textContent = "";
    typingArea.value += key;
    currentIndex++;

    if (currentIndex === targetText.length) {
      typingArea.disabled = true;
      const minutes = (new Date() - startTime) / 60000;
      const wpm = Math.max(1, Math.round((targetText.length / 5) / minutes));
      const acc = Math.round((correctKeystrokes / totalKeystrokes) * 100);
      message.textContent = "Great job!";
      results.innerHTML = `WPM: ${wpm}<br>Accuracy: ${acc}%<br><button onclick="window.print()">Print Summary</button>`;
      try { applause && applause.play(); } catch {}
      try { confetti && confetti(); } catch {}
    } else {
      promptNext();
    }
  } else {
    feedback.textContent = "Try again!";
    try { errorSound && errorSound.play(); } catch {}
  }
});

// Called by the Start button in index.html
function initApp() {
  const startBtn  = document.getElementById("start-button");
  const introText = document.getElementById("intro-text");
  const app       = document.getElementById("app");
  if (startBtn)  startBtn.style.display  = "none";
  if (introText) introText.style.display = "none";
  if (app)       app.style.display       = "block";
  createKeyboard();
}
