import asyncio
from pathlib import Path
import time

from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

APP_DIR = Path(__file__).parent.resolve()

app = FastAPI()
app.mount("/static", StaticFiles(directory=APP_DIR / "static"), name="static")


@app.get("/")
async def get():
    with open(APP_DIR / "templates/main.html") as f:
        html = f.read()
    return HTMLResponse(html)

@app.websocket("/messages")
async def get_messages(websocket: WebSocket):
    await websocket.accept()
    data = None
    while True:
        try:
            data = await asyncio.wait_for(websocket.receive_text(), timeout=1)
        except asyncio.exceptions.TimeoutError:
            pass
        # Save Message to DB
        # Put message in Redis
        data = data or "Some other message"
        await websocket.send_text(f"Message text was: {data}")
        data = None
        time.sleep(1)
