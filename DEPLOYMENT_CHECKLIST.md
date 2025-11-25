# ✅ Deployment Checklist

## Pre-Deployment

### Backend Setup
- [ ] Python 3.11+ installed
- [ ] PostgreSQL installed and running
- [ ] Virtual environment created
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created with API keys
- [ ] Database initialized (`python init_db.py`)
- [ ] Backend runs successfully (`python run.py`)
- [ ] API docs accessible at `http://localhost:8000/docs`

### Frontend Setup
- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created
- [ ] Routes added to App.tsx
- [ ] QueryProvider wrapper added
- [ ] Frontend runs successfully (`npm run dev`)
- [ ] Agent list page loads at `/agents`

### API Keys Required
- [ ] `OPENAI_API_KEY` - For LLM and Whisper STT
- [ ] `ELEVENLABS_API_KEY` - For voice TTS (optional)
- [ ] `DATABASE_URL` - PostgreSQL connection string

### Testing
- [ ] Create a test agent
- [ ] Send a text message
- [ ] Test WebSocket connection
- [ ] Test voice recording (if voice enabled)
- [ ] Edit an agent
- [ ] Delete an agent

---

## Production Deployment

### Backend (Railway/Render)
- [ ] Create account on Railway or Render
- [ ] Create new project
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Deploy backend
- [ ] Verify health endpoint
- [ ] Test API endpoints

### Frontend (Vercel)
- [ ] Create account on Vercel
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Deploy frontend
- [ ] Verify deployment
- [ ] Test full flow

### Database (Managed PostgreSQL)
- [ ] Create managed PostgreSQL instance
- [ ] Update `DATABASE_URL` in backend
- [ ] Run migrations
- [ ] Verify connection

### Domain & SSL
- [ ] Configure custom domain (optional)
- [ ] SSL certificates (automatic on Vercel/Railway)
- [ ] Update CORS settings

---

## Post-Deployment

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Set up logging
- [ ] Monitor API usage
- [ ] Monitor costs

### Security
- [ ] Review API keys
- [ ] Enable rate limiting
- [ ] Review CORS settings
- [ ] Enable authentication (if needed)

### Documentation
- [ ] Update README with production URLs
- [ ] Document deployment process
- [ ] Create user guide

---

## Quick Commands

### Backend
```bash
# Development
python run.py

# Production
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

### Frontend
```bash
# Development
npm run dev

# Production
npm run build
npm run preview
```

### Database
```bash
# Initialize
python init_db.py

# Backup
pg_dump agents_db > backup.sql

# Restore
psql agents_db < backup.sql
```

---

## Troubleshooting

### Backend won't start
- Check Python version (3.11+)
- Check all dependencies installed
- Check `.env` file exists
- Check database is running
- Check API keys are valid

### Frontend won't connect
- Check backend is running
- Check `.env.local` has correct URLs
- Check CORS settings in backend
- Check browser console for errors

### Voice not working
- Check microphone permissions
- Check `ELEVENLABS_API_KEY` is set
- Check audio format compatibility
- Check browser supports audio recording

---

## Success Criteria

✅ Backend running on port 8000
✅ Frontend running on port 5173
✅ Can create agents
✅ Can send text messages
✅ Can test voice (if enabled)
✅ Database persists data
✅ WebSocket connects successfully
✅ No console errors

---

**Once all checkboxes are checked, your system is ready!** 🎉
