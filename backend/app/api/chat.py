"""
Chat API endpoints
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.agent import ChatMessage, ChatResponse
from ..langgraph.agent_runtime import runtime
import json

router = APIRouter()


@router.post("/chat/{agent_id}/message", response_model=ChatResponse)
async def send_message(
    agent_id: str,
    message_data: ChatMessage,
    db: Session = Depends(get_db)
):
    """Send text message to agent with session management"""
    try:
        # Extract metadata from request if available
        metadata = getattr(message_data, 'metadata', {})
        
        result = await runtime.execute_text(
            agent_id=agent_id,
            user_input=message_data.message,
            session_id=message_data.session_id,
            db=db,
            metadata=metadata
        )
        return result
    except Exception as e:
        return ChatResponse(
            response=f"Error: {str(e)}",
            metadata={"error": True}
        )


@router.websocket("/ws/chat/{agent_id}")
async def websocket_chat(
    websocket: WebSocket,
    agent_id: str
):
    """WebSocket for real-time chat"""
    await websocket.accept()
    
    # Get database session
    db = next(get_db())
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            message = message_data.get("message")
            session_id = message_data.get("session_id")
            
            if not session_id:
                await websocket.send_json({
                    "type": "error",
                    "message": "session_id required"
                })
                continue
            
            # Execute agent
            try:
                result = await runtime.execute_text(
                    agent_id=agent_id,
                    user_input=message,
                    session_id=session_id,
                    db=db
                )
                
                # Send response
                await websocket.send_json({
                    "type": "message",
                    "content": result["response"],
                    "metadata": result["metadata"]
                })
            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
    
    except WebSocketDisconnect:
        print(f"Client disconnected from agent {agent_id}")
    finally:
        db.close()
