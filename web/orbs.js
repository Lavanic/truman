// halo, ring, core and spark colors, one set per speaker
const PALETTES = [
  ["#fde047", "#ec4899", "#1e3a8a", "#93c5fd"],
  ["#a3e635", "#22d3ee", "#4c1d95", "#f0abfc"],
  ["#f9a8d4", "#db2777", "#38bdf8", "#e0f2fe"],
  ["#fcd34d", "#f43f5e", "#3b0764", "#fde68a"],
];

const voicesBox = document.querySelector("#voices");
const voices = new Map();
let lastFrame = performance.now();

function voiceFor(speaker) {
  // the backend doesn't name speakers yet, so everyone shares the unnamed orb until it does
  if (!speaker && voices.size && !voices.has("")) return null;
  if (speaker && voices.has("")) {
    voices.get("").el.remove();
    voices.delete("");
  }
  if (!voices.has(speaker)) {
    const el = document.querySelector("#voice-template").content.firstElementChild.cloneNode(true);
    const [halo, ring, core, spark] = PALETTES[voices.size % PALETTES.length];
    el.style.setProperty("--halo", halo);
    el.style.setProperty("--ring", ring);
    el.style.setProperty("--core", core);
    el.style.setProperty("--spark", spark);
    el.querySelector(".voice-name").textContent = speaker;
    voicesBox.append(el);
    voices.set(speaker, { el, energy: 0, level: 0, angle: Math.random() * 360 });
  }
  return voices.get(speaker);
}

function pulseVoice(speaker) {
  const voice = voiceFor(speaker);
  if (voice) voice.energy = 1;
}

function animateVoices(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  for (const voice of voices.values()) {
    // energy jumps on every word and fades out, level follows it smoothly
    voice.energy = Math.max(0, voice.energy - dt * 1.4);
    voice.level += (voice.energy - voice.level) * Math.min(1, dt * 6);
    voice.angle += dt * (12 + voice.level * 150);
    voice.el.style.setProperty("--level", voice.level.toFixed(3));
    voice.el.style.setProperty("--angle", `${voice.angle.toFixed(1)}deg`);
    voice.el.classList.toggle("speaking", voice.energy > 0.05);
  }
  requestAnimationFrame(animateVoices);
}

voiceFor("");
requestAnimationFrame(animateVoices);
