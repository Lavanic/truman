"""Wrapper around the fine-tuned ModernBERT-large classifier in models/truman."""
import json
import re
import unicodedata

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from . import config


def normalize(text):
    # must match the training data exactly: lowercase, no punctuation except in-word apostrophes
    t = unicodedata.normalize("NFKC", text)
    t = t.replace("’", "'").replace("‘", "'").replace("`", "'")
    t = re.sub(r"\([^)]*\)|\[[^\]]*\]", " ", t)
    t = t.lower()
    t = re.sub(r"[^a-z0-9' ]+", " ", t)
    t = re.sub(r"(?<![a-z])'|'(?![a-z])", " ", t)
    return re.sub(r"\s+", " ", t).strip()


class Truman:
    def __init__(self, model_dir=config.MODEL_DIR):
        self.cfg = json.loads((model_dir / "truman_config.json").read_text())
        self.labels = self.cfg["labels"]
        self.n_context = self.cfg["input"]["context_lines"]
        self.max_len = self.cfg["input"]["max_tokens"]
        self.tok = AutoTokenizer.from_pretrained(model_dir)
        self.tok.truncation_side = "left" # drop old context first, never the current line
        self.model = AutoModelForSequenceClassification.from_pretrained(model_dir, dtype=torch.bfloat16).cuda().eval()

    def thresholds(self, mode):
        return self.cfg["threshold_modes"][mode]

    @torch.inference_mode()
    def predict(self, context, line):
        """Label -> probability for the current line, given the previous lines (oldest first)."""
        parts = [normalize(c) for c in context[-self.n_context:]] if self.n_context else []
        text = f" {self.tok.sep_token} ".join([p for p in parts if p] + [normalize(line)])
        enc = self.tok(text, truncation=True, max_length=self.max_len, return_tensors="pt").to("cuda")
        probs = self.model(**enc).logits.float().softmax(-1)[0].tolist()
        return dict(zip(self.labels, probs))
