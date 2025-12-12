# 🗄️ Master Database Documentation

## Overview
This document details the database schema for the LangGraph Agent Platform. The database is hosted on Supabase (PostgreSQL) and handles multi-tenancy, agent configurations, conversation history, and billing/usage logs.

---

## 📜 Master Schema
The complete schema definition is available in:
**`db/master_schema.sql`**

Run this file in the Supabase SQL Editor to recreate the entire database structure from scratch.

---

## 🏗 Schema Structure

### 1. Multi-Tenancy & Users
- **`organizations`**: The core tenant unit. Users belong to organizations (currently 1:1 mapping for MVP).
  - `credits_balance`: For billing.
- **`user_profiles`**: Extended user data linked to `auth.users`.

### 2. Agent Configuration
- **`agents`**: Stores AI agent settings.
  - `config`: JSON blob for full backup.
  - `llm_*`, `voice_*`: Specific columns for queryability.
  - `organization_id`: Links agent to tenant.

### 3. Runtime & History
- **`agent_sessions`**: Represents a conversation (text or voice).
  - `channel`: 'text', 'voice', 'phone'.
  - `conversation_history`: JSON blob of the chat.
- **`agent_messages`**: Individual messages within a session.
  - `role`: 'user', 'assistant', 'system'.
  - `audio_url`: Link to recording (if voice).

### 4. SIP & Telephony
- **`sip_trunks`**: SIP provider credentials (Twilio, Telnyx).
- **`phone_numbers`**: Inbound numbers mapped to Agents.
- **`call_logs`**: Detailed call records for billing.

### 5. Billing
- **`usage_logs`**: Tracks token usage and cost per interaction.

---

## 🔒 Security (RLS)
Row Level Security is enabled on ALL tables.
- **Organizations**: Users can only access their own organization.
- **Agents**: Users can only access agents belonging to their organization.
- **Sessions/Messages**:
  - Public read/write allowed for Widget/API (controlled via API keys/tokens in backend).
  - Authenticated users can view sessions for their agents.

---

## 🚀 Setup Instructions

1. **Open Supabase Dashboard**.
2. **Go to SQL Editor**.
3. **Copy content of `db/master_schema.sql`**.
4. **Run**.

---

## 🔄 Legacy Compatibility
- **`chat_sessions` / `chat_messages`**: These tables are included for compatibility with the current frontend implementation. They may be deprecated in favor of `agent_sessions` in the future.
