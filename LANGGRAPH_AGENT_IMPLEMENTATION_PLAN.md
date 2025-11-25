# LangGraph Agent System - Complete Implementation Plan

## 🎯 Project Overview

Build a comprehensive agent management platform where users can:
- Create AI agents with rich configuration (LLM, voice, knowledge base, tools)
- Test agents in real-time (text + voice)
- Deploy agents to chat widget and voice calls
- Manage multiple agents with beautiful UI

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Voice Integration](#voice-integration)
7. [Testing & Deployment](#testing--deployment)
8. [Implementation Timeline](#implementation-timeline)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Agent List   │  │ Agent Create │  │ Live Preview │      │
│  │ Page         │  │ /Edit Page   │  │ (Text+Voice) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                    REST API + WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI + Python)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           LangGraph Agent Orchestrator                │   │
│  │  • Workflow Builder  • State Management               │   │
│  │  • Tool Execution    • Memory Management              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Knowledge    │  │ Voice        │  │ MCP Tool     │      │
│  │ Base (RAG)   │  │ Pipeline     │  │ Integration  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  • LLM APIs (OpenAI, Anthropic, Google)                     │
│  • STT (Whisper, Deepgram)                                  │
│  • TTS (ElevenLabs, OpenAI)                                 │
│  • Vector DB (Pinecone, Weaviate)                           │
│  • SIP Provider (Twilio)                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** + **shadcn/ui** (current theme)
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Zustand** for state management
- **WebSocket** for real-time communication
- **Web Audio API** for voice recording
- **@ricky0123/vad-web** for Voice Activity Detection

### Backend
- **FastAPI** (Python 3.11+)
- **LangGraph** for agent orchestration
- **LangChain** for LLM integrations
- **Pydantic** for data validation
- **SQLAlchemy** for ORM
- **Alembic** for migrations
- **Redis** for caching & sessions
- **Celery** for background tasks

### Database & Storage
- **PostgreSQL** (Supabase) for structured data
- **Pinecone/Weaviate** for vector storage
- **S3/Supabase Storage** for audio files

### Voice & Audio
- **OpenAI Whisper API** for STT
- **ElevenLabs API** for TTS
- **Deepgram** (alternative STT)
- **Twilio** for SIP/phone calls
- **WebRTC** for browser audio

### DevOps
- **Docker** for containerization
- **GitHub Actions** for CI/CD
- **Vercel/Railway** for deployment

---


## 📊 Database Schema

### Tables

#### 1. `agents`
```sql
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- LLM Configuration
    llm_provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'google'
    llm_model VARCHAR(100) NOT NULL,
    system_prompt TEXT NOT NULL,
    temperature FLOAT DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    
    -- Voice Configuration
    voice_provider VARCHAR(50), -- 'elevenlabs', 'openai', 'cartesia'
    voice_id VARCHAR(255),
    voice_model VARCHAR(100),
    voice_speed FLOAT DEFAULT 1.0,
    voice_temperature FLOAT DEFAULT 1.0,
    voice_volume FLOAT DEFAULT 1.0,
    
    -- Speech Processing
    responsiveness FLOAT DEFAULT 1.0,
    interruption_sensitivity FLOAT DEFAULT 1.0,
    enable_backchannel BOOLEAN DEFAULT true,
    backchannel_words JSONB DEFAULT '["mm-hmm", "yeah", "uh-huh"]',
    normalize_speech BOOLEAN DEFAULT true,
    boosted_keywords JSONB DEFAULT '[]',
    
    -- Ambient & Environment
    ambient_sound VARCHAR(50) DEFAULT 'none',
    ambient_volume FLOAT DEFAULT 0.5,
    
    -- Call Settings
    max_duration_seconds INTEGER DEFAULT 1800,
    end_after_silence_seconds INTEGER DEFAULT 600,
    voicemail_detection BOOLEAN DEFAULT false,
    voicemail_action VARCHAR(20) DEFAULT 'hangup',
    voicemail_message TEXT,
    
    -- Transcription
    stt_provider VARCHAR(50) DEFAULT 'whisper',
    stt_mode VARCHAR(20) DEFAULT 'fast',
    denoising_mode VARCHAR(50) DEFAULT 'noise-cancellation',
    
    -- Security & Privacy
    pii_redaction_enabled BOOLEAN DEFAULT false,
    pii_redaction_list JSONB DEFAULT '[]',
    data_storage_policy VARCHAR(50) DEFAULT 'everything',
    
    -- Integration
    webhook_url TEXT,
    webhook_timeout_ms INTEGER DEFAULT 5000,
    custom_headers JSONB DEFAULT '{}',
    
    -- MCP Tools
    enabled_mcp_servers JSONB DEFAULT '[]',
    
    -- Status
    is_published BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    
    -- Full config backup
    config_json JSONB NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT agents_org_name_unique UNIQUE(organization_id, name)
);

CREATE INDEX idx_agents_org ON agents(organization_id);
CREATE INDEX idx_agents_published ON agents(is_published);
```

#### 2. `knowledge_bases`
```sql
CREATE TABLE knowledge_bases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Vector DB Configuration
    vector_db_provider VARCHAR(50) NOT NULL, -- 'pinecone', 'weaviate', 'qdrant'
    vector_db_index_name VARCHAR(255) NOT NULL,
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',
    
    -- Retrieval Settings
    chunk_size INTEGER DEFAULT 1000,
    chunk_overlap INTEGER DEFAULT 200,
    max_chunks INTEGER DEFAULT 5,
    similarity_threshold FLOAT DEFAULT 0.7,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'processing', 'error'
    document_count INTEGER DEFAULT 0,
    total_chunks INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT kb_org_name_unique UNIQUE(organization_id, name)
);

CREATE INDEX idx_kb_org ON knowledge_bases(organization_id);
```

#### 3. `agent_knowledge_bases` (Many-to-Many)
```sql
CREATE TABLE agent_knowledge_bases (
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    knowledge_base_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    
    PRIMARY KEY (agent_id, knowledge_base_id)
);
```

#### 4. `kb_documents`
```sql
CREATE TABLE kb_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    -- Processing
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error'
    chunk_count INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- Metadata
    uploaded_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

CREATE INDEX idx_kb_docs_kb ON kb_documents(knowledge_base_id);
```

#### 5. `agent_sessions`
```sql
CREATE TABLE agent_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id),
    session_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Channel
    channel VARCHAR(50) NOT NULL, -- 'text', 'voice', 'phone'
    
    -- Call Info (for voice)
    call_id VARCHAR(255),
    phone_number VARCHAR(50),
    
    -- Session Data
    message_count INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'ended'
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

CREATE INDEX idx_sessions_agent ON agent_sessions(agent_id);
CREATE INDEX idx_sessions_session_id ON agent_sessions(session_id);
```

#### 6. `agent_messages`
```sql
CREATE TABLE agent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    
    -- Message
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    
    -- Audio (for voice)
    audio_url TEXT,
    audio_duration_ms INTEGER,
    
    -- Metadata
    tokens_used INTEGER,
    latency_ms INTEGER,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_session ON agent_messages(session_id);
```

#### 7. `agent_analytics`
```sql
CREATE TABLE agent_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id),
    date DATE NOT NULL,
    
    -- Usage Metrics
    total_sessions INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    text_sessions INTEGER DEFAULT 0,
    voice_sessions INTEGER DEFAULT 0,
    
    -- Performance
    avg_response_time_ms INTEGER,
    avg_session_duration_seconds INTEGER,
    
    -- Costs
    total_tokens_used BIGINT DEFAULT 0,
    estimated_cost_usd DECIMAL(10, 4) DEFAULT 0,
    
    CONSTRAINT analytics_agent_date_unique UNIQUE(agent_id, date)
);

CREATE INDEX idx_analytics_agent_date ON agent_analytics(agent_id, date);
```

---


## 🔧 Backend Implementation

### Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app entry
│   ├── config.py                    # Configuration
│   ├── database.py                  # Database connection
│   │
│   ├── api/                         # API routes
│   │   ├── __init__.py
│   │   ├── agents.py                # Agent CRUD endpoints
│   │   ├── knowledge_bases.py       # KB management
│   │   ├── chat.py                  # Text chat endpoints
│   │   ├── voice.py                 # Voice endpoints
│   │   └── websocket.py             # WebSocket handlers
│   │
│   ├── models/                      # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── agent.py
│   │   ├── knowledge_base.py
│   │   ├── session.py
│   │   └── analytics.py
│   │
│   ├── schemas/                     # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── agent.py
│   │   ├── knowledge_base.py
│   │   └── message.py
│   │
│   ├── services/                    # Business logic
│   │   ├── __init__.py
│   │   ├── agent_service.py         # Agent CRUD logic
│   │   ├── kb_service.py            # KB management
│   │   └── analytics_service.py     # Analytics
│   │
│   ├── langgraph/                   # LangGraph orchestration
│   │   ├── __init__.py
│   │   ├── workflow_builder.py      # Build workflows from config
│   │   ├── agent_runtime.py         # Execute agents
│   │   ├── state.py                 # State definitions
│   │   ├── nodes.py                 # Workflow nodes
│   │   └── tools.py                 # Custom tools
│   │
│   ├── voice/                       # Voice processing
│   │   ├── __init__.py
│   │   ├── stt.py                   # Speech-to-text
│   │   ├── tts.py                   # Text-to-speech
│   │   ├── vad.py                   # Voice activity detection
│   │   └── audio_utils.py           # Audio processing
│   │
│   ├── knowledge/                   # Knowledge base
│   │   ├── __init__.py
│   │   ├── embeddings.py            # Generate embeddings
│   │   ├── vector_store.py          # Vector DB operations
│   │   ├── chunking.py              # Document chunking
│   │   └── retriever.py             # RAG retrieval
│   │
│   ├── mcp/                         # MCP integration
│   │   ├── __init__.py
│   │   ├── client.py                # MCP client
│   │   └── executor.py              # Tool execution
│   │
│   └── utils/                       # Utilities
│       ├── __init__.py
│       ├── pii_redaction.py         # PII handling
│       ├── audio_processing.py      # Audio utilities
│       └── validators.py            # Input validation
│
├── alembic/                         # Database migrations
│   ├── versions/
│   └── env.py
│
├── tests/                           # Tests
│   ├── test_agents.py
│   ├── test_langgraph.py
│   └── test_voice.py
│
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

### Key Backend Files

#### 1. `app/langgraph/workflow_builder.py`
```python
"""
Build LangGraph workflows dynamically from agent configuration.
This is the CORE of the system - converts UI config into executable workflow.
"""

from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from typing import Dict, Any
from .state import AgentState
from .nodes import (
    InputProcessorNode,
    KnowledgeRetrievalNode,
    LLMReasoningNode,
    ToolExecutionNode,
    ResponseGeneratorNode,
    PostProcessingNode
)

class WorkflowBuilder:
    """Builds LangGraph workflows from agent configs"""
    
    def __init__(self, agent_config: Dict[str, Any]):
        self.config = agent_config
        self.graph = StateGraph(AgentState)
    
    def build(self):
        """Build complete workflow"""
        # Add all nodes
        self._add_nodes()
        
        # Define edges based on config
        self._define_edges()
        
        # Compile and return
        return self.graph.compile()
    
    def _add_nodes(self):
        """Add workflow nodes"""
        self.graph.add_node("input_processor", InputProcessorNode(self.config))
        
        # Conditional: Add KB retrieval if KBs are attached
        if self.config.get("knowledge_base_ids"):
            self.graph.add_node("knowledge_retrieval", KnowledgeRetrievalNode(self.config))
        
        self.graph.add_node("llm_reasoning", LLMReasoningNode(self.config))
        
        # Conditional: Add tool execution if MCP servers enabled
        if self.config.get("enabled_mcp_servers"):
            self.graph.add_node("tool_execution", ToolExecutionNode(self.config))
        
        self.graph.add_node("response_generator", ResponseGeneratorNode(self.config))
        self.graph.add_node("post_processing", PostProcessingNode(self.config))
    
    def _define_edges(self):
        """Define workflow edges"""
        self.graph.set_entry_point("input_processor")
        
        # Route after input processing
        if self.config.get("knowledge_base_ids"):
            self.graph.add_edge("input_processor", "knowledge_retrieval")
            self.graph.add_edge("knowledge_retrieval", "llm_reasoning")
        else:
            self.graph.add_edge("input_processor", "llm_reasoning")
        
        # Conditional tool execution
        if self.config.get("enabled_mcp_servers"):
            self.graph.add_conditional_edges(
                "llm_reasoning",
                self._needs_tools,
                {
                    "tools": "tool_execution",
                    "respond": "response_generator"
                }
            )
            self.graph.add_edge("tool_execution", "llm_reasoning")
        else:
            self.graph.add_edge("llm_reasoning", "response_generator")
        
        self.graph.add_edge("response_generator", "post_processing")
        self.graph.add_edge("post_processing", END)
    
    def _needs_tools(self, state: AgentState) -> str:
        """Check if tool execution needed"""
        return state.get("next_action", "respond")
```

#### 2. `app/langgraph/agent_runtime.py`
```python
"""
Agent runtime - loads and executes agents.
Manages agent lifecycle and caching.
"""

from typing import Dict, Optional
import asyncio
from .workflow_builder import WorkflowBuilder
from ..services.agent_service import AgentService
from ..models.agent import Agent

class AgentRuntime:
    """Runtime for executing LangGraph agents"""
    
    def __init__(self):
        self.active_agents: Dict[str, Any] = {}
        self.agent_service = AgentService()
    
    async def load_agent(self, agent_id: str):
        """Load and compile agent workflow"""
        # Check cache
        if agent_id in self.active_agents:
            return self.active_agents[agent_id]
        
        # Fetch from database
        agent = await self.agent_service.get_agent(agent_id)
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
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Execute agent for text input"""
        agent_data = await self.load_agent(agent_id)
        workflow = agent_data["workflow"]
        
        # Initialize state
        state = {
            "messages": [],
            "user_input": user_input,
            "agent_response": "",
            "context": {},
            "metadata": metadata or {},
            "session_id": session_id,
            "channel": "text"
        }
        
        # Execute
        result = await workflow.ainvoke(state)
        
        return {
            "response": result["agent_response"],
            "metadata": result["metadata"]
        }
    
    async def execute_voice(
        self,
        agent_id: str,
        audio_bytes: bytes,
        session_id: str,
        metadata: Optional[Dict] = None
    ) -> bytes:
        """Execute agent for voice input"""
        from ..voice.stt import speech_to_text
        from ..voice.tts import text_to_speech
        
        agent_data = await self.load_agent(agent_id)
        workflow = agent_data["workflow"]
        config = agent_data["config"]
        
        # 1. STT: Audio -> Text
        user_text = await speech_to_text(audio_bytes, config)
        
        # 2. Execute workflow (same as text!)
        state = {
            "messages": [],
            "user_input": user_text,
            "agent_response": "",
            "context": {},
            "metadata": metadata or {},
            "session_id": session_id,
            "channel": "voice"
        }
        
        result = await workflow.ainvoke(state)
        
        # 3. TTS: Text -> Audio
        audio_response = await text_to_speech(
            result["agent_response"],
            config
        )
        
        return audio_response
    
    def invalidate_cache(self, agent_id: str):
        """Invalidate cached agent (after config update)"""
        if agent_id in self.active_agents:
            del self.active_agents[agent_id]

# Global runtime instance
runtime = AgentRuntime()
```

#### 3. `app/api/agents.py`
```python
"""
Agent CRUD API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..schemas.agent import AgentCreate, AgentUpdate, AgentResponse
from ..services.agent_service import AgentService
from ..langgraph.agent_runtime import runtime

router = APIRouter(prefix="/api/agents", tags=["agents"])

@router.get("/", response_model=List[AgentResponse])
async def list_agents(
    organization_id: str,
    service: AgentService = Depends()
):
    """List all agents for organization"""
    return await service.list_agents(organization_id)

@router.post("/", response_model=AgentResponse)
async def create_agent(
    agent: AgentCreate,
    service: AgentService = Depends()
):
    """Create new agent"""
    created = await service.create_agent(agent)
    return created

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    service: AgentService = Depends()
):
    """Get agent by ID"""
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return agent

@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    agent: AgentUpdate,
    service: AgentService = Depends()
):
    """Update agent"""
    updated = await service.update_agent(agent_id, agent)
    
    # Invalidate runtime cache
    runtime.invalidate_cache(agent_id)
    
    return updated

@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: str,
    service: AgentService = Depends()
):
    """Delete agent"""
    await service.delete_agent(agent_id)
    runtime.invalidate_cache(agent_id)
    return {"message": "Agent deleted"}

@router.post("/{agent_id}/publish")
async def publish_agent(
    agent_id: str,
    service: AgentService = Depends()
):
    """Publish agent (make it live)"""
    agent = await service.publish_agent(agent_id)
    runtime.invalidate_cache(agent_id)
    return agent
```

---


#### 4. `app/api/chat.py`
```python
"""
Text chat API endpoints
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..langgraph.agent_runtime import runtime
from ..services.session_service import SessionService
import json

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("/{agent_id}/message")
async def send_message(
    agent_id: str,
    message: str,
    session_id: str
):
    """Send text message to agent"""
    result = await runtime.execute_text(
        agent_id=agent_id,
        user_input=message,
        session_id=session_id
    )
    
    # Save to database
    session_service = SessionService()
    await session_service.save_message(
        session_id=session_id,
        role="user",
        content=message
    )
    await session_service.save_message(
        session_id=session_id,
        role="assistant",
        content=result["response"]
    )
    
    return result

@router.websocket("/{agent_id}/ws")
async def websocket_chat(websocket: WebSocket, agent_id: str):
    """WebSocket for real-time chat"""
    await websocket.accept()
    session_id = None
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_json()
            message = data.get("message")
            session_id = data.get("session_id")
            
            if not session_id:
                await websocket.send_json({
                    "error": "session_id required"
                })
                continue
            
            # Execute agent
            result = await runtime.execute_text(
                agent_id=agent_id,
                user_input=message,
                session_id=session_id
            )
            
            # Send response
            await websocket.send_json({
                "type": "message",
                "content": result["response"],
                "metadata": result["metadata"]
            })
    
    except WebSocketDisconnect:
        print(f"Client disconnected: {session_id}")
```

#### 5. `app/voice/stt.py`
```python
"""
Speech-to-Text implementation
"""

import openai
from typing import Dict, Any
import io

async def speech_to_text(
    audio_bytes: bytes,
    config: Dict[str, Any]
) -> str:
    """Convert speech to text using configured STT provider"""
    
    provider = config.get("stt_provider", "whisper")
    
    if provider == "whisper":
        return await whisper_stt(audio_bytes, config)
    elif provider == "deepgram":
        return await deepgram_stt(audio_bytes, config)
    else:
        raise ValueError(f"Unknown STT provider: {provider}")

async def whisper_stt(audio_bytes: bytes, config: Dict) -> str:
    """OpenAI Whisper STT"""
    
    # Create file-like object
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "audio.wav"
    
    # Transcribe
    response = await openai.Audio.atranscribe(
        model="whisper-1",
        file=audio_file,
        language=config.get("language", "en")[:2]  # 'en-US' -> 'en'
    )
    
    return response["text"]

async def deepgram_stt(audio_bytes: bytes, config: Dict) -> str:
    """Deepgram STT (alternative)"""
    from deepgram import Deepgram
    
    dg_client = Deepgram(os.getenv("DEEPGRAM_API_KEY"))
    
    source = {"buffer": audio_bytes, "mimetype": "audio/wav"}
    
    response = await dg_client.transcription.prerecorded(
        source,
        {
            "punctuate": True,
            "language": config.get("language", "en-US"),
            "model": "nova-2"
        }
    )
    
    transcript = response["results"]["channels"][0]["alternatives"][0]["transcript"]
    return transcript
```

#### 6. `app/voice/tts.py`
```python
"""
Text-to-Speech implementation
"""

from elevenlabs import generate, set_api_key
import openai
from typing import Dict, Any
import os

set_api_key(os.getenv("ELEVENLABS_API_KEY"))

async def text_to_speech(
    text: str,
    config: Dict[str, Any]
) -> bytes:
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
    
    return audio

async def openai_tts(text: str, config: Dict) -> bytes:
    """OpenAI TTS"""
    
    voice = config.get("voice_id", "alloy")
    model = config.get("voice_model", "tts-1")
    
    response = await openai.Audio.speech.create(
        model=model,
        voice=voice,
        input=text,
        speed=config.get("voice_speed", 1.0)
    )
    
    return response.content
```

#### 7. `app/knowledge/retriever.py`
```python
"""
Knowledge base retrieval (RAG)
"""

from typing import List, Dict, Any
from .vector_store import VectorStore
from langchain.embeddings import OpenAIEmbeddings

class KnowledgeRetriever:
    """Retrieve relevant knowledge from vector DB"""
    
    def __init__(
        self,
        kb_ids: List[str],
        max_chunks: int = 5,
        similarity_threshold: float = 0.7
    ):
        self.kb_ids = kb_ids
        self.max_chunks = max_chunks
        self.similarity_threshold = similarity_threshold
        self.embeddings = OpenAIEmbeddings()
        self.vector_store = VectorStore()
    
    async def retrieve(self, query: str) -> List[Dict[str, Any]]:
        """Retrieve relevant chunks for query"""
        
        # Generate query embedding
        query_embedding = await self.embeddings.aembed_query(query)
        
        # Search across all KBs
        results = []
        for kb_id in self.kb_ids:
            kb_results = await self.vector_store.search(
                kb_id=kb_id,
                query_embedding=query_embedding,
                top_k=self.max_chunks,
                threshold=self.similarity_threshold
            )
            results.extend(kb_results)
        
        # Sort by score and limit
        results.sort(key=lambda x: x["score"], reverse=True)
        results = results[:self.max_chunks]
        
        return results
```

---


## 🎨 Frontend Implementation

### Project Structure

```
frontend/src/
├── pages/
│   ├── Agents/
│   │   ├── AgentListPage.tsx          # Main agents page with cards
│   │   ├── AgentCreatePage.tsx        # Create/Edit agent
│   │   └── AgentPreviewPage.tsx       # Live testing page
│   │
│   └── KnowledgeBase/
│       ├── KnowledgeBaseListPage.tsx
│       └── KnowledgeBaseCreatePage.tsx
│
├── components/
│   ├── agents/
│   │   ├── AgentCard.tsx              # Agent card component
│   │   ├── AgentForm.tsx              # Agent configuration form
│   │   ├── AgentPreview.tsx           # Live preview component
│   │   │
│   │   ├── config/                    # Configuration sections
│   │   │   ├── BasicConfig.tsx
│   │   │   ├── LLMConfig.tsx
│   │   │   ├── VoiceConfig.tsx
│   │   │   ├── SpeechConfig.tsx
│   │   │   ├── KnowledgeBaseConfig.tsx
│   │   │   ├── ToolsConfig.tsx
│   │   │   └── SecurityConfig.tsx
│   │   │
│   │   └── preview/                   # Preview components
│   │       ├── TextPreview.tsx        # Text chat preview
│   │       ├── VoicePreview.tsx       # Voice test preview
│   │       └── PerformanceMetrics.tsx # Real-time metrics
│   │
│   ├── knowledge-base/
│   │   ├── KBCard.tsx
│   │   ├── KBForm.tsx
│   │   └── DocumentUploader.tsx
│   │
│   └── ui/                            # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── tabs.tsx
│       └── ...
│
├── hooks/
│   ├── useAgents.ts                   # Agent CRUD hooks
│   ├── useAgentPreview.ts             # Preview hooks
│   ├── useVoiceRecording.ts           # Voice recording
│   ├── useWebSocket.ts                # WebSocket connection
│   └── useKnowledgeBase.ts            # KB hooks
│
├── services/
│   ├── api.ts                         # API client
│   ├── agentService.ts                # Agent API calls
│   ├── kbService.ts                   # KB API calls
│   └── voiceService.ts                # Voice processing
│
├── stores/
│   ├── agentStore.ts                  # Agent state (Zustand)
│   └── previewStore.ts                # Preview state
│
├── types/
│   ├── agent.ts                       # Agent types
│   ├── knowledgeBase.ts               # KB types
│   └── message.ts                     # Message types
│
└── utils/
    ├── audioUtils.ts                  # Audio processing
    ├── vadUtils.ts                    # VAD utilities
    └── validators.ts                  # Form validation
```

### Key Frontend Components

#### 1. `pages/Agents/AgentListPage.tsx`
```typescript
/**
 * Main agents page - displays all agents as cards
 * Features:
 * - Grid of agent cards
 * - Create new agent button
 * - Search and filter
 * - Quick actions (edit, delete, test)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AgentCard } from '@/components/agents/AgentCard';
import { useAgents } from '@/hooks/useAgents';

export default function AgentListPage() {
  const navigate = useNavigate();
  const { agents, isLoading, deleteAgent } = useAgents();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAgents = agents?.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground">
            Create and manage your LangGraph-powered agents
          </p>
        </div>
        <Button onClick={() => navigate('/agents/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Agent Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents?.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={() => navigate(`/agents/${agent.id}/edit`)}
              onDelete={() => deleteAgent(agent.id)}
              onTest={() => navigate(`/agents/${agent.id}/preview`)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAgents?.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No agents found</h3>
          <p className="text-muted-foreground mt-2">
            Create your first agent to get started
          </p>
          <Button
            onClick={() => navigate('/agents/create')}
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
      )}
    </div>
  );
}
```

#### 2. `components/agents/AgentCard.tsx`
```typescript
/**
 * Agent card component - displays agent info with actions
 */

import { Bot, Edit, Trash2, Play, Phone, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Agent } from '@/types/agent';

interface AgentCardProps {
  agent: Agent;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
}

export function AgentCard({ agent, onEdit, onDelete, onTest }: AgentCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{agent.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {agent.description || 'No description'}
              </p>
            </div>
          </div>
          <Badge variant={agent.is_published ? 'default' : 'secondary'}>
            {agent.is_published ? 'Live' : 'Draft'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Agent Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Model:</span>
            <span className="font-medium">{agent.llm_model}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Voice:</span>
            <span className="font-medium">
              {agent.voice_provider || 'Not configured'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Knowledge Bases:</span>
            <span className="font-medium">
              {agent.knowledge_base_ids?.length || 0}
            </span>
          </div>
        </div>

        {/* Channels */}
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            <MessageSquare className="h-3 w-3 mr-1" />
            Text
          </Badge>
          {agent.voice_provider && (
            <Badge variant="outline" className="text-xs">
              <Phone className="h-3 w-3 mr-1" />
              Voice
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onTest}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-1" />
            Test
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 3. `pages/Agents/AgentCreatePage.tsx`
```typescript
/**
 * Agent create/edit page
 * Features:
 * - Comprehensive configuration form
 * - Real-time validation
 * - Auto-save drafts
 * - Preview mode
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAgent, useCreateAgent, useUpdateAgent } from '@/hooks/useAgents';

// Configuration components
import { BasicConfig } from '@/components/agents/config/BasicConfig';
import { LLMConfig } from '@/components/agents/config/LLMConfig';
import { VoiceConfig } from '@/components/agents/config/VoiceConfig';
import { SpeechConfig } from '@/components/agents/config/SpeechConfig';
import { KnowledgeBaseConfig } from '@/components/agents/config/KnowledgeBaseConfig';
import { ToolsConfig } from '@/components/agents/config/ToolsConfig';
import { SecurityConfig } from '@/components/agents/config/SecurityConfig';

export default function AgentCreatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  // Fetch existing agent if editing
  const { data: existingAgent } = useAgent(id);
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();

  // Form state
  const [config, setConfig] = useState({
    name: '',
    description: '',
    llm_provider: 'openai',
    llm_model: 'gpt-4o-mini',
    system_prompt: '',
    temperature: 0.7,
    max_tokens: 1000,
    voice_provider: 'elevenlabs',
    voice_id: '',
    knowledge_base_ids: [],
    enabled_mcp_servers: [],
    // ... all other config fields
  });

  // Load existing agent data
  useEffect(() => {
    if (existingAgent) {
      setConfig(existingAgent.config_json);
    }
  }, [existingAgent]);

  const handleSave = async () => {
    try {
      if (isEditing) {
        await updateAgent.mutateAsync({ id, config });
        toast({ title: 'Agent updated successfully' });
      } else {
        const created = await createAgent.mutateAsync(config);
        toast({ title: 'Agent created successfully' });
        navigate(`/agents/${created.id}/edit`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/agents')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Edit Agent' : 'Create Agent'}
            </h1>
            <p className="text-muted-foreground">
              Configure your LangGraph-powered AI agent
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/agents/${id}/preview`)}
            disabled={!isEditing}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Configuration Tabs */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="llm">LLM</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="speech">Speech</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <BasicConfig config={config} onChange={setConfig} />
        </TabsContent>

        <TabsContent value="llm">
          <LLMConfig config={config} onChange={setConfig} />
        </TabsContent>

        <TabsContent value="voice">
          <VoiceConfig config={config} onChange={setConfig} />
        </TabsContent>

        <TabsContent value="speech">
          <SpeechConfig config={config} onChange={setConfig} />
        </TabsContent>

        <TabsContent value="knowledge">
          <KnowledgeBaseConfig config={config} onChange={setConfig} />
        </TabsContent>

        <TabsContent value="tools">
          <ToolsConfig config={config} onChange={setConfig} />
        </TabsContent>

        <TabsContent value="security">
          <SecurityConfig config={config} onChange={setConfig} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---


#### 4. `pages/Agents/AgentPreviewPage.tsx`
```typescript
/**
 * Live agent preview/testing page
 * Features:
 * - Text chat interface
 * - Voice recording and playback
 * - Real-time performance metrics
 * - Session management
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TextPreview } from '@/components/agents/preview/TextPreview';
import { VoicePreview } from '@/components/agents/preview/VoicePreview';
import { PerformanceMetrics } from '@/components/agents/preview/PerformanceMetrics';
import { useAgent } from '@/hooks/useAgents';

export default function AgentPreviewPage() {
  const { id } = useParams();
  const { data: agent } = useAgent(id);
  const [sessionId] = useState(() => `session_${Date.now()}`);

  if (!agent) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Main Preview Area */}
        <div className="col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{agent.name}</h1>
            <p className="text-muted-foreground">Live Preview & Testing</p>
          </div>

          <Tabs defaultValue="text" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Text Chat</TabsTrigger>
              <TabsTrigger value="voice">Voice Test</TabsTrigger>
            </TabsList>

            <TabsContent value="text">
              <TextPreview agentId={id} sessionId={sessionId} />
            </TabsContent>

            <TabsContent value="voice">
              <VoicePreview agentId={id} sessionId={sessionId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Metrics Sidebar */}
        <div className="col-span-1">
          <PerformanceMetrics agentId={id} sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}
```

#### 5. `components/agents/preview/TextPreview.tsx`
```typescript
/**
 * Text chat preview component
 */

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function TextPreview({ agentId, sessionId }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket connection
  const { sendMessage, lastMessage } = useWebSocket(
    `ws://localhost:8000/api/chat/${agentId}/ws`
  );

  // Handle incoming messages
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === 'message') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.content,
          timestamp: new Date()
        }]);
        setIsLoading(false);
      }
    }
  }, [lastMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      role: 'user' as const,
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to agent
    sendMessage(JSON.stringify({
      message: input,
      session_id: sessionId
    }));

    setInput('');
    setIsLoading(true);
  };

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

#### 6. `components/agents/preview/VoicePreview.tsx`
```typescript
/**
 * Voice preview component with recording and playback
 */

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useToast } from '@/hooks/use-toast';

export function VoicePreview({ agentId, sessionId }) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const {
    startRecording,
    stopRecording,
    audioBlob,
    isSupported
  } = useVoiceRecording();

  // Handle recording
  const handleStartRecording = async () => {
    try {
      await startRecording();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start recording',
        variant: 'destructive'
      });
    }
  };

  const handleStopRecording = async () => {
    stopRecording();
    setIsRecording(false);
  };

  // Send audio to agent when recording stops
  useEffect(() => {
    if (audioBlob) {
      sendAudioToAgent(audioBlob);
    }
  }, [audioBlob]);

  const sendAudioToAgent = async (blob: Blob) => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.wav');
      formData.append('session_id', sessionId);

      const response = await fetch(
        `http://localhost:8000/api/voice/${agentId}/process`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) throw new Error('Failed to process audio');

      // Get audio response
      const audioResponseBlob = await response.blob();
      const url = URL.createObjectURL(audioResponseBlob);
      setAudioUrl(url);

      // Auto-play response
      const audio = new Audio(url);
      audio.play();

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process voice input',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          Voice recording is not supported in your browser
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      {/* Recording Controls */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Button
            size="lg"
            variant={isRecording ? 'destructive' : 'default'}
            className="h-24 w-24 rounded-full"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isProcessing}
          >
            {isRecording ? (
              <Square className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
          
          {isRecording && (
            <div className="absolute inset-0 rounded-full border-4 border-destructive animate-ping" />
          )}
        </div>

        <div className="text-center">
          <p className="font-medium">
            {isRecording
              ? 'Recording... Click to stop'
              : isProcessing
              ? 'Processing...'
              : 'Click to start recording'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Speak naturally, the agent will respond with voice
          </p>
        </div>
      </div>

      {/* Audio Playback */}
      {audioUrl && (
        <div className="border-t pt-4">
          <div className="flex items-center space-x-3">
            <Volume2 className="h-5 w-5 text-muted-foreground" />
            <audio src={audioUrl} controls className="flex-1" />
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm">
        <h4 className="font-medium mb-2">Voice Testing Tips:</h4>
        <ul className="space-y-1 text-muted-foreground">
          <li>• Speak clearly and at a normal pace</li>
          <li>• Wait for the agent's response before speaking again</li>
          <li>• Test different scenarios and questions</li>
          <li>• Check voice quality and response accuracy</li>
        </ul>
      </div>
    </Card>
  );
}
```

#### 7. `hooks/useVoiceRecording.ts`
```typescript
/**
 * Voice recording hook with VAD (Voice Activity Detection)
 */

import { useState, useRef, useCallback } from 'react';
import { useMicVAD } from '@ricky0123/vad-react';

export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Check if browser supports recording
  const isSupported = typeof navigator !== 'undefined' && 
    !!navigator.mediaDevices?.getUserMedia;

  // VAD for automatic speech detection
  const vad = useMicVAD({
    onSpeechStart: () => {
      console.log('Speech started');
    },
    onSpeechEnd: (audio) => {
      console.log('Speech ended');
      // Could auto-stop recording here
    },
    startOnLoad: false
  });

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start VAD
      vad.start();

    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [vad]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      vad.pause();
    }
  }, [isRecording, vad]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    audioBlob,
    isSupported
  };
}
```

---


## 🎤 Voice Integration Details

### Voice Pipeline Architecture

```
User speaks → Browser captures audio → VAD detects speech
    ↓
Audio sent to backend (WebSocket or HTTP)
    ↓
STT: Audio → Text (Whisper/Deepgram)
    ↓
LangGraph Agent processes (same as text!)
    ↓
TTS: Text → Audio (ElevenLabs/OpenAI)
    ↓
Audio streamed back to browser
    ↓
Browser plays audio response
```

### Required Libraries

#### Backend (Python)
```txt
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
websockets==12.0
langgraph==0.0.40
langchain==0.1.0
langchain-openai==0.0.2
langchain-anthropic==0.0.1
openai==1.3.0
elevenlabs==0.2.24
deepgram-sdk==2.12.0
pydub==0.25.1
numpy==1.24.3
scipy==1.11.3
webrtcvad==2.0.10
pinecone-client==2.2.4
sqlalchemy==2.0.23
alembic==1.12.1
redis==5.0.1
celery==5.3.4
python-multipart==0.0.6
pydantic==2.5.0
pydantic-settings==2.1.0
```

#### Frontend (npm)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.12.0",
    "zustand": "^4.4.7",
    "@ricky0123/vad-react": "^0.0.15",
    "@ricky0123/vad-web": "^0.0.15",
    "wavesurfer.js": "^7.4.0",
    "socket.io-client": "^4.6.0"
  }
}
```

### VAD (Voice Activity Detection) Implementation

```typescript
// utils/vadUtils.ts

import { MicVAD } from '@ricky0123/vad-web';

export class VoiceActivityDetector {
  private vad: MicVAD | null = null;
  private onSpeechStart: () => void;
  private onSpeechEnd: (audio: Float32Array) => void;

  constructor(
    onSpeechStart: () => void,
    onSpeechEnd: (audio: Float32Array) => void
  ) {
    this.onSpeechStart = onSpeechStart;
    this.onSpeechEnd = onSpeechEnd;
  }

  async initialize() {
    this.vad = await MicVAD.new({
      onSpeechStart: () => {
        console.log('Speech detected');
        this.onSpeechStart();
      },
      onSpeechEnd: (audio) => {
        console.log('Speech ended');
        this.onSpeechEnd(audio);
      },
      onVADMisfire: () => {
        console.log('VAD misfire');
      },
      positiveSpeechThreshold: 0.8,
      negativeSpeechThreshold: 0.8 - 0.15,
      redemptionFrames: 8,
      preSpeechPadFrames: 1,
      minSpeechFrames: 3,
      submitUserSpeechOnPause: true
    });
  }

  start() {
    this.vad?.start();
  }

  pause() {
    this.vad?.pause();
  }

  destroy() {
    this.vad?.destroy();
  }
}
```

### Audio Processing Utilities

```typescript
// utils/audioUtils.ts

export class AudioProcessor {
  /**
   * Convert Float32Array to WAV blob
   */
  static float32ToWav(float32Array: Float32Array, sampleRate: number = 16000): Blob {
    const buffer = new ArrayBuffer(44 + float32Array.length * 2);
    const view = new DataView(buffer);

    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + float32Array.length * 2, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, float32Array.length * 2, true);

    // Audio data
    const offset = 44;
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  private static writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Resample audio to target sample rate
   */
  static resample(
    audioBuffer: AudioBuffer,
    targetSampleRate: number
  ): Float32Array {
    const offlineContext = new OfflineAudioContext(
      1,
      audioBuffer.duration * targetSampleRate,
      targetSampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);

    return offlineContext.startRendering().then(renderedBuffer => {
      return renderedBuffer.getChannelData(0);
    });
  }

  /**
   * Apply noise reduction
   */
  static applyNoiseReduction(audioData: Float32Array): Float32Array {
    // Simple noise gate
    const threshold = 0.01;
    return audioData.map(sample => 
      Math.abs(sample) < threshold ? 0 : sample
    );
  }
}
```

### WebSocket Handler for Real-time Voice

```python
# app/api/websocket.py

from fastapi import WebSocket, WebSocketDisconnect
from ..langgraph.agent_runtime import runtime
from ..voice.stt import speech_to_text
from ..voice.tts import text_to_speech
import asyncio
import json

class VoiceWebSocketHandler:
    """Handle real-time voice communication via WebSocket"""
    
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, agent_id: str, session_id: str):
        """Accept WebSocket connection"""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        
        try:
            await self.handle_voice_stream(websocket, agent_id, session_id)
        except WebSocketDisconnect:
            del self.active_connections[session_id]
    
    async def handle_voice_stream(
        self,
        websocket: WebSocket,
        agent_id: str,
        session_id: str
    ):
        """Handle streaming voice communication"""
        
        while True:
            # Receive audio chunk
            data = await websocket.receive_bytes()
            
            # Process in background to avoid blocking
            asyncio.create_task(
                self.process_audio_chunk(
                    data,
                    agent_id,
                    session_id,
                    websocket
                )
            )
    
    async def process_audio_chunk(
        self,
        audio_bytes: bytes,
        agent_id: str,
        session_id: str,
        websocket: WebSocket
    ):
        """Process single audio chunk"""
        
        try:
            # Load agent config
            agent_data = await runtime.load_agent(agent_id)
            config = agent_data["config"]
            
            # STT
            user_text = await speech_to_text(audio_bytes, config)
            
            # Send transcription to client
            await websocket.send_json({
                "type": "transcription",
                "text": user_text
            })
            
            # Execute agent
            result = await runtime.execute_text(
                agent_id=agent_id,
                user_input=user_text,
                session_id=session_id
            )
            
            # TTS
            audio_response = await text_to_speech(
                result["response"],
                config
            )
            
            # Send audio response
            await websocket.send_bytes(audio_response)
            
        except Exception as e:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })

# Router
from fastapi import APIRouter

router = APIRouter()
handler = VoiceWebSocketHandler()

@router.websocket("/ws/voice/{agent_id}/{session_id}")
async def voice_websocket(
    websocket: WebSocket,
    agent_id: str,
    session_id: str
):
    await handler.connect(websocket, agent_id, session_id)
```

---

## 📈 Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Set up project structure (backend + frontend)
- [ ] Database schema and migrations
- [ ] Basic FastAPI setup with CORS
- [ ] React app with routing
- [ ] Authentication integration (if needed)

### Phase 2: Core Agent System (Week 3-4)
- [ ] LangGraph workflow builder
- [ ] Agent runtime service
- [ ] Agent CRUD API endpoints
- [ ] Agent list page with cards
- [ ] Agent create/edit page
- [ ] Basic configuration forms

### Phase 3: Knowledge Base (Week 5)
- [ ] Vector DB integration (Pinecone/Weaviate)
- [ ] Document upload and processing
- [ ] Chunking and embedding
- [ ] RAG retrieval implementation
- [ ] KB management UI

### Phase 4: Text Chat (Week 6)
- [ ] WebSocket chat implementation
- [ ] Text preview component
- [ ] Message persistence
- [ ] Session management
- [ ] Chat history

### Phase 5: Voice Integration (Week 7-8)
- [ ] STT integration (Whisper)
- [ ] TTS integration (ElevenLabs)
- [ ] Voice recording component
- [ ] VAD implementation
- [ ] Audio processing utilities
- [ ] Voice preview component
- [ ] WebSocket voice streaming

### Phase 6: MCP Tools (Week 9)
- [ ] MCP client implementation
- [ ] Tool execution in workflow
- [ ] Tool configuration UI
- [ ] Tool testing

### Phase 7: Advanced Features (Week 10)
- [ ] PII redaction
- [ ] Post-call analysis
- [ ] Analytics dashboard
- [ ] Performance metrics
- [ ] Cost tracking

### Phase 8: Testing & Polish (Week 11-12)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance optimization
- [ ] UI/UX polish
- [ ] Documentation

### Phase 9: Deployment (Week 13)
- [ ] Docker setup
- [ ] CI/CD pipeline
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Load testing

---

## 🚀 Quick Start Commands

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start dev server
npm run dev
```

### Environment Variables

#### Backend `.env`
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/agents_db

# LLM APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Voice APIs
ELEVENLABS_API_KEY=...
DEEPGRAM_API_KEY=...

# Vector DB
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...

# Redis
REDIS_URL=redis://localhost:6379

# Twilio (for phone calls)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

#### Frontend `.env.local`
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## 📝 Key Implementation Notes

### 1. Agent Configuration Storage
- Store full config as JSONB for flexibility
- Also store commonly queried fields as columns for performance
- Version control for agent configs

### 2. LangGraph Workflow Caching
- Cache compiled workflows in memory
- Invalidate cache on agent update
- Use Redis for distributed caching in production

### 3. Voice Processing
- Use streaming for low latency
- Implement VAD for better UX
- Support multiple STT/TTS providers
- Handle audio format conversions

### 4. Knowledge Base
- Async document processing
- Chunking strategies based on document type
- Metadata filtering for better retrieval
- Hybrid search (vector + keyword)

### 5. Real-time Communication
- WebSocket for chat and voice
- Heartbeat for connection health
- Reconnection logic
- Message queuing for reliability

### 6. Security
- API key management
- Rate limiting
- Input validation
- PII redaction
- Secure audio storage

### 7. Performance
- Database indexing
- Query optimization
- Caching strategies
- Async processing
- Connection pooling

### 8. Monitoring
- Request logging
- Error tracking (Sentry)
- Performance metrics
- Cost tracking
- Usage analytics

---

## 🎯 Success Criteria

- [ ] Users can create agents with full configuration
- [ ] Agents work identically on text and voice channels
- [ ] Knowledge bases enhance agent responses
- [ ] MCP tools execute correctly
- [ ] Voice quality is clear and natural
- [ ] Response latency < 2 seconds for text
- [ ] Response latency < 3 seconds for voice
- [ ] System handles 100+ concurrent users
- [ ] All features have real working logic
- [ ] UI is beautiful and follows current theme
- [ ] Code is well-documented and maintainable

---

## 📚 Additional Resources

- [LangGraph Documentation](https://python.langchain.com/docs/langgraph)
- [LangChain Documentation](https://python.langchain.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [VAD Web Documentation](https://github.com/ricky0123/vad)
- [ElevenLabs API](https://elevenlabs.io/docs)
- [OpenAI Whisper](https://platform.openai.com/docs/guides/speech-to-text)

---

**This plan provides a complete roadmap for building your LangGraph-based agent system with full voice and text capabilities. All features will have real working logic, not just UI mockups.**
