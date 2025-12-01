"""
Voice API endpoints
"""

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..langgraph.agent_runtime import runtime
from ..voice.stt import speech_to_text
from ..voice.tts import text_to_speech

router = APIRouter()


@router.post("/voice/{agent_id}/process")
async def process_voice(
    agent_id: str,
    audio: UploadFile = File(...),
    session_id: str = Form(...),
    db: Session = Depends(get_db)
):
    """Process voice input and return voice response"""
    try:
        # Read audio file
        audio_bytes = await audio.read()
        
        # Get agent config
        agent_data = await runtime.load_agent(agent_id, db)
        config = agent_data["config"]
        
        # STT: Audio -> Text
        user_text = await speech_to_text(audio_bytes, config)
        
        # Execute agent
        result = await runtime.execute_text(
            agent_id=agent_id,
            user_input=user_text,
            session_id=session_id,
            db=db,
            metadata={"channel": "voice"}
        )
        
        agent_response = result["response"]
        
        # TTS: Text -> Audio
        audio_response = await text_to_speech(agent_response, config)
        
        # Return audio with transcripts in headers
        return Response(
            content=audio_response,
            media_type="audio/mpeg",
            headers={
                "X-User-Transcript": user_text,
                "X-Agent-Transcript": agent_response,
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
