import argparse

from . import config


def main():
    ap = argparse.ArgumentParser(prog="truman")
    ap.add_argument("--fake", action="store_true", help="scripted events, no mic or gpu")
    ap.add_argument("--wav", help="read from a recording instead of the mic")
    ap.add_argument("--mode", choices=["pitch", "conversation"], default=config.MODE)
    args = ap.parse_args()
    # TODO: start server, then fake.run or pipeline.run on a worker thread
    raise NotImplementedError


if __name__ == "__main__":
    main()
