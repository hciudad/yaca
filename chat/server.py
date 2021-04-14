import asyncio
import json
import os
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import redis

from .message import PubSubMessage

APP_DIR = Path(__file__).parent.resolve()

CHANNEL_NAME = "Status Meeting"
CHANNEL_NAME_SLUG = "status-meeting"

USER_MEMBERSHIP_SET = f"channel:{CHANNEL_NAME_SLUG}:users"

REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")

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

    r = redis.Redis(host=REDIS_HOST)
    ps = r.pubsub(ignore_subscribe_messages=True)
    ps.psubscribe(f"channel:{CHANNEL_NAME_SLUG}:*")

    user = None

    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=1)
                event = json.loads(data)
                if event["event_type"] == "message":
                    r.publish(f"channel:{CHANNEL_NAME_SLUG}:message", data)
                elif event["event_type"] == "register_user":
                    user = event["user"]
                    r.sadd(USER_MEMBERSHIP_SET, event["user"]["display_name"])
                    r.publish(f"channel:{CHANNEL_NAME_SLUG}:register_user", data)
                else:
                    raise Exception(f"Unknown event type: {event['event_type']}")
            except asyncio.exceptions.TimeoutError:
                pass

            raw_message = ps.get_message()
            if raw_message:
                message = PubSubMessage(**raw_message).payload
                message["channel_membership"] = [u.decode() for u in r.smembers(USER_MEMBERSHIP_SET)]
                await websocket.send_text(json.dumps(message))
    except WebSocketDisconnect:
        disconnect_payload = {
            "event_type": "deregister_user",
            "user": user if user else None
        }
        r.srem(USER_MEMBERSHIP_SET, user["display_name"])
        r.publish(f"channel:{CHANNEL_NAME_SLUG}:deregister_user",
                  json.dumps(disconnect_payload))

