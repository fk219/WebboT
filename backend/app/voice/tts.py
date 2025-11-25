"""
Text-to-Speech implementation
"""

from elevenlabs import generate, set_api_key
import openai
from typing import Dict, Any
from ..config import settings

# Set API keys
set_api_key(settings.ELEVENLABS_API_KEY)
openai.api_key = settings.OPENAI_API_KEY


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
    voice_id = config.get("voice_id", "21m00Tcm4TlvDq8ikWAM")
    model = config.get("voice_model", "eleven_turbo_v2")
    
    audio = generate(
        text=text,
        voice=voice_id,
        model=model,
        stream=False
    )
    
    # Convert generator to bytes if needed
    if hasattr(audio, '__iter__') and not isinstance(audio, bytes):
        audio = b''.join(audio)
    
    return audio


async def openai_tts(text: str, config: Dict) -> bytes:
    """OpenAI TTS"""
    voice = config.get("voice_id", "alloy")
    model = config.get("voice_model", "tts-1")
    speed = config.get("voice_speed", 1.0)
    
    response = openai.Audio.speech.create(
        model=model,
        voice=voice,
        input=text,
        speed=speed
    )
    
    return response.content
