"""
Agent database model
"""

from sqlalchemy import Column, String, Float, Integer, Boolean, JSON, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from ..database import Base


class Agent(Base):
    """Agent model"""
    __tablename__ = "agents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # LLM Configuration
    llm_provider = Column(String(50), nullable=False)
    llm_model = Column(String(100), nullable=False)
    system_prompt = Column(Text, nullable=False)
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=1000)
    
    # Voice Configuration
    voice_provider = Column(String(50))
    voice_id = Column(String(255))
    voice_model = Column(String(100))
    voice_speed = Column(Float, default=1.0)
    voice_temperature = Column(Float, default=1.0)
    voice_volume = Column(Float, default=1.0)
    
    # Speech Processing
    responsiveness = Column(Float, default=1.0)
    interruption_sensitivity = Column(Float, default=1.0)
    enable_backchannel = Column(Boolean, default=True)
    backchannel_words = Column(JSON, default=list)
    normalize_speech = Column(Boolean, default=True)
    boosted_keywords = Column(JSON, default=list)
    
    # Ambient & Environment
    ambient_sound = Column(String(50), default='none')
    ambient_volume = Column(Float, default=0.5)
    
    # Call Settings
    max_duration_seconds = Column(Integer, default=1800)
    end_after_silence_seconds = Column(Integer, default=600)
    voicemail_detection = Column(Boolean, default=False)
    voicemail_action = Column(String(20), default='hangup')
    voicemail_message = Column(Text)
    
    # Transcription
    stt_provider = Column(String(50), default='whisper')
    stt_mode = Column(String(20), default='fast')
    denoising_mode = Column(String(50), default='noise-cancellation')
    
    # Security & Privacy
    pii_redaction_enabled = Column(Boolean, default=False)
    pii_redaction_list = Column(JSON, default=list)
    data_storage_policy = Column(String(50), default='everything')
    
    # Integration
    webhook_url = Column(Text)
    webhook_timeout_ms = Column(Integer, default=5000)
    custom_headers = Column(JSON, default=dict)
    
    # MCP Tools
    enabled_mcp_servers = Column(JSON, default=list)
    
    # Knowledge Base
    knowledge_base_ids = Column(JSON, default=list)
    
    # Status
    is_published = Column(Boolean, default=False)
    version = Column(Integer, default=1)
    
    # Full config backup
    config_json = Column(JSON, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True))
