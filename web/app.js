// message formats live in backend/events.py

const REACTIONS = ["laugh", "cheer", "boo", "ooh"];
const HISTORY_SIZE = 3;
const JUMP = 0.1; // a winning bar rising this much in one update highlights the words that caused it

const statusText = document.querySelector("#status");
const current = document.querySelector("#current");
const pastLines = document.querySelector("#history");
const popup = document.querySelector("#reaction");
const latency = document.querySelector("#latency");
const muteButton = document.querySelector("#mute");
const modeButtons = document.querySelectorAll("[data-mode]");
const tabs = document.querySelectorAll(".tab");

let socket;
let connected = false;
let listening = false;
let muted = false;
let lastScores = null;
let scoredWords = 0;
let lineReaction = null;
let speakingTimer;
let popupTimer;

function connect() {
  socket = new WebSocket(`ws://${location.host || "localhost:8000"}/ws`);
  socket.onopen = () => {
    connected = true;
    lastScores = null;
    showConnection();
  };
  socket.onclose = () => {
    connected = false;
    showConnection();
    setTimeout(connect, 1000); // the backend restarts often, so keep trying
  };
  socket.onmessage = (msg) => {
    const event = JSON.parse(msg.data);
    console.log(event);

    switch (event.type) {
      case "transcript":
        showTranscript(event);
        break;
      case "scores":
        showScores(event);
        break;
      case "reaction":
        showReaction(event);
        break;
      case "status":
        showStatus(event);
        break;
    }
  };
}

function showTranscript(event) {
  setWords(event.text);
  if (event.final) {
    finishLine();
    return;
  }
  pulseVoice(event.speaker || "");
  document.body.classList.add("speaking");
  clearTimeout(speakingTimer);
  speakingTimer = setTimeout(() => document.body.classList.remove("speaking"), 700);
}

function setWords(text) {
  // keep the words already on screen, so only new ones animate in
  const words = text.split(" ").filter(Boolean);
  const spans = current.children;
  words.forEach((word, i) => {
    if (!spans[i]) {
      const span = document.createElement("span");
      span.textContent = word;
      current.append(span);
    } else if (spans[i].textContent !== word) {
      spans[i].textContent = word;
      spans[i].className = "";
    }
  });
  while (spans.length > words.length) spans[spans.length - 1].remove();
}

function finishLine() {
  clearTimeout(speakingTimer);
  document.body.classList.remove("speaking");
  if (current.children.length) {
    const line = document.createElement("li");
    line.append(...current.children);
    if (lineReaction) line.append(reactionTag(lineReaction));
    pastLines.append(line);
    if (pastLines.children.length > HISTORY_SIZE) pastLines.firstElementChild.remove();
  }
  lineReaction = null;
  scoredWords = 0;
}

function reactionTag(event) {
  const tag = document.createElement("em");
  tag.className = `tag ${event.reaction}`;
  tag.textContent = event.size ? `${event.reaction} ${event.size}` : event.reaction;
  return tag;
}

function showScores(scores) {
  const top = highest(scores);
  for (const name of REACTIONS) {
    document.body.style.setProperty(`--${name}`, scores[name]);
    const bar = document.querySelector(`.bar.${name}`);
    bar.querySelector(".value").textContent = Math.round(scores[name] * 100);
    bar.classList.toggle("hot", name === top && scores[name] > scores.none);
  }
  document.body.style.setProperty("--none", scores.none);
  const quiet = document.querySelector(".bar.none");
  quiet.querySelector(".value").textContent = Math.round(scores.none * 100);
  quiet.classList.toggle("hot", scores.none >= scores[top]);
  markWords(scores);
  lastScores = scores;
}

function markWords(scores) {
  // the words that arrived since the last scores are what moved the bars
  if (lastScores) {
    const rises = {};
    for (const name of REACTIONS) rises[name] = scores[name] - lastScores[name];
    const top = highest(rises);
    if (rises[top] >= JUMP && scores[top] > scores.none) {
      for (let i = scoredWords; i < current.children.length; i++) {
        current.children[i].classList.add("mark", top);
      }
    }
  }
  scoredWords = current.children.length;
}

function highest(values) {
  let best = REACTIONS[0];
  for (const name of REACTIONS) {
    if (values[name] > values[best]) best = name;
  }
  return best;
}

function showReaction(event) {
  const time = event.latency_ms == null ? "" : `${Math.round(event.latency_ms)} ms`;
  lineReaction = event;
  popup.querySelector(".word").textContent = event.reaction;
  popup.querySelector(".size").textContent = event.size || "";
  popup.querySelector(".time").textContent = time;
  if (time) latency.textContent = time;

  // removing the attribute and adding it back restarts the animations
  delete document.body.dataset.reaction;
  void document.body.offsetWidth;
  document.body.dataset.reaction = event.reaction;
  clearTimeout(popupTimer);
  popupTimer = setTimeout(() => delete document.body.dataset.reaction, 2000);
}

function showStatus(event) {
  listening = event.listening;
  muted = event.muted;
  muteButton.classList.toggle("on", muted);
  muteButton.querySelector("span").textContent = muted ? "Muted" : "Mute";
  modeButtons.forEach((button) => button.classList.toggle("on", button.dataset.mode === event.mode));
  showConnection();
}

function showConnection() {
  statusText.textContent = !connected ? "Reconnecting" : listening ? "Listening" : "Not listening";
  document.body.classList.toggle("offline", !connected);
  document.body.classList.toggle("listening", connected && listening);
}

function send(message) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function setMode(mode) {
  send({ type: "set_mode", mode });
}

function setMuted(muted) {
  send({ type: "mute", muted });
}

function showView(name) {
  if (document.body.dataset.view === name) return;
  document.documentElement.dataset.direction = name === "upload" ? "forward" : "back";
  const change = () => {
    document.body.dataset.view = name;
    tabs.forEach((tab) => tab.setAttribute("aria-current", tab.dataset.view === name ? "page" : "false"));
  };
  // browsers without view transitions just switch instantly
  if (document.startViewTransition) document.startViewTransition(change);
  else change();
}

function toggleTheme() {
  const dark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", dark ? "dark" : "light");
}

modeButtons.forEach((button) => (button.onclick = () => setMode(button.dataset.mode)));
muteButton.onclick = () => setMuted(!muted);
document.querySelector("#theme").onclick = toggleTheme;
tabs.forEach((tab) => (tab.onclick = () => showView(tab.dataset.view)));
document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "m") setMuted(!muted);
  if (e.key === "t") toggleTheme();
});

if (localStorage.getItem("theme") === "dark") document.documentElement.classList.add("dark");
connect();
