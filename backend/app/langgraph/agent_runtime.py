"""
Agent runtime service
Loads and executes agents
"""

from typing import Dict, Optional, Any
from .workflow_builder import WorkflowBuilder
from ..models.agent import Agent as AgentModel
from sqlalchemy.orm import Session


class AgentRuntime:
    """Runtime for executing LangGraph agents"""
    
    def __init__(self):
        self.active_agents: Dict[str, Any] = {}
    
    async def load_agent(self, agent_id: str, db: Session):
        """Load and compile agent workflow"""
        # Check cache
        if agent_id in self.active_agents:
            return self.active_agents[agent_id]
        
        # Fetch from database
        agent = db.query(AgentModel).filter(AgentModel.id == agent_id).first()
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")
        
        # Build workflow
        builder = WorkflowBuilder(agent.config_json)
        workflow = builder.build()
        
        # Cache
        self.active_agents[agent_id] = {
            "workflow": workflow,
            "config": agent.config_json,
            "agent": agent
        }
        
        return self.active_agents[agent_id]
    
    async def execute_text(
        self,
        agent_id: str,
        user_input: str,
        session_id: str,
        db: Session,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Execute agent for text input with session management"""
        from ..services.session_service import SessionService
        from langchain_core.messages import HumanMessage, AIMessage
        
        # Get or create session
        session = SessionService.get_or_create_session(
            session_id=session_id,
            agent_id=agent_id,
            channel='text',
            db=db,
            metadata=metadata
        )
        
        # Load agent workflow
        agent_data = await self.load_agent(agent_id, db)
        workflow = agent_data["workflow"]
        
        # Rebuild conversation history from session
        messages = []
        for msg in (session.conversation_history or []):
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
        
        # Initialize state with session history
        initial_state = {
            "messages": messages,
            "user_input": user_input,
            "agent_response": "",
            "context": session.context_data or {},
            "metadata": metadata or {},
            "session_id": session_id,
            "channel": "text",
            "next_action": ""
        }
        
        # Execute workflow
        result = await workflow.ainvoke(initial_state)
        
        # Save messages to session history
        SessionService.add_message_to_history(
            session=session,
            role="user",
            content=user_input,
            db=db
        )
        SessionService.add_message_to_history(
            session=session,
            role="assistant",
            content=result["agent_response"],
            db=db
        )
        
        # Update session context
        session.context_data = result["context"]
        db.commit()
        
        return {
            "response": result["agent_response"],
            "metadata": result["metadata"]
        }
    
    def invalidate_cache(self, agent_id: str):
        """Invalidate cached agent"""
        if agent_id in self.active_agents:
            del self.active_agents[agent_id]


# Global runtime instance
runtime = AgentRuntime()
