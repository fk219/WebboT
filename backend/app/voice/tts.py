"""
Text-to-Speech implementation
"""

try:
    from elevenlabs.client import ElevenLabs
    ELEVENLABS_AVAILABLE = True
except ImportError:
    ELEVENLABS_AVAILABLE = False

from openai import OpenAI
from typing import Dict, Any
from ..config import settings

# Initialize clients
if ELEVENLABS_AVAILABLE and settings.ELEVENLABS_API_KEY:
    elevenlabs_client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
else:
    elevenlabs_client = None

openai_client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None


async def text_to_speech(text: str, config: Dict[str, Any]) -> bytes:
    """Convert text to speech using configured TTS provider"""
    provider = config.get("voice_provider", "elevenlabs")
    
    if provider == "elevenlabs":
        return await elevenlabs_tts(text, config)
    elif provider == "openai":
        return await openai_tts(text, config)
    else:
        raise ValueError(f"Unknown TTS provider: {provider}")


async def elevenlabs_tts(text: str, config: Dict) -> bytes:
    """ElevenLabs TTS"""
    if not elevenlabs_client:
        raise ValueError("ElevenLabs client not initialized. Check API key.")
    
    voice_id = config.get("voice_id", "21m00Tcm4TlvDq8ikWAM")
    model = config.get("voice_model", "eleven_turbo_v2")
    
    # Use new ElevenLabs API
    audio = elevenlabs_client.generate(
        text=text,
        voice=voice_id,
        model=model
    )
    
    # Convert generator to bytes if needed
    if hasattr(audio, '__iter__') and not isinstance(audio, bytes):
        audio = b''.join(audio)
    
    return audio


async def openai_tts(text: str, config: Dict) -> bytes:
    """OpenAI TTS"""
    if not openai_client:
        raise ValueError("OpenAI client not initialized. Check API key.")
    
    voice = config.get("voice_id", "alloy")
    model = config.get("voice_model", "tts-1")
    speed = config.get("voice_speed", 1.0)
    
    response = openai_client.audio.speech.create(
        model=model,
        voice=voice,
        input=text,
        speed=speed
    )
    
    return response.content
