"""Pause detection with Silero VAD."""


class PauseDetector:
    def feed(self, frame):
        """Returns "speech_start", "pause" or None."""
        raise NotImplementedError

    def silence_ms(self):
        raise NotImplementedError
