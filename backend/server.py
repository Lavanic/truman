"""FastAPI app: serves web/ and pushes events to the dashboard over /ws."""
import asyncio
import json
import threading
import time
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

from . import config, events

status = events.Status(listening=False, mode=config.MODE) # the pipeline reads mode/muted from here
clients = set()
loop = None


@asynccontextmanager
async def lifespan(app):
    global loop
    loop = asyncio.get_running_loop()
    yield


app = FastAPI(lifespan=lifespan)


@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    clients.add(websocket)
    await websocket.send_text(events.to_json(status))
    try:
        while True:
            handle(json.loads(await websocket.receive_text()))
    except WebSocketDisconnect:
        pass
    finally:
        clients.discard(websocket)


app.mount("/", StaticFiles(directory=config.WEB_DIR, html=True), name="web")


def handle(msg):
    if msg.get("type") == "set_mode" and msg.get("mode") in ("pitch", "conversation"):
        status.mode = msg["mode"]
    elif msg.get("type") == "mute":
        status.muted = bool(msg.get("muted"))
    else:
        return
    send(status)


async def broadcast(text):
    for client in list(clients):
        try:
            await client.send_text(text)
        except Exception:
            clients.discard(client)


def send(event):
    """Thread-safe, called from the pipeline thread."""
    if loop is not None:
        asyncio.run_coroutine_threadsafe(broadcast(events.to_json(event)), loop)


def start(host, port):
    server = uvicorn.Server(uvicorn.Config(app, host=host, port=port, log_level="warning"))
    threading.Thread(target=server.run, daemon=True).start()
    while not server.started:
        time.sleep(0.05)
