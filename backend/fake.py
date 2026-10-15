"""Scripted events so the dashboard can be built without a mic or gpu."""
import random
import time

from .events import Reaction, Scores, Transcript

SCRIPT = [
    ("hi everyone we're team truman", None),
    ("we've been awake for thirty six hours so if we stop making sense that's a feature", "laugh"),
    ("truman is a live studio audience for real life", None),
    ("it reacts about a third of a second after you stop talking", "cheer"),
    ("stick around because at the end we have a surprise", "ooh"),
    ("i have a confession we copied last year's winning project and changed the colors", "boo"),
]

WORD_S = 0.25 # roughly speaking pace


def scores(reaction, progress):
    # filler stays flat, a punchline climbs as the line gets closer to its end
    s = {k: random.uniform(0, 0.06) for k in ("laugh", "cheer", "boo", "ooh")}
    if reaction:
        s[reaction] = min(0.95, 0.1 + 0.8 * progress ** 2 + random.uniform(-0.04, 0.04))
    return Scores(none=max(0, 1 - sum(s.values())), **s)


def run(send):
    while True:
        for line, reaction in SCRIPT:
            words = line.split()
            for i in range(1, len(words) + 1):
                send(Transcript(" ".join(words[:i])))
                send(scores(reaction, i / len(words)))
                time.sleep(WORD_S)
            if reaction:
                latency = random.randint(280, 380)
                time.sleep(latency / 1000)
                size = random.choice(["small", "big"]) if reaction == "laugh" else None
                send(Reaction(reaction, size, round(random.uniform(0.6, 0.95), 2), line, latency))
            time.sleep(0.7)
            send(Transcript(line, final=True))
            send(scores(None, 0))
            time.sleep(1)
