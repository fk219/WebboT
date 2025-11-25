# 🔐 Session Isolation - Visual Explanation

## Scenario: 100 Websites Using Your Agent

```
┌─────────────────────────────────────────────────────────────────┐
│                    Website A (example.com)                       │
│                                                                  │
│  User 1 (Browser 1)              User 2 (Browser 2)            │
│  session_123_abc                 session_456_def                │
│  "Hello!"                        "Hi there!"                    │
│      ↓                                ↓                          │
└──────┼────────────────────────────────┼──────────────────────────┘
       │                                │
       │                                │
┌─────────────────────────────────────────────────────────────────┐
│                    Website B (demo.com)                          │
│                                                                  │
│  User 3 (Browser 3)              User 4 (Browser 4)            │
│  session_789_ghi                 session_012_jkl                │
│  "Good morning!"                 "Help me!"                     │
│      ↓                                ↓                          │
└──────┼────────────────────────────────┼──────────────────────────┘
       │                                │
       └────────────┬───────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR BACKEND SERVER                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Session Manager                              │  │
│  │                                                            │  │
│  │  session_123_abc → Conversation A (User 1)               │  │
│  │  session_456_def → Conversation B (User 2)               │  │
│  │  session_789_ghi → Conversation C (User 3)               │  │
│  │  session_012_jkl → Conversation D (User 4)               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                          │  │
│  │                                                            │  │
│  │  agent_sessions:                                          │  │
│  │  ┌────────────────┬──────────────┬──────────────────┐    │  │
│  │  │ session_id     │ agent_id     │ history          │    │  │
│  │  ├────────────────┼──────────────┼──────────────────┤    │  │
│  │  │ session_123_abc│ agent_001    │ ["Hello!", ...]  │    │  │
│  │  │ session_456_def│ agent_001    │ ["Hi there!",...]│    │  │
│  │  │ session_789_ghi│ agent_001    │ ["Good morn..",.]│    │  │
│  │  │ session_012_jkl│ agent_001    │ ["Help me!", ...]│    │  │
│  │  └────────────────┴──────────────┴──────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## How Isolation Works

### Step 1: User Opens Website
```
User 1 visits example.com
    ↓
Frontend generates: session_123_abc
    ↓
Stored in localStorage
```

### Step 2: User Sends First Message
```
User 1: "Hello!"
    ↓
Request: {
    message: "Hello!",
    session_id: "session_123_abc",
    metadata: {
        website_domain: "example.com"
    }
}
    ↓
Backend creates session in database
    ↓
Agent responds: "Hi! How can I help?"
```

### Step 3: User Sends Second Message
```
User 1: "What's my name?"
    ↓
Request: {
    message: "What's my name?",
    session_id: "session_123_abc"  ← SAME SESSION
}
    ↓
Backend loads conversation history:
    - "Hello!"
    - "Hi! How can I help?"
    ↓
Agent responds with context
```

### Step 4: Different User, Same Agent
```
User 2: "What's my name?"
    ↓
Request: {
    message: "What's my name?",
    session_id: "session_456_def"  ← DIFFERENT SESSION
}
    ↓
Backend loads DIFFERENT history (empty)
    ↓
Agent: "I don't know your name yet."
```

---

## Isolation Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Browser Storage                                │
│ • Each browser has unique session_id in localStorage    │
│ • No sharing between browsers                           │
│ • Persists across page reloads                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: HTTP Requests                                  │
│ • session_id sent with every request                    │
│ • Backend uses session_id to lookup conversation        │
│ • No cookies, no shared state                           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Database                                       │
│ • Each session_id has own row                           │
│ • Conversation history stored per session               │
│ • Context data isolated per session                     │
│ • Indexed for fast lookup                               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 4: LangGraph Execution                            │
│ • Stateless workflow execution                          │
│ • History loaded from database                          │
│ • No memory sharing between executions                  │
│ • Fresh state each time                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Example: 3 Users, Same Agent

### Timeline

```
Time: 10:00:00
User A: "My name is Alice"
    → session_aaa
    → Stored: ["My name is Alice"]
    → Response: "Nice to meet you, Alice!"

Time: 10:00:05
User B: "My name is Bob"
    → session_bbb
    → Stored: ["My name is Bob"]
    → Response: "Nice to meet you, Bob!"

Time: 10:00:10
User A: "What's my name?"
    → session_aaa
    → Loaded: ["My name is Alice", "Nice to meet you, Alice!"]
    → Response: "Your name is Alice!"

Time: 10:00:15
User B: "What's my name?"
    → session_bbb
    → Loaded: ["My name is Bob", "Nice to meet you, Bob!"]
    → Response: "Your name is Bob!"

Time: 10:00:20
User C: "What's my name?"
    → session_ccc
    → Loaded: [] (empty, new session)
    → Response: "I don't know your name yet."
```

**Result: Perfect isolation! ✅**

---

## Database State After Above Interactions

```sql
SELECT session_id, message_count, conversation_history 
FROM agent_sessions;

┌─────────────┬───────────────┬─────────────────────────────────┐
│ session_id  │ message_count │ conversation_history            │
├─────────────┼───────────────┼─────────────────────────────────┤
│ session_aaa │ 4             │ [                               │
│             │               │   {"role": "user",              │
│             │               │    "content": "My name is Alice"}│
│             │               │   {"role": "assistant",         │
│             │               │    "content": "Nice to meet..."}│
│             │               │   {"role": "user",              │
│             │               │    "content": "What's my name?"}│
│             │               │   {"role": "assistant",         │
│             │               │    "content": "Your name is..."}│
│             │               │ ]                               │
├─────────────┼───────────────┼─────────────────────────────────┤
│ session_bbb │ 4             │ [                               │
│             │               │   {"role": "user",              │
│             │               │    "content": "My name is Bob"} │
│             │               │   ...                           │
│             │               │ ]                               │
├─────────────┼───────────────┼─────────────────────────────────┤
│ session_ccc │ 2             │ [                               │
│             │               │   {"role": "user",              │
│             │               │    "content": "What's my name?"}│
│             │               │   ...                           │
│             │               │ ]                               │
└─────────────┴───────────────┴─────────────────────────────────┘
```

---

## Scalability: 1000 Concurrent Users

```
1000 Users × 1 Agent = 1000 Sessions

Database:
┌──────────────────────────────────────┐
│ agent_sessions: 1000 rows            │
│ • Each row: ~5KB (history)           │
│ • Total: ~5MB                        │
│ • Indexed lookups: <1ms              │
└──────────────────────────────────────┘

Memory:
┌──────────────────────────────────────┐
│ Backend: Stateless                   │
│ • No session data in memory          │
│ • Each request: Load → Process → Save│
│ • Memory usage: Constant             │
└──────────────────────────────────────┘

Performance:
┌──────────────────────────────────────┐
│ • Session lookup: <1ms (indexed)     │
│ • History load: <5ms (JSONB)         │
│ • LLM processing: 500-2000ms         │
│ • Total latency: ~1-2 seconds        │
└──────────────────────────────────────┘
```

---

## Security & Privacy

### Session ID Security
```
✅ Unique per browser
✅ Unpredictable (timestamp + random)
✅ Not guessable
✅ Stored client-side only
✅ No server-side cookies
```

### Data Isolation
```
✅ Database-level separation
✅ No shared memory
✅ No cross-session queries
✅ Foreign key constraints
✅ Indexed for performance
```

### Privacy
```
✅ Optional user_id (if authenticated)
✅ Website domain tracked
✅ IP address optional
✅ PII redaction available
✅ Automatic cleanup
```

---

## Summary

### How 100 Websites Stay Isolated:

1. **Unique Session IDs**
   - Generated per browser
   - Stored in localStorage
   - Sent with every request

2. **Database Isolation**
   - Separate row per session
   - Own conversation history
   - Own context data

3. **Stateless Execution**
   - No memory sharing
   - Fresh execution each time
   - History loaded from DB

4. **Automatic Management**
   - Sessions created automatically
   - History preserved
   - Cleanup runs periodically

**Result: Perfect isolation for unlimited concurrent users! 🎉**
