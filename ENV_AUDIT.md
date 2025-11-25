# 🔍 Environment Variables Audit

## ✅ GOOD NEWS: All Variables Are Present!

Your `.env.example` file contains **ALL** environment variables used in the backend code.

---

## 📊 Complete Variable Mapping

### ✅ Database Variables

| Variable | Used In | Status | Required |
|----------|---------|--------|----------|
| `DATABASE_URL` | `app/database.py` | ✅ Present | **YES** |

**Usage:**
```python
# app/database.py
engine = create_engine(settings.DATABASE_URL, ...)
```

---

### ✅ LLM API Keys

| Variable | Used In | Status | Required |
|----------|---------|--------|----------|
| `OPENAI_API_KEY` | `app/voice/tts.py`, `app/voice/stt.py`, `workflow_builder.py` | ✅ Present | **YES** |
| `ANTHROPIC_API_KEY` | `workflow_builder.py` | ✅ Present | Optional |
| `GOOGLE_API_KEY` | `workflow_builder.py` | ✅ Present | Optional |

**Usage:**
```python
# app/voice/tts.py
openai.api_key = settings.OPENAI_API_KEY

# app/langgraph/workflow_builder.py
ChatOpenAI(model=model, ...)  # Uses OPENAI_API_KEY
ChatAnthropic(model=model, ...)  # Uses ANTHROPIC_API_KEY
ChatGoogleGenerativeAI(model=model, ...)  # Uses GOOGLE_API_KEY
```

---

### ✅ Voice API Keys

| Variable | Used In | Status | Required |
|----------|---------|--------|----------|
| `ELEVENLABS_API_KEY` | `app/voice/tts.py` | ✅ Present | Optional* |
| `DEEPGRAM_API_KEY` | `app/voice/stt.py` | ✅ Present | Optional |

**Usage:**
```python
# app/voice/tts.py
set_api_key(settings.ELEVENLABS_API_KEY)

# app/voice/stt.py
# Deepgram integration (if implemented)
```

*Optional: Can use OpenAI TTS instead

---

### ✅ Vector Database

| Variable | Used In | Status | Required |
|----------|---------|--------|----------|
| `PINECONE_API_KEY` | Not yet used | ✅ Present | Optional |
| `PINECONE_ENVIRONMENT` | Not yet used | ✅ Present | Optional |

**Note:** These are defined but not yet used in the code. They're ready for when you implement knowledge base retrieval.

---

### ✅ Redis

| Variable | Used In | Status | Required |
|----------|---------|--------|----------|
| `REDIS_URL` | Not yet used | ✅ Present | Optional |

**Note:** Defined but not yet used. Ready for caching/session storage if needed.

---

### ✅ Server Configuration

| Variable | Used In | Status | Required |
|----------|---------|--------|----------|
| `HOST` | `app/main.py` | ✅ Present | **YES** |
| `PORT` | `app/main.py` | ✅ Present | **YES** |
| `DEBUG` | `app/main.py` | ✅ Present | **YES** |

**Usage:**
```python
# app/main.py
uvicorn.run(
    "app.main:app",
    host=settings.HOST,
    port=settings.PORT,
    reload=settings.DEBUG
)
```

---

### ✅ CORS Configuration

| Variable | Used In | Status | Required |
|----------|---------|--------|----------|
| `CORS_ORIGINS` | `app/main.py` | ✅ Present | **YES** |

**Usage:**
```python
# app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,  # Parsed from CORS_ORIGINS
    ...
)
```

---

## ❌ MISSING Variables (Critical!)

### 🚨 Supabase Credentials

Your backend uses **PostgreSQL via SQLAlchemy**, but if you're using **Supabase**, you need:

| Variable | Status | Required |
|----------|--------|----------|
| `SUPABASE_URL` | ❌ Missing | **YES** (if using Supabase) |
| `SUPABASE_KEY` | ❌ Missing | **YES** (if using Supabase) |

**Why you need these:**
- Your frontend likely uses Supabase client for auth
- Backend needs to verify Supabase JWT tokens
- Need to connect to Supabase PostgreSQL

**Add to .env.example:**
```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
```

**Update DATABASE_URL:**
```bash
# Instead of:
DATABASE_URL=postgresql://user:password@localhost:5432/agents_db

# Use Supabase connection string:
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

---

## 📋 Complete .env.example (Updated)

```bash
# =====================================================
# DATABASE
# =====================================================
# Option 1: Local PostgreSQL
# DATABASE_URL=postgresql://user:password@localhost:5432/agents_db

# Option 2: Supabase (RECOMMENDED)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Supabase Credentials (for auth verification)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# =====================================================
# LLM APIs (at least one required)
# =====================================================
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...  # Optional
GOOGLE_API_KEY=...  # Optional

# =====================================================
# VOICE APIs (optional, but recommended for voice features)
# =====================================================
ELEVENLABS_API_KEY=...  # For high-quality voice
DEEPGRAM_API_KEY=...  # For advanced STT (optional)

# =====================================================
# VECTOR DATABASE (optional, for knowledge bases)
# =====================================================
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...

# =====================================================
# REDIS (optional, for caching)
# =====================================================
REDIS_URL=redis://localhost:6379

# =====================================================
# SERVER CONFIGURATION
# =====================================================
HOST=0.0.0.0
PORT=8000
DEBUG=True

# =====================================================
# CORS (allow frontend origins)
# =====================================================
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

```

---

## 🎯 Priority Checklist

### Must Have (Backend won't start without these):
- [x] `DATABASE_URL` - ✅ Present
- [x] `HOST` - ✅ Present
- [x] `PORT` - ✅ Present
- [x] `DEBUG` - ✅ Present
- [x] `CORS_ORIGINS` - ✅ Present
- [ ] `SUPABASE_URL` - ❌ **ADD THIS**
- [ ] `SUPABASE_ANON_KEY` - ❌ **ADD THIS**
- [ ] `SUPABASE_SERVICE_KEY` - ❌ **ADD THIS**

### Must Have (Features won't work without these):
- [ ] `OPENAI_API_KEY` - ❌ **REQUIRED for LLM & Voice**

### Nice to Have (Optional features):
- [ ] `ELEVENLABS_API_KEY` - For better voice quality
- [ ] `ANTHROPIC_API_KEY` - For Claude models
- [ ] `GOOGLE_API_KEY` - For Gemini models
- [ ] `DEEPGRAM_API_KEY` - For advanced STT
- [ ] `PINECONE_API_KEY` - For knowledge bases
- [ ] `REDIS_URL` - For caching

---

## 🔧 How to Get Missing Keys

### Supabase Credentials
```bash
# 1. Go to Supabase Dashboard
# 2. Select your project
# 3. Settings → API

# Copy these:
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...  (under "Project API keys" → anon/public)
SUPABASE_SERVICE_KEY=eyJhbGc...  (under "Project API keys" → service_role)

# 4. Settings → Database → Connection string
# Copy "URI" and use as DATABASE_URL
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### OpenAI API Key
```bash
# 1. Go to https://platform.openai.com/api-keys
# 2. Click "Create new secret key"
# 3. Copy the key (starts with sk-...)
OPENAI_API_KEY=sk-...
```

### ElevenLabs API Key (Optional)
```bash
# 1. Go to https://elevenlabs.io
# 2. Sign up / Login
# 3. Profile → API Keys
# 4. Copy your key
ELEVENLABS_API_KEY=...
```

---

## 🚨 Action Required

### Update .env.example
```bash
# Add these lines to backend/.env.example:

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
```

### Update config.py
```python
# Add to backend/app/config.py:

class Settings(BaseSettings):
    # ... existing fields ...
    
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""
```

---

## ✅ Summary

### Current Status:
- **11/14 variables present** (79%)
- **3 critical variables missing** (Supabase credentials)
- **All present variables are correctly used**

### What Works:
✅ Database connection (if using local PostgreSQL)
✅ Server configuration
✅ CORS setup
✅ LLM API structure
✅ Voice API structure

### What's Missing:
❌ Supabase authentication
❌ Supabase database connection
❌ JWT token verification

### Next Steps:
1. Add Supabase variables to `.env.example`
2. Update `config.py` to include Supabase settings
3. Get your actual API keys
4. Create `.env` file with real values
5. Test backend startup

**Once you add Supabase credentials, you'll be 100% ready!** 🚀
