import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    sys_mon = websocket.app.state.sys_mon
    try:
        while True:
            # Periodically push metrics
            await asyncio.sleep(3)
            status = sys_mon.get_current_status()
            if status:
                await manager.broadcast({"type": "metrics", "data": status})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
