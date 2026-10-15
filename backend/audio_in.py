"""Audio sources. Both yield 16 kHz mono float32 frames of FRAME_SAMPLES."""


class Microphone:
    def __init__(self, device=None):
        self.device = device

    def frames(self):
        raise NotImplementedError


class WavFile:
    """Replays a recording. Real-time by default so latency numbers stay honest."""

    def __init__(self, path, realtime=True):
        self.path = path
        self.realtime = realtime

    def frames(self):
        raise NotImplementedError
