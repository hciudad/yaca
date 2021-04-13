import asyncio
import json
from pathlib import Path

from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import redis

from .message import PubSubMessage

APP_DIR = Path(__file__).parent.resolve()

CHANNEL_NAME = "Status Meeting"
CHANNEL_NAME_SLUG = "status-meeting"

app = FastAPI()
app.mount("/static", StaticFiles(directory=APP_DIR / "static"), name="static")


@app.get("/")
async def get():
    with open(APP_DIR / "templates/main.html") as f:
        html = f.read()
    return HTMLResponse(html)

@app.websocket("/messages")
async def get_messages(websocket: WebSocket):
    """
    Only supports one channel for now.d
    """
    await websocket.accept()

    r = redis.Redis()
    ps = r.pubsub(ignore_subscribe_messages=True)
    ps.subscribe(f"channel:{CHANNEL_NAME_SLUG}")

    while True:
        try:
            data = await asyncio.wait_for(websocket.receive_text(), timeout=1)
            r.publish(f"channel:{CHANNEL_NAME_SLUG}", data)
        except asyncio.exceptions.TimeoutError:
            pass

        raw_message = ps.get_message()
        if raw_message:
            message = PubSubMessage(**raw_message)
            await websocket.send_text(json.dumps(message.payload))
