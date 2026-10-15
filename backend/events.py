"""Messages pushed to the dashboard. Keep in sync with web/app.js."""
import json
import time
from dataclasses import asdict, dataclass


@dataclass
class Transcript:
    text: str
    final: bool = False # true once the line is finished
    type: str = "transcript"


@dataclass
class Scores:
    none: float
    laugh: float
    cheer: float
    boo: float
    ooh: float
    type: str = "scores"


@dataclass
class Reaction:
    reaction: str # "laugh", "cheer", "boo" or "ooh"
    size: str | None # "small" or "big" for laughs
    confidence: float
    text: str # the line it reacted to
    latency_ms: float | None = None # end of speech to clip start
    type: str = "reaction"


@dataclass
class Status:
    listening: bool
    mode: str # "pitch" or "conversation"
    muted: bool = False
    type: str = "status"


def to_json(event):
    return json.dumps({**asdict(event), "t": time.time()})


# from the dashboard:
#   {"type": "set_mode", "mode": "pitch" | "conversation"}
#   {"type": "mute", "muted": true | false}
