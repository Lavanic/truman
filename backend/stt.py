"""Streaming STT (Nemotron 0.6B, 160 ms chunks)."""


class SpeechToText:
    def feed(self, frame):
        """Returns the partial transcript when it changes, else None."""
        raise NotImplementedError

    def reset(self):
        raise NotImplementedError
