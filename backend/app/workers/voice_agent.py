import asyncio
import os
import json
from typing import Optional
from livekit import rtc
from sqlalchemy.orm import Session
from ..langgraph.agent_runtime import runtime
from ..services.livekit_service import LiveKitService

# Placeholder for STT/TTS services - these would need actual implementations
# from ..voice.stt import stream_speech_to_text
# from ..voice.tts import stream_text_to_speech

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
        
        # NOTE: This is a simplified loop. In a real implementation, you'd use 
        # a VAD (Voice Activity Detection) buffer here to detect end-of-speech.
        
        # For demonstration, we'll assume we get chunks of audio and process them.
        # In production, integrate with Deepgram Live or similar.
        
        async for frame in audio_stream:
            # 1. Detect Speech (VAD)
            # if vad.is_speech(frame):
            #    buffer.append(frame)
            # elif vad.is_silence(frame) and buffer:
            #    text = await stt.transcribe(buffer)
            #    await self.process_interaction(text)
            pass

    async def process_interaction(self, user_text: str, session_id: str = "default"):
        """
        Run the agent pipeline
        """
        if not user_text:
            return

        print(f"👤 User: {user_text}")
        
        # 1. Interrupt current speech if any
        if self.is_speaking:
            await self.stop_speaking()

        # 2. Get LLM Response
        result = await runtime.execute_text(
            agent_id=self.agent_id,
            user_input=user_text,
            session_id=session_id,
            db=self.db,
            metadata={"channel": "livekit_voice"}
        )
        agent_text = result["response"]
        print(f"🤖 Agent: {agent_text}")

        # 3. TTS & Stream Audio
        await self.speak(agent_text)

    async def speak(self, text: str):
        """
        Convert text to speech and push to audio source
        """
        self.is_speaking = True
        # audio_data = await tts.generate(text)
        # await self.audio_source.capture_frame(audio_data)
        self.is_speaking = False

    async def stop_speaking(self):
        """Stop current audio output (Barge-in)"""
        self.is_speaking = False
        # self.audio_source.clear_buffer()
        pass

    async def close(self):
        await self.room.disconnect()
