"""Main loop: audio -> vad/stt -> lines -> classifier -> trigger -> sounds + ui."""


def run(source, send, mode):
    # per 32 ms frame:
    #   vad.feed + stt.feed
    #   new partial -> score it right away (speculative), push scores + transcript
    #   short pause -> trigger.decide on the latest scores, play clip, push reaction
    #   long pause -> finish the line, reset stt
    # stt and the classifier share this thread so they never contend for the gpu
    raise NotImplementedError
