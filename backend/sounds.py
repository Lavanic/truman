"""Audience clips, preloaded from sounds/<reaction>/*.wav."""


class SoundBank:
    def __init__(self, sounds_dir):
        self.sounds_dir = sounds_dir

    def play(self, decision):
        raise NotImplementedError

    def is_playing(self):
        raise NotImplementedError
