# 🚀 HOW TO RUN THIS DAMN THING

## Step 1: Database Setup (5 minutes)

### 1.1 Run the Migration
```bash
# Open Supabase Dashboard → SQL Editor
# Copy/paste db/complete_migration.sql
# Click "Run"
# Done! ✅
```

### 1.2 Get Your Supabase Credentials
```bash
# Supabase Dashboard → Settings → API
# Copy these:
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...  # Settings → API → service_role key
```

---

## Step 2: Backend Setup (5 minutes)

### 2.1 Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2.2 Create .env File
```bash
# Copy the example
cp .env.example .env

# Edit .env with your actual values:
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_service_role_key_here
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=your_key_here  # Optional for voice
```

### 2.3 Start Backend
```bash
# Still in backend folder
uvicorn app.main:app --reload --port 8000

# You should see:
# INFO:     Uvicorn running on http://127.0.0.1:8000
# INFO:     Application startup complete.
```

**Backend is now running at http://localhost:8000** ✅

---

## Step 3: Frontend Setup (5 minutes)

### 3.1 Install Dependencies
```bash
# Open NEW terminal
cd frontend  # or wherever your React app is
npm install
```

### 3.2 Create .env File
```bash
# Create .env.local
echo "VITE_API_URL=http://localhost:8000" > .env.local
echo "VITE_SUPABASE_URL=https://xxxxx.supabase.co" >> .env.local
echo "VITE_SUPABASE_ANON_KEY=your_anon_key_here" >> .env.local
```

### 3.3 Start Frontend
```bash
npm run dev

# You should see:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

**Frontend is now running at http://localhost:5173** ✅

---

## Step 4: See It In Action! 🎉

### 4.1 Open Browser
```
http://localhost:5173
```

### 4.2 Sign Up / Login
- Click "Sign Up"
- Enter email + password
- Verify email (check inbox)
- Login

### 4.3 Create Your First Agent
1. Click **"Create Agent"** button
2. Fill in the form:
   - **Name:** "My First Agent"
   - **Description:** "Test agent"
   - **LLM Provider:** OpenAI
   - **Model:** gpt-4o-mini
   - **System Prompt:** "You are a helpful assistant"
3. Click **"Create"**

### 4.4 Test Text Chat
1. Click on your agent
2. Click **"Preview"** tab
3. Type a message: "Hello!"
4. Watch it respond! 🎉

### 4.5 Test Voice (Optional)
1. In Preview tab, click **"Voice"** mode
2. Click microphone button
3. Speak: "Hello, how are you?"
4. Listen to AI response! 🎤

---

## 🔥 Quick Test Commands

### Test Backend API
```bash
# Test health check
curl http://localhost:8000/health

# Should return: {"status":"healthy"}
```

### Test Agent Creation (via API)
```bash
curl -X POST http://localhost:8000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "organization_id": "your-org-id",
    "llm_provider": "openai",
    "llm_model": "gpt-4o-mini",
    "system_prompt": "You are helpful",
    "config_json": {}
  }'
```

### Test Chat
```bash
curl -X POST http://localhost:8000/api/chat/AGENT_ID/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello!",
    "session_id": "test_session_123"
  }'
```

---

## 🐛 Troubleshooting

### Backend won't start?
```bash
# Check Python version (need 3.9+)
python --version

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check .env file exists
cat .env
```

### Frontend won't start?
```bash
# Check Node version (need 16+)
node --version

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check .env.local exists
cat .env.local
```

### Database errors?
```bash
# Check migration ran successfully
# Go to Supabase → SQL Editor → History
# Verify complete_migration.sql executed

# Check tables exist
# Run in SQL Editor:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

# Should see: agents, agent_sessions, agent_messages, etc.
```

### Can't create agent?
```bash
# Check you have an organization
# Run in Supabase SQL Editor:
SELECT * FROM organizations WHERE owner_id = 'your-user-id';

# If empty, create one:
INSERT INTO organizations (name, owner_id) 
VALUES ('My Org', 'your-user-id');
```

---

## 📊 What You Should See

### Backend Logs (Terminal 1)
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Frontend Logs (Terminal 2)
```
VITE v5.x.x  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Browser (http://localhost:5173)
```
✅ Login page loads
✅ Can sign up / login
✅ Dashboard shows "Create Agent" button
✅ Can create agent
✅ Can chat with agent
✅ Messages appear in real-time
```

---

## 🎯 Full Flow Test

### 1. Create Agent
- Go to http://localhost:5173
- Login
- Click "Create Agent"
- Fill form, click "Create"
- **Expected:** Agent appears in list

### 2. Test Text Chat
- Click on agent
- Click "Preview" tab
- Type "Hello!"
- **Expected:** AI responds within 2-3 seconds

### 3. Test Session Isolation
- Open http://localhost:5173 in **incognito window**
- Chat with same agent
- **Expected:** Separate conversation, no cross-talk

### 4. Test Voice (if configured)
- Click "Voice" mode
- Click microphone
- Speak
- **Expected:** Transcription appears, AI responds with voice

---

## 🚨 Common Issues

### "Table 'agents' does not exist"
**Fix:** Run the migration script in Supabase SQL Editor

### "OPENAI_API_KEY not found"
**Fix:** Add to backend/.env file

### "CORS error"
**Fix:** Backend should allow localhost:5173 (already configured)

### "Session not found"
**Fix:** Clear browser localStorage and refresh

### "Voice not working"
**Fix:** Need ELEVENLABS_API_KEY in .env (or use OpenAI TTS)

---

## 🎉 Success Checklist

- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:5173
- [ ] Can login/signup
- [ ] Can create agent
- [ ] Can send message
- [ ] AI responds
- [ ] Session persists on refresh
- [ ] Multiple tabs have separate sessions

**If all checked, YOU'RE DONE! 🚀**

---

## 💡 Pro Tips

### Keep Both Terminals Open
```
Terminal 1: Backend (uvicorn)
Terminal 2: Frontend (npm run dev)
```

### Watch Logs
```bash
# Backend logs show:
# - API requests
# - Database queries
# - LangGraph execution
# - Errors

# Frontend logs show:
# - Component renders
# - API calls
# - WebSocket events
```

### Test Multiple Sessions
```bash
# Open multiple browser windows
# Each gets unique session_id
# Conversations stay isolated
```

### Check Database
```bash
# Supabase Dashboard → Table Editor
# Watch data populate in real-time:
# - agents table (your agents)
# - agent_sessions (active chats)
# - agent_messages (message history)
```

---

## 🔥 Quick Start (TL;DR)

```bash
# 1. Run migration in Supabase SQL Editor
# (copy/paste db/complete_migration.sql)

# 2. Backend
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your keys
uvicorn app.main:app --reload --port 8000

# 3. Frontend (new terminal)
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev

# 4. Open browser
# http://localhost:5173
# Sign up → Create Agent → Chat!
```

**DONE! NOW GO BUILD SOME AGENTS! 🚀**
