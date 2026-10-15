"""The current line plus the finished lines before it (the classifier's context)."""
from . import config


class Lines:
    def __init__(self, n_context=config.CONTEXT_LINES):
        self.n_context = n_context
        self.finished = []
        self.current = ""

    def update(self, partial):
        self.current = partial

    def finish_line(self):
        if self.current.strip():
            self.finished.append(self.current)
        self.current = ""

    def context(self):
        return self.finished[-self.n_context:]
