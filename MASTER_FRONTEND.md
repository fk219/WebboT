# 🎨 Master Frontend Documentation

## Overview
This document consolidates all information regarding the frontend implementation of the LangGraph Agent Platform. The frontend is a modern, production-ready React application built with Vite, TypeScript, and Tailwind CSS.

---

## 🏗 Architecture

### Tech Stack
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Lucide React (Icons)
- **State Management**: React Query (TanStack Query)
- **Real-time**: Native WebSockets
- **Audio**: Native Browser Audio API (MediaRecorder/AudioContext)

### Directory Structure
```
src/
├── components/         # Reusable UI components
│   ├── agents/        # Agent-specific components (cards, config, preview)
│   ├── common/        # Generic components (buttons, inputs, modals)
│   └── layout/        # Layout components (Sidebar, Header)
├── hooks/             # Custom React hooks
│   ├── useAgents.ts   # Agent CRUD operations
│   ├── useLiveKitAudio.ts # LiveKit audio integration
│   └── useWebSocket.ts # Real-time chat
├── pages/             # Route components
│   ├── AgentListPage.tsx
│   ├── AgentCreatePage.tsx
│   ├── AgentPreviewPage.tsx
│   └── PhoneNumbersPage.tsx
├── services/          # API clients
│   ├── agentService.ts
│   ├── livekitService.ts
│   └── supabaseService.ts
├── types/             # TypeScript definitions
└── lib/               # Utilities (Supabase client, etc.)
```

---

## ✨ Key Features

### 1. Agent Management
- **Agent List**: Grid/List view with search, filtering, and status indicators.
- **Agent Builder**: Comprehensive 7-tab configuration wizard:
  - **Basic**: Identity and description.
  - **LLM**: Model selection (OpenAI, Anthropic, etc.) and system prompts.
  - **Voice**: TTS provider (ElevenLabs, OpenAI), voice selection, speed/pitch.
  - **Speech**: VAD settings, interruption sensitivity, backchanneling.
  - **Knowledge**: RAG configuration.
  - **Tools**: MCP server integration.
  - **Security**: PII redaction and data policies.

### 2. Real-time Interaction (Agent Preview)
- **Text Chat**: WebSocket-based chat with typing indicators and history.
- **Voice Mode**: 
  - **LiveKit Integration**: Low-latency WebRTC audio streaming.
  - **Visualizations**: Real-time audio waveform/visualizer.
  - **Controls**: Mute, disconnect, mode switching.

### 3. SIP & Telephony
- **Phone Numbers Page**: Manage inbound phone numbers.
- **Agent Assignment**: Route phone numbers to specific agents.
- **Billing**: View credit balance (mock/ready for integration).

### 4. UI/UX Design System
- **Theme**: "Emerald" premium theme (Slate/Blue/Indigo gradients).
- **Components**: Glassmorphism cards, smooth transitions, staggered animations.
- **Responsive**: Fully responsive layouts for mobile/tablet/desktop.
- **Accessibility**: ARIA labels, keyboard navigation, focus management.

---

## 🔌 API Integration

### Backend Endpoints
- `GET /api/agents` - List agents
- `POST /api/agents` - Create agent
- `GET /api/agents/{id}` - Get details
- `PUT /api/agents/{id}` - Update config
- `DELETE /api/agents/{id}` - Remove agent
- `POST /api/agents/{id}/publish` - Deploy agent

### Real-time
- `WS /ws/chat/{agentId}` - Text chat socket
- `POST /api/sip/inbound` - SIP webhook (LiveKit)

---

## 🚀 Setup & Run

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables** (`.env`)
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_WS_URL=ws://localhost:8000
   VITE_LIVEKIT_URL=<your-livekit-url>
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-key>
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

---

## 🐛 Known Limitations
- **Mock Data**: Some analytics and billing features use mock data if backend is not fully populated.
- **Auth**: Relies on Supabase Auth; ensure RLS policies are active.

---

## 📚 Reference Documents (Consolidated)
- `FRONTEND_COMPLETE.md`
- `UI_UX_IMPROVEMENTS.md`
- `LANGGRAPH_UI_GUIDE.md`
