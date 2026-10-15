const BARS = 72; // bars in the audio waveform

const dropArea = document.querySelector(".drop-area");
const dropzone = document.querySelector("#dropzone");
const dropHint = document.querySelector("#drop-hint");
const fileInput = document.querySelector("#file-input");
const fileCard = document.querySelector("#file-card");
const preview = document.querySelector("#preview");

let chosenFile = null;
let fileUrl = null;
let player = null;

function kindOf(file) {
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  if (/\.(txt|srt|vtt)$/i.test(file.name)) return "transcript";
  return null;
}

async function chooseFile(file) {
  const kind = kindOf(file);
  if (!kind) {
    rejectFile();
    return;
  }
  clearFile();
  chosenFile = file;
  fileUrl = URL.createObjectURL(file);

  fileCard.className = kind;
  fileCard.querySelector(".tile").replaceChildren(document.querySelector(`.kind.${kind} .icon`).cloneNode(true));
  document.querySelector("#file-name").textContent = file.name;
  setMeta(formatSize(file.size));
  dropzone.hidden = true;
  fileCard.hidden = false;

  if (kind === "transcript") await previewTranscript(file);
  if (kind === "audio") await previewAudio(file);
  if (kind === "video") previewVideo(file);
}

async function previewTranscript(file) {
  const lines = parseTranscript(await file.text());
  if (file !== chosenFile) return;
  const list = document.createElement("ol");
  list.className = "script";
  lines.forEach((text, i) => {
    const item = document.createElement("li");
    item.textContent = text;
    item.style.setProperty("--i", Math.min(i, 20));
    list.append(item);
  });
  preview.replaceChildren(list);
  setMeta("Transcript", `${lines.length} lines`, formatSize(file.size));
}

function parseTranscript(text) {
  // subtitle files also hold cue numbers and timestamps, keep only the spoken lines
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== "WEBVTT" && !line.includes("-->") && !/^\d+$/.test(line));
}

async function previewAudio(file) {
  const audio = new Audio(fileUrl);
  player = audio;
  audio.addEventListener("loadedmetadata", () => {
    setMeta("Audio", formatTime(audio.duration), formatSize(file.size));
  });
  let peaks;
  try {
    const sound = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(await file.arrayBuffer());
    peaks = getPeaks(sound.getChannelData(0));
  } catch {
    peaks = new Array(BARS).fill(0.3); // the browser can't draw this format, it may still play it
  }
  if (file !== chosenFile) return;

  const box = document.querySelector("#player-template").content.firstElementChild.cloneNode(true);
  const wave = box.querySelector(".wave");
  const clock = box.querySelector(".clock");
  peaks.forEach((peak, i) => {
    const bar = document.createElement("i");
    bar.style.setProperty("--h", Math.max(peak, 0.06));
    bar.style.setProperty("--i", i);
    wave.append(bar);
  });

  const showTime = () => {
    const played = Math.round((audio.currentTime / audio.duration) * BARS);
    [...wave.children].forEach((bar, i) => bar.classList.toggle("played", i < played));
    clock.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  };
  audio.ontimeupdate = showTime;
  audio.addEventListener("loadedmetadata", showTime);
  audio.onplay = () => box.classList.add("playing");
  audio.onpause = () => box.classList.remove("playing");
  box.querySelector(".play").onclick = () => (audio.paused ? audio.play() : audio.pause());
  wave.onclick = (e) => {
    const rect = wave.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  };

  showTime();
  preview.replaceChildren(box);
}

function getPeaks(samples) {
  const size = Math.floor(samples.length / BARS);
  const peaks = [];
  for (let i = 0; i < BARS; i++) {
    let loudest = 0;
    for (let j = i * size; j < (i + 1) * size; j += 32) loudest = Math.max(loudest, Math.abs(samples[j]));
    peaks.push(loudest);
  }
  const top = Math.max(...peaks) || 1;
  return peaks.map((peak) => peak / top);
}

function previewVideo(file) {
  const video = document.createElement("video");
  video.src = fileUrl;
  video.controls = true;
  video.playsInline = true;
  video.onloadedmetadata = () => setMeta("Video", formatTime(video.duration), formatSize(file.size));
  player = video;
  preview.replaceChildren(video);
}

function clearFile() {
  if (player) player.pause();
  if (fileUrl) URL.revokeObjectURL(fileUrl);
  chosenFile = null;
  fileUrl = null;
  player = null;
  preview.replaceChildren();
  fileInput.value = "";
  fileCard.hidden = true;
  dropzone.hidden = false;
  dropzone.classList.remove("rejected");
  dropHint.textContent = "or click to browse";
}

function rejectFile() {
  dropHint.textContent = "Truman reads transcripts, audio and video";
  dropzone.classList.remove("rejected");
  void dropzone.offsetWidth; // restart the shake
  dropzone.classList.add("rejected");
}

function setMeta(...parts) {
  document.querySelector("#file-meta").textContent = parts.join(" · ");
}

function formatSize(bytes) {
  return bytes < 1e6 ? `${Math.max(1, Math.round(bytes / 1e3))} KB` : `${(bytes / 1e6).toFixed(1)} MB`;
}

function formatTime(seconds) {
  if (!isFinite(seconds)) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

fileInput.onchange = () => {
  if (fileInput.files[0]) chooseFile(fileInput.files[0]);
};
document.querySelector("#remove-file").onclick = clearFile;

dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.classList.add("dragging");
});
dropArea.addEventListener("dragleave", (e) => {
  if (!dropArea.contains(e.relatedTarget)) dropArea.classList.remove("dragging");
});
dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.classList.remove("dragging");
  if (e.dataTransfer.files[0]) chooseFile(e.dataTransfer.files[0]);
});

// without this, a file dropped next to the drop area makes the browser leave the page to open it
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => e.preventDefault());
