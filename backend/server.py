"""FastAPI app: serves web/ and pushes events to the dashboard over /ws."""


def send(event):
    """Thread-safe, called from the pipeline thread."""
    raise NotImplementedError


def start(host, port):
    raise NotImplementedError
