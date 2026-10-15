"""Turns classifier output into a reaction, or nothing."""
from dataclasses import dataclass


@dataclass
class Decision:
    reaction: str # "laugh", "cheer", "boo" or "ooh"
    size: str | None # "small" or "big" for laughs
    confidence: float


def decide(probs, thresholds):
    # laughs are scored as one class (small + big), size only picks the clip.
    # no debounce on purpose: holding for 2 updates cut correct reactions from 16 to 9
    candidates = {
        "laugh": probs["small_laugh"] + probs["big_laugh"],
        "cheer": probs["cheer"],
        "boo": probs["boo"],
        "ooh": probs["ooh"],
    }
    top = max(candidates, key=candidates.get)
    score = candidates[top]
    threshold = min(thresholds["small_laugh"], thresholds["big_laugh"]) if top == "laugh" else thresholds[top]
    if score < threshold or score < probs["none"]:
        return None
    size = None
    if top == "laugh":
        size = "big" if probs["big_laugh"] > probs["small_laugh"] else "small"
    return Decision(top, size, score)
