"""
LangGraph workflow builder
Converts agent configuration into executable workflows
"""

from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from typing import Dict, Any
from .state import AgentState


class WorkflowBuilder:
    """Builds LangGraph workflows from agent configs"""
    
    def __init__(self, agent_config: Dict[str, Any]):
        self.config = agent_config
        self.graph = StateGraph(AgentState)
    
    def build(self):
        """Build complete workflow"""
        # Add nodes
        self.graph.add_node("process_input", self.process_input)
        
        # Conditional: Add knowledge retrieval if KBs attached
        if self.config.get("knowledge_base_ids"):
            self.graph.add_node("retrieve_knowledge", self.retrieve_knowledge)
        
        self.graph.add_node("llm_reasoning", self.llm_reasoning)
        self.graph.add_node("generate_response", self.generate_response)
        
        # Define edges
        self.graph.set_entry_point("process_input")
        
        if self.config.get("knowledge_base_ids"):
            self.graph.add_edge("process_input", "retrieve_knowledge")
            self.graph.add_edge("retrieve_knowledge", "llm_reasoning")
        else:
            self.graph.add_edge("process_input", "llm_reasoning")
        
        self.graph.add_edge("llm_reasoning", "generate_response")
        self.graph.add_edge("generate_response", END)
        
        return self.graph.compile()
    
    def process_input(self, state: AgentState) -> AgentState:
        """Process and normalize user input"""
        user_input = state["user_input"]
        
        # Add user message to history
        state["messages"].append(HumanMessage(content=user_input))
        
        return state
    
    def retrieve_knowledge(self, state: AgentState) -> AgentState:
        """Retrieve relevant knowledge from KBs"""
        # TODO: Implement actual knowledge retrieval
        # For now, just pass through
        state["context"]["knowledge"] = []
        return state
    
    def llm_reasoning(self, state: AgentState) -> AgentState:
        """Main LLM reasoning"""
        # Get LLM instance
        llm = self._get_llm()
        
        # Build messages
        system_prompt = self.config["system_prompt"]
        
        # Add knowledge context if available
        if state["context"].get("knowledge"):
            knowledge_text = "\n".join([
                f"- {chunk}" for chunk in state["context"]["knowledge"]
            ])
            system_prompt += f"\n\nRelevant Knowledge:\n{knowledge_text}"
        
        messages = [
            SystemMessage(content=system_prompt),
            *state["messages"]
        ]
        
        # Call LLM
        response = llm.invoke(messages)
        state["agent_response"] = response.content
        state["messages"].append(AIMessage(content=response.content))
        
        return state
    
    def generate_response(self, state: AgentState) -> AgentState:
        """Generate final response with post-processing"""
        response = state["agent_response"]
        
        # Apply PII redaction if enabled
        if self.config.get("pii_redaction_enabled"):
            response = self._redact_pii(response)
            state["agent_response"] = response
        
        return state
    
    def _get_llm(self):
        """Get configured LLM instance"""
        model = self.config["llm_model"]
        temperature = self.config.get("temperature", 0.7)
        max_tokens = self.config.get("max_tokens", 1000)
        
        if model.startswith("gpt"):
            return ChatOpenAI(
                model=model,
                temperature=temperature,
                max_tokens=max_tokens
            )
        elif model.startswith("claude"):
            return ChatAnthropic(
                model=model,
                temperature=temperature,
                max_tokens=max_tokens
            )
        elif model.startswith("gemini"):
            return ChatGoogleGenerativeAI(
                model=model,
                temperature=temperature,
                max_tokens=max_tokens
            )
        else:
            # Default to GPT-4o-mini
            return ChatOpenAI(
                model="gpt-4o-mini",
                temperature=temperature,
                max_tokens=max_tokens
            )
    
    def _redact_pii(self, text: str) -> str:
        """Redact PII from text"""
        import re
        
        pii_types = self.config.get("pii_redaction_list", [])
        
        if "ssn" in pii_types:
            text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN REDACTED]', text)
        if "credit_card" in pii_types:
            text = re.sub(
                r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
                '[CARD REDACTED]',
                text
            )
        if "phone_number" in pii_types:
            text = re.sub(
                r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
                '[PHONE REDACTED]',
                text
            )
        if "email" in pii_types:
            text = re.sub(
                r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                '[EMAIL REDACTED]',
                text
            )
        
        return text
