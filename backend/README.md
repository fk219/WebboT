# LangGraph Agent Backend

FastAPI + LangGraph backend for AI agent management.

## Quick Start

### 1. Install Dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set Environment Variables
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Initialize Database
```bash
python init_db.py
```

### 4. Run Server
```bash
python run.py
```

Server will start at `http://localhost:8000`

## API Endpoints

- `GET /api/agents` - List agents
- `POST /api/agents` - Create agent
- `GET /api/agents/{id}` - Get agent
- `PUT /api/agents/{id}` - Update agent
- `DELETE /api/agents/{id}` - Delete agent
- `POST /api/agents/{id}/publish` - Publish agent
- `POST /api/chat/{id}/message` - Send message
- `WS /ws/chat/{id}` - WebSocket chat
- `POST /api/voice/{id}/process` - Process voice

## Documentation

API docs available at `http://localhost:8000/docs`
