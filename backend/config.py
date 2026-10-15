from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = ROOT / "models" / "truman"
SOUNDS_DIR = ROOT / "sounds"
WEB_DIR = ROOT / "web"

# audio
SAMPLE_RATE = 16_000
FRAME_SAMPLES = 512 # 32 ms, what silero expects at 16k
MIC_DEVICE = None # `python -m sounddevice` lists devices

# pauses
FIRE_PAUSE_MS = 150 # short pause, ok to react. bump to 200-250 if it fires mid-sentence
LINE_PAUSE_MS = 700 # long pause, line is done and moves into context
VAD_THRESHOLD = 0.5

# stt
STT_MODEL = "nvidia/nemotron-speech-streaming-en-0.6b"
STT_CHUNK_MS = 160

# classifier
CONTEXT_LINES = 3 # must match training
MODE = "pitch" # or "conversation", see truman_config.json
COOLDOWN_MS = 1500 # don't stack reactions while a clip is playing

HOST = "127.0.0.1"
PORT = 8000
