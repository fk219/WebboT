# LangGraph Agent System - Setup Instructions

## Step 1: Install Frontend Dependencies

Run this command in your terminal:

```bash
npm install
```

This will install the new dependencies we added:
- @tanstack/react-query (for data fetching)
- @ricky0123/vad-react & @ricky0123/vad-web (for voice activity detection)
- zustand (for state management)
- class-variance-authority, clsx, tailwind-merge (for styling utilities)

## Step 2: Add Environment Variables

Create a `.env.local` file in your project root:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## Step 3: What We've Implemented So Far

### Frontend (React)
✅ Type definitions for agents and knowledge bases
✅ Agent service (API calls)
✅ React hooks (useAgents, useVoiceRecording, useWebSocket)
✅ Agent List Page with beautiful cards
✅ Agent Card component

### File Structure Created
```
src/
├── types/
│   ├── agent.ts
│   └── knowledgeBase.ts
├── services/
│   └── agentService.ts
├── hooks/
│   ├── useAgents.ts
│   ├── useVoiceRecording.ts
│   └── useWebSocket.ts
├── pages/
│   └── AgentListPage.tsx
└── components/
    └── agents/
        └── AgentCard.tsx
```

## Step 4: Next Steps

To continue the implementation, I need to:

1. **Update App.tsx** to add React Query Provider and new routes
2. **Create Agent Create/Edit Page** with full configuration
3. **Create Agent Preview Page** with text and voice testing
4. **Set up Backend** (Python FastAPI + LangGraph)

## Step 5: Test the Frontend

Once dependencies are installed, you can run:

```bash
npm run dev
```

Then navigate to `/agents` to see the agent list page (it will show empty state until backend is ready).

## Backend Setup (Coming Next)

The backend will be created in a `backend/` directory with:
- FastAPI server
- LangGraph workflows
- Voice processing (STT/TTS)
- Knowledge base integration
- WebSocket support

Would you like me to continue with:
A) Finishing the frontend pages
B) Setting up the backend
C) Both simultaneously

Let me know and I'll continue!
