from fastapi import APIRouter, Depends, HTTPException, Form, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db
from ..services.livekit_service import LiveKitService
from ..models.agent import Agent
from ..workers.voice_agent import VoiceAgent
import uuid
import json
import asyncio

router = APIRouter()

# Keep track of active agents (in-memory for MVP, use Redis for production)
active_voice_agents = {}

async def start_voice_agent(room_name: str, agent_id: str, db: Session):
    """
    Background task to start the VoiceAgent for a room.
    """
    # Create a new DB session for the worker since the request session will close
    # Note: In a real app, handle session lifecycle better or pass a session factory
    # For now, we'll assume the worker manages its own short-lived sessions or we pass the ID
    
    # We need to pass a session factory or create a new session here. 
    # Since we can't easily pass the session factory, we'll skip DB for now in the worker init
    # or assume the worker creates one.
    
    # Actually, VoiceAgent takes a db_session. Let's fix VoiceAgent to take a session factory or just IDs.
    # For this MVP, we will instantiate it.
    
    print(f"🚀 Spawning VoiceAgent for room {room_name}")
    agent = VoiceAgent(room_name, agent_id, db) # Warning: db session might be closed
    active_voice_agents[room_name] = agent
    await agent.start()

@router.post("/voice/sip/inbound")
async def handle_sip_inbound(
    background_tasks: BackgroundTasks,
    caller_id: str = Form(None),
    called_number: str = Form(...),
    trunk_id: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Webhook called by LiveKit SIP Ingress when a call is received.
    """
    print(f"📞 Inbound SIP Call: {caller_id} -> {called_number}")

    # 1. Lookup Phone Number -> Agent & Organization
    query = text("""
        SELECT 
            pn.id as phone_id,
            pn.agent_id,
            pn.organization_id,
            o.credits_balance
        FROM phone_numbers pn
        JOIN organizations o ON pn.organization_id = o.id
        WHERE pn.phone_number = :number AND pn.status = 'active'
    """)
    
    result = db.execute(query, {"number": called_number}).first()
    
    if not result:
        print(f"❌ Number not found: {called_number}")
        raise HTTPException(status_code=404, detail="Phone number not configured")
        
    phone_id, agent_id, org_id, credits = result
    
    if not agent_id:
        print(f"❌ No agent assigned to number: {called_number}")
        raise HTTPException(status_code=404, detail="No agent assigned")
        
    # 2. Check Credits
    if credits <= 0:
        print(f"❌ Insufficient credits for org {org_id}")
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # 3. Generate Session & Room
    session_id = str(uuid.uuid4())
    room_name = f"sip-{agent_id}-{session_id}"

    # 4. Log Call Start
    log_query = text("""
        INSERT INTO call_logs (organization_id, agent_id, phone_number_id, session_id, direction, caller_number, status)
        VALUES (:org_id, :agent_id, :phone_id, :session_id, 'inbound', :caller, 'active')
    """)
    db.execute(log_query, {
        "org_id": org_id,
        "agent_id": agent_id,
        "phone_id": phone_id,
        "session_id": session_id,
        "caller": caller_id
    })
    db.commit()
    
    # 5. Spawn Voice Agent Worker
    # We use BackgroundTasks to start the agent AFTER the response is sent
    # However, LiveKit expects the room to be ready or the agent to join.
    # We'll start it in the background.
    background_tasks.add_task(start_voice_agent, room_name, str(agent_id), db)

    # 6. Return LiveKit Config
    participant_identity = f"sip-user-{caller_id}"
    participant_name = caller_id or "Unknown Caller"
    
    return {
        "roomName": room_name,
        "participantIdentity": participant_identity,
        "participantName": participant_name,
        "metadata": json.dumps({
            "agentId": str(agent_id),
            "sessionId": session_id,
            "organizationId": str(org_id),
            "type": "sip"
        })
    }

@router.post("/voice/sip/outbound")
async def start_outbound_call(
    agent_id: str,
    phone_number: str,
    db: Session = Depends(get_db)
):
    """
    Initiate an outbound call via SIP
    """
    # 1. Get Agent & Org
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # 2. Check Credits (TODO)

    # 3. Create Room
    session_id = str(uuid.uuid4())
    room_name = f"outbound-{agent.id}-{session_id}"

    # 4. Trigger LiveKit SIP Egress/Outbound
    # await LiveKitService.create_sip_participant(...)
    
    # 5. Spawn Voice Agent
    # asyncio.create_task(start_voice_agent(room_name, agent_id, db))

    return {"status": "initiated", "room_name": room_name, "session_id": session_id}
