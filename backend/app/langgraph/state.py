"""
LangGraph state definitions
"""

from typing import TypedDict, List, Dict, Any, Annotated
from langchain_core.messages import BaseMessage
import operator


class AgentState(TypedDict):
    """State that flows through the LangGraph workflow"""
    
    # Messages
    messages: Annotated[List[BaseMessage], operator.add]
    
    # Current input/output
    user_input: str
    agent_response: str
    
    # Context from knowledge base, tools, etc.
    context: Dict[str, Any]
    
    # Metadata
    metadata: Dict[str, Any]
    
    # Session info
    session_id: str
    channel: str  # 'text' or 'voice'
    
    # Control flow
    next_action: str  # 'respond', 'tools', 'knowledge', etc.
