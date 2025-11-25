"""
Speech-to-Text implementation
"""

import openai
from typing import Dict, Any
import io
from ..config import settings

# Set OpenAI API key
openai.api_key = settings.OPENAI_API_KEY


async def speech_to_text(audio_bytes: bytes, config: Dict[str, Any]) -> str:
    """Convert speech to text using configured STT provider"""
    provider = config.get("stt_provider", "whisper")
    
    if provider == "whisper":
        return await whisper_stt(audio_bytes, config)
    elif provider == "deepgram":
        return await deepgram_stt(audio_bytes, config)
    else:
        raise ValueError(f"Unknown STT provider: {provider}")


async def whisper_stt(audio_bytes: bytes, config: Dict) -> str:
    """OpenAI Whisper STT"""
    # Create file-like object
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "audio.webm"
    
    # Transcribe
    response = openai.Audio.transcribe(
        model="whisper-1",
        file=audio_file
    )
    
    return response["text"]


async def deepgram_stt(audio_bytes: bytes, config: Dict) -> str:
    """Deepgram STT (alternative)"""
    try:
        from deepgram import Deepgram
        
        dg_client = Deepgram(settings.DEEPGRAM_API_KEY)
        
        source = {"buffer": audio_bytes, "mimetype": "audio/webm"}
        
        response = await dg_client.transcription.prerecorded(
            source,
            {
                "punctuate": True,
                "language": "en",
                "model": "nova-2"
            }
        )
        
        transcript = response["results"]["channels"][0]["alternatives"][0]["transcript"]
        return transcript
    except Exception as e:
        print(f"Deepgram error: {e}")
        # Fallback to Whisper
        return await whisper_stt(audio_bytes, config)
