"""
Session database models
"""

from sqlalchemy import Column, String, Integer, JSON, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from ..database import Base


class AgentSession(Base):
    """Agent session model"""
    __tablename__ = "agent_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(String(255), unique=True, nullable=False, index=True)
    agent_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Isolation
    user_id = Column(UUID(as_uuid=True))
    website_domain = Column(String(255))
    ip_address = Column(String(45))
    
    # Channel
    channel = Column(String(50), nullable=False)  # 'text', 'voice', 'phone'
    
    # Conversation state
    message_count = Column(Integer, default=0)
    conversation_history = Column(JSON, default=list)
    context_data = Column(JSON, default=dict)
    
    # Status
    status = Column(String(50), default='active')  # 'active', 'ended', 'timeout'
    
    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow)
    last_activity_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime)


class AgentMessage(Base):
    """Agent message model"""
    __tablename__ = "agent_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey('agent_sessions.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    
    # Message
    role = Column(String(20), nullable=False)  # 'user', 'assistant', 'system'
    content = Column(String, nullable=False)
    
    # Audio (for voice)
    audio_url = Column(String)
    audio_duration_ms = Column(Integer)
    
    # Metadata
    tokens_used = Column(Integer)
    latency_ms = Column(Integer)
    model_used = Column(String(100))
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
