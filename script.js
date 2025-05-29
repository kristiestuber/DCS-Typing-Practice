let targetText = "";
let currentIndex = 0;
let startTime = null;
let totalKeystrokes = 0;
let correctKeystrokes = 0;

const typingArea = document.getElementById("typing-area");
const keyboard = document.getElementById("keyboard");
const message = document.getElementById("message");
const feedback = document.getElementById("feedback");
const results = document.getElementById("results");
const audioToggle = document.getElementById("audio-toggle");
const successSound = document.getElementById("success-sound");
const errorSound = document.getElementById("error-sound");

const shiftedChars = {
  "!": "1", "@": "2", "#": "3", "$": "4", "%": "5", "^": "6", "&": "7",
  "*": "8", "(": "9", ")": "0", "_": "-", "+": "=", ":": ";", "\"": "'",
  "<": ",", ">": ".", "?": "/", "|": "\\"
};

const spokenChars = {
  "!": "exclamation mark", "?": "question mark", ".": "period", ",": "comma",
  ":": "colon", ";": "semicolon", "\"": "quotation mark", "'": "apostrophe",
  "-": "dash", "_": "underscore", "(": "left parenthesis", ")": "right parenthesis",
  "&": "ampersand", "#": "hashtag", "*": "asterisk", "+": "plus", "=": "equals",
  "/": "slash", "\\": "backslash"
};

const colorMap = {
  lightblue: [
    "`", "tab", "caps lock", "shift", "control", "option",
    "p", ";", "/", "delete", "\\", "return", "'", "shift", "option"
  ],
  yellow: [
    "2", "w", "s", "x", "command", "9", "o", "l", ".", "command"
  ],
  pink: ["3", "e", "d", "c", "8", "i", "k", ","],
  orange: ["4", "5", "r", "t", "f", "g", "v", "b"],
  green: ["6", "7", "y", "u", "h", "j", "n", "m"],
  gray: [" "]
};

function getKeyColor(key) {
  key = key.toLowerCase();
  for (const [color, keys] of Object.entries(colorMap)) {
    if (keys.includes(key)) return color;
  }
  return "";
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
    ["ctrl", "option", "command", " ", "command", "option"]
  ];
  keyboard.innerHTML = "";
  layout.forEach(row => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "row";
    row.forEach(key => {
      const keyDiv = document.createElement("div");
      const displayKey = key === " " ? "Space" : (lowercase ? key : key.toUpperCase());
      keyDiv.textContent = displayKey;

      const safeKey = key === " " ? "space" : key.length === 1 && /[^a-z0-9]/i.test(key)
        ? `char${key.charCodeAt(0)}`
        : key.toLowerCase();

keyDiv.className = `key ${getKeyColor(key)}`;
      keyDiv.id = `key-${safeKey}`;
      if (key === " ") keyDiv.classList.add("spacebar");
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

  const safeKey = baseKey === " " ? "space" : /[^a-z0-9]/i.test(baseKey)
    ? `char${baseKey.charCodeAt(0)}`
    : baseKey.toLowerCase();

  const key = document.getElementById(`key-${safeKey}`);
  if (key) key.classList.add("highlight");
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
  speak(char);
}

document.addEventListener("keydown", e => {
  if (typingArea.disabled) return;
  const ignoredKeys = ["Shift", "CapsLock", "Control", "Alt", "Meta", "Delete"];
  if (ignoredKeys.includes(e.key)) return;
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
      const elapsed = (new Date() - startTime) / 60000;
      const wpm = Math.round((targetText.length / 5) / elapsed);
      const acc = Math.round((correctKeystrokes / totalKeystrokes) * 100);
      message.textContent = "Great job!";
      results.innerHTML = `WPM: ${wpm}<br>Accuracy: ${acc}%<br><button onclick="window.print()">Print Summary</button>`;
      try { successSound.play(); } catch {}
      confetti();
    } else {
      promptNext();
    }
  } else {
    feedback.textContent = "Try again!";
    try { errorSound.play(); } catch {}
  }
});

function initApp() {
  document.getElementById("start-button").style.display = "none";
  document.getElementById("app").style.display = "block";
  document.getElementById("intro-text").style.display = "none";
  createKeyboard();
}
