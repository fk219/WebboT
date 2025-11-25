"""
Session management service
"""

from sqlalchemy.orm import Session
from ..models.session import AgentSession, AgentMessage
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import uuid


class SessionService:
    """Manage agent sessions"""
    
    @staticmethod
    def create_session(
        session_id: str,
        agent_id: str,
        channel: str,
        db: Session,
        user_id: Optional[str] = None,
        website_domain: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> AgentSession:
        """Create new session"""
        
        session = AgentSession(
            id=uuid.uuid4(),
            session_id=session_id,
            agent_id=agent_id,
            channel=channel,
            user_id=user_id,
            website_domain=website_domain,
            ip_address=ip_address,
            status='active',
            conversation_history=[],
            context_data={}
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return session
    
    @staticmethod
    def get_session(session_id: str, db: Session) -> Optional[AgentSession]:
        """Get session by ID"""
        return db.query(AgentSession).filter(
            AgentSession.session_id == session_id
        ).first()
    
    @staticmethod
    def get_or_create_session(
        session_id: str,
        agent_id: str,
        channel: str,
        db: Session,
        metadata: Optional[Dict] = None
    ) -> AgentSession:
        """Get existing session or create new one"""
        session = SessionService.get_session(session_id, db)
        
        if not session:
            session = SessionService.create_session(
                session_id=session_id,
                agent_id=agent_id,
                channel=channel,
                db=db,
                website_domain=metadata.get('website_domain') if metadata else None,
                ip_address=metadata.get('ip_address') if metadata else None
            )
        
        return session
    
    @staticmethod
    def update_activity(session_id: str, db: Session):
        """Update last activity timestamp"""
        session = SessionService.get_session(session_id, db)
        if session:
            session.last_activity_at = datetime.utcnow()
            db.commit()
    
    @staticmethod
    def add_message_to_history(
        session: AgentSession,
        role: str,
        content: str,
        db: Session
    ):
        """Add message to session history"""
        history = session.conversation_history or []
        history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        session.conversation_history = history
        session.message_count += 1
        session.last_activity_at = datetime.utcnow()
        db.commit()
    
    @staticmethod
    def save_message(
        session_id: str,
        role: str,
        content: str,
        db: Session,
        audio_url: Optional[str] = None,
        tokens_used: Optional[int] = None,
        latency_ms: Optional[int] = None,
        model_used: Optional[str] = None
    ) -> AgentMessage:
        """Save message to database"""
        session = SessionService.get_session(session_id, db)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        message = AgentMessage(
            id=uuid.uuid4(),
            session_id=session.id,
            role=role,
            content=content,
            audio_url=audio_url,
            tokens_used=tokens_used,
            latency_ms=latency_ms,
            model_used=model_used
        )
        
        db.add(message)
        db.commit()
        db.refresh(message)
        
        return message
    
    @staticmethod
    def get_session_messages(
        session_id: str,
        db: Session,
        limit: Optional[int] = None
    ) -> List[AgentMessage]:
        """Get messages for a session"""
        session = SessionService.get_session(session_id, db)
        if not session:
            return []
        
        query = db.query(AgentMessage).filter(
            AgentMessage.session_id == session.id
        ).order_by(AgentMessage.created_at)
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    @staticmethod
    def end_session(session_id: str, db: Session):
        """End session"""
        session = SessionService.get_session(session_id, db)
        if session:
            session.status = 'ended'
            session.ended_at = datetime.utcnow()
            db.commit()
    
    @staticmethod
    def cleanup_inactive_sessions(hours: int, db: Session) -> int:
        """Clean up sessions inactive for X hours"""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        
        count = db.query(AgentSession).filter(
            AgentSession.last_activity_at < cutoff,
            AgentSession.status == 'active'
        ).update({
            'status': 'timeout',
            'ended_at': datetime.utcnow()
        })
        
        db.commit()
        return count
    
    @staticmethod
    def get_active_session_count(agent_id: str, db: Session) -> int:
        """Get count of active sessions for an agent"""
        return db.query(AgentSession).filter(
            AgentSession.agent_id == agent_id,
            AgentSession.status == 'active'
        ).count()
