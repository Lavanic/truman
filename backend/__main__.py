import argparse

from . import config, server


def main():
    ap = argparse.ArgumentParser(prog="truman")
    ap.add_argument("--fake", action="store_true", help="scripted events, no mic or gpu")
    ap.add_argument("--wav", help="read from a recording instead of the mic")
    ap.add_argument("--mode", choices=["pitch", "conversation"], default=config.MODE)
    args = ap.parse_args()

    server.status.mode = args.mode
    server.start(config.HOST, config.PORT)
    print(f"truman running at http://{config.HOST}:{config.PORT}")
    try:
        if args.fake:
            from . import fake

            server.status.listening = True
            fake.run(server.send)
        else:
            from . import audio_in, pipeline # pulls in torch, so only for the real thing

            source = audio_in.WavFile(args.wav) if args.wav else audio_in.Microphone(config.MIC_DEVICE)
            pipeline.run(source, server.send, args.mode)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
