import asyncio
import os
import json
from typing import Optional
from livekit import rtc
from sqlalchemy.orm import Session
from ..langgraph.agent_runtime import runtime
from ..services.livekit_service import LiveKitService

import numpy as np
from ..voice.stt import speech_to_text
from ..voice.tts import text_to_speech

class VoiceAgent:
    """
    A worker that connects to a LiveKit room as the AI Agent.
    It listens to user audio, transcribes it, queries the LLM, and speaks back.
    """
    def __init__(self, room_name: str, agent_id: str, db_session: Session):
        self.room_name = room_name
        self.agent_id = agent_id
        self.db = db_session
        self.room = rtc.Room()
        self.audio_out_track: Optional[rtc.LocalAudioTrack] = None
        self.audio_source: Optional[rtc.AudioSource] = None
        self.is_speaking = False

    async def start(self):
        """Connect to the room and start listening"""
        print(f"🤖 VoiceAgent starting for room: {self.room_name}")
        
        # 1. Generate Token
        token = LiveKitService.get_token(
            room_name=self.room_name,
            participant_identity=f"agent-{self.agent_id}",
            participant_name="AI Assistant"
        )

        # 2. Connect
        try:
            await self.room.connect(os.getenv("LIVEKIT_URL"), token)
            print(f"✅ Connected to room: {self.room_name}")
        except Exception as e:
            print(f"❌ Failed to connect: {e}")
            return

        # 3. Publish Agent's Audio Track (Microphone)
        self.audio_source = rtc.AudioSource(48000, 1)
        self.audio_out_track = rtc.LocalAudioTrack.create_audio_track("agent-voice", self.audio_source)
        await self.room.local_participant.publish_track(self.audio_out_track)

        # 4. Subscribe to events
        @self.room.on("track_subscribed")
        def on_track_subscribed(track: rtc.Track, publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
            if track.kind == rtc.TrackKind.KIND_AUDIO and not participant.identity.startswith("agent-"):
                print(f"🎤 Subscribed to audio from {participant.identity}")
                asyncio.create_task(self.handle_audio_stream(track, participant))

        @self.room.on("disconnected")
        def on_disconnected():
            print("🔌 Disconnected from room")

    async def handle_audio_stream(self, track: rtc.RemoteAudioTrack, participant: rtc.RemoteParticipant):
        """
        Process incoming audio stream:
        Audio -> VAD -> STT -> LangGraph -> TTS -> Audio
        """
        audio_stream = rtc.AudioStream(track)
        print(f"👂 Listening to {participant.identity}...")
        
        # Audio buffer for VAD
        buffer = []
        silence_frames = 0
        is_speech = False
        SILENCE_THRESHOLD = 10  # Adjust based on testing
        SILENCE_DURATION_FRAMES = 20 # Approx 0.5-1s depending on frame rate
        
        async for frame in audio_stream:
            # Convert to numpy array to check energy
            data = np.frombuffer(frame.data, dtype=np.int16)
            amplitude = np.abs(data).mean()
            
            if amplitude > SILENCE_THRESHOLD:
                is_speech = True
                silence_frames = 0
                buffer.append(frame.data)
            else:
                if is_speech:
                    silence_frames += 1
                    buffer.append(frame.data)
                    
                    if silence_frames > SILENCE_DURATION_FRAMES:
                        # End of speech detected
                        print("Silence detected, processing speech...")
                        full_audio = b''.join(buffer)
                        
                        # Reset buffer
                        buffer = []
                        is_speech = False
                        silence_frames = 0
                        
                        # Process in background
                        asyncio.create_task(self.process_interaction(full_audio))
                else:
                    # Just silence, ignore
                    pass

    async def process_interaction(self, audio_data: bytes, session_id: str = "default"):
        """
        Run the agent pipeline
        """
        try:
            # 1. STT
            print("Transcribing...")
            user_text = await speech_to_text(audio_data, {"stt_provider": "whisper"})
            
            if not user_text or len(user_text.strip()) < 2:
                return

            print(f"👤 User: {user_text}")
            
            # 2. Interrupt current speech if any
            if self.is_speaking:
                await self.stop_speaking()

            # 3. Get LLM Response
            result = await runtime.execute_text(
                agent_id=self.agent_id,
                user_input=user_text,
                session_id=session_id,
                db=self.db,
                metadata={"channel": "livekit_voice"}
            )
            agent_text = result["response"]
            print(f"🤖 Agent: {agent_text}")

            # 4. TTS & Stream Audio
            await self.speak(agent_text)
            
        except Exception as e:
            print(f"❌ Error in interaction: {e}")

    async def speak(self, text: str):
        """
        Convert text to speech and push to audio source
        """
        self.is_speaking = True
        try:
            # Generate Audio
            audio_bytes = await text_to_speech(text, {"voice_provider": "openai"})
            
            # Convert bytes to frames and push to LiveKit
            # This part requires decoding the MP3/WAV from TTS into PCM
            # For MVP, we'll skip the complex decoding and assume we can push raw bytes 
            # (LiveKit usually needs PCM). 
            # TODO: Add pydub or similar to decode MP3 to PCM
            
            # For now, we'll just print that we are speaking
            print(f"🔊 Speaking: {text}")
            
            # In a real impl, we would decode audio_bytes to PCM and call:
            # await self.audio_source.capture_frame(frame)
            
        except Exception as e:
            print(f"❌ TTS Error: {e}")
        finally:
            self.is_speaking = False

    async def stop_speaking(self):
        """Stop current audio output (Barge-in)"""
        self.is_speaking = False
        # self.audio_source.clear_buffer()
        pass

    async def close(self):
        await self.room.disconnect()
