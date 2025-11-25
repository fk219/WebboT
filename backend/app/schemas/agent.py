"""
Agent Pydantic schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class AgentConfig(BaseModel):
    """Agent configuration"""
    name: str
    description: Optional[str] = None
    llm_provider: str
    llm_model: str
    system_prompt: str
    temperature: float = 0.7
    max_tokens: int = 1000
    voice_provider: Optional[str] = None
    voice_id: Optional[str] = None
    voice_model: Optional[str] = None
    voice_speed: float = 1.0
    voice_temperature: float = 1.0
    voice_volume: float = 1.0
    responsiveness: float = 1.0
    interruption_sensitivity: float = 1.0
    enable_backchannel: bool = True
    backchannel_words: List[str] = Field(default_factory=list)
    normalize_speech: bool = True
    boosted_keywords: List[str] = Field(default_factory=list)
    ambient_sound: str = 'none'
    ambient_volume: float = 0.5
    max_duration_seconds: int = 1800
    end_after_silence_seconds: int = 600
    voicemail_detection: bool = False
    voicemail_action: str = 'hangup'
    voicemail_message: Optional[str] = None
    stt_provider: str = 'whisper'
    stt_mode: str = 'fast'
    denoising_mode: str = 'noise-cancellation'
    pii_redaction_enabled: bool = False
    pii_redaction_list: List[str] = Field(default_factory=list)
    data_storage_policy: str = 'everything'
    webhook_url: Optional[str] = None
    webhook_timeout_ms: int = 5000
    custom_headers: Dict[str, str] = Field(default_factory=dict)
    enabled_mcp_servers: List[str] = Field(default_factory=list)
    knowledge_base_ids: List[str] = Field(default_factory=list)


class AgentCreate(BaseModel):
    """Agent creation schema"""
    name: str
    description: Optional[str] = None
    config: AgentConfig


class AgentUpdate(BaseModel):
    """Agent update schema"""
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[AgentConfig] = None


class AgentResponse(BaseModel):
    """Agent response schema"""
    id: UUID
    organization_id: UUID
    name: str
    description: Optional[str]
    llm_provider: str
    llm_model: str
    system_prompt: str
    temperature: float
    max_tokens: int
    voice_provider: Optional[str]
    voice_id: Optional[str]
    voice_model: Optional[str]
    voice_speed: float
    voice_temperature: float
    voice_volume: float
    responsiveness: float
    interruption_sensitivity: float
    enable_backchannel: bool
    backchannel_words: List[str]
    normalize_speech: bool
    boosted_keywords: List[str]
    ambient_sound: str
    ambient_volume: float
    max_duration_seconds: int
    end_after_silence_seconds: int
    voicemail_detection: bool
    voicemail_action: str
    voicemail_message: Optional[str]
    stt_provider: str
    stt_mode: str
    denoising_mode: str
    pii_redaction_enabled: bool
    pii_redaction_list: List[str]
    data_storage_policy: str
    webhook_url: Optional[str]
    webhook_timeout_ms: int
    custom_headers: Dict[str, str]
    enabled_mcp_servers: List[str]
    knowledge_base_ids: List[str]
    is_published: bool
    version: int
    config_json: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID]
    
    class Config:
        from_attributes = True


class ChatMessage(BaseModel):
    """Chat message schema"""
    message: str
    session_id: str


class ChatResponse(BaseModel):
    """Chat response schema"""
    response: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
