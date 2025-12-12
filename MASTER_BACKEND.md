# 🛠️ Master Backend Documentation

## Overview
This document consolidates all information regarding the backend implementation of the LangGraph Agent Platform. The backend is a high-performance FastAPI application that orchestrates AI agents using LangGraph, manages state in PostgreSQL, and handles real-time voice/text interactions.

---

## 🏗 Architecture

### Tech Stack
- **Framework**: FastAPI (Python 3.10+)
- **Agent Runtime**: LangGraph + LangChain
- **Database**: PostgreSQL (via Supabase)
- **ORM**: SQLAlchemy (Async)
- **Real-time**: WebSockets + LiveKit (SIP/WebRTC)
- **Voice**: Whisper (STT) + ElevenLabs (TTS)

### Directory Structure
```
backend/
├── app/
│   ├── api/               # API Route Handlers
│   │   ├── agents.py      # CRUD for agents
│   │   ├── chat.py        # Text chat & WebSockets
│   │   ├── sip.py         # SIP/Telephony endpoints
│   │   └── voice.py       # Voice processing
│   ├── langgraph/         # Agent Logic
│   │   ├── agent_runtime.py # Core execution engine
│   │   ├── state.py       # State definitions
│   │   └── workflow_builder.py # Dynamic graph builder
│   ├── models/            # SQLAlchemy Models
│   │   ├── agent.py
│   │   └── session.py
│   ├── schemas/           # Pydantic Schemas
│   ├── services/          # External Services
│   │   └── livekit_service.py
│   ├── workers/           # Background Workers
│   │   └── voice_agent.py # LiveKit Voice Agent
│   ├── config.py          # App Configuration
│   ├── database.py        # DB Connection
│   └── main.py            # Entry Point
├── requirements.txt
└── run.py
```

---

## ✨ Key Features

### 1. Agent Orchestration (LangGraph)
- **Dynamic Workflows**: Agents are built dynamically based on JSON configuration.
- **State Management**: Conversation history and context are persisted in Postgres.
- **LLM Support**: OpenAI, Anthropic, Google Gemini, DeepSeek.
- **Tool Use**: Support for MCP (Model Context Protocol) tools.

### 2. Voice & Telephony
- **SIP Integration**: Inbound/Outbound calls via LiveKit SIP Ingress/Egress.
- **Voice Agent Worker**: Dedicated worker (`VoiceAgent`) that joins LiveKit rooms to listen/speak.
- **Pipeline**: Audio -> VAD -> STT -> LangGraph -> TTS -> Audio.

### 3. API & Real-time
- **REST API**: Full CRUD for agents, sessions, and analytics.
- **WebSockets**: Real-time text chat with typing indicators.
- **Webhooks**: SIP call events and external integrations.

---

## 📡 API Endpoints

### Agent Management
- `GET /api/agents` - List agents
- `POST /api/agents` - Create agent
- `GET /api/agents/{id}` - Get details
- `PUT /api/agents/{id}` - Update
- `DELETE /api/agents/{id}` - Delete

### Chat & Voice
- `POST /api/chat/{agent_id}/message` - Send text message
- `WS /ws/chat/{agent_id}` - Real-time text chat
- `POST /api/sip/inbound` - Handle incoming SIP call
- `POST /api/sip/outbound` - Initiate outbound call

---

## 🚀 Setup & Run

1. **Install Dependencies**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Environment Variables** (`.env`)
   ```env
   DATABASE_URL=postgresql://user:pass@host:5432/db
   OPENAI_API_KEY=sk-...
   LIVEKIT_URL=wss://...
   LIVEKIT_API_KEY=...
   LIVEKIT_API_SECRET=...
   ```

3. **Run Server**
   ```bash
   python run.py
   # OR
   uvicorn app.main:app --reload
   ```

4. **API Documentation**
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

---

## 🐛 Known Limitations
- **Knowledge Base**: RAG implementation is currently a placeholder.
- **MCP Tools**: Framework is in place but specific tools need implementation.
- **Scaling**: `VoiceAgent` currently runs in the same process; for high scale, move to a separate worker fleet.

---

## 📚 Reference Documents (Consolidated)
- `BACKEND_COMPLETE.md`
- `LANGGRAPH_AGENT_IMPLEMENTATION_PLAN.md`
