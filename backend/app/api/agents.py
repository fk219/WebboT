"""
Agent CRUD API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from ..database import get_db
from ..models.agent import Agent
from ..schemas.agent import AgentCreate, AgentUpdate, AgentResponse
from ..langgraph.agent_runtime import runtime

router = APIRouter()


@router.get("/agents", response_model=List[AgentResponse])
async def list_agents(
    organization_id: str,
    db: Session = Depends(get_db)
):
    """List all agents for organization"""
    agents = db.query(Agent).filter(
        Agent.organization_id == organization_id
    ).all()
    return agents


@router.get("/agents/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    db: Session = Depends(get_db)
):
    """Get agent by ID"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/agents", response_model=AgentResponse)
async def create_agent(
    agent_data: AgentCreate,
    db: Session = Depends(get_db)
):
    """Create new agent"""
    # Create agent model
    agent = Agent(
        organization_id="00000000-0000-0000-0000-000000000000",  # TODO: Get from auth
        name=agent_data.name,
        description=agent_data.description,
        llm_provider=agent_data.config.llm_provider,
        llm_model=agent_data.config.llm_model,
        system_prompt=agent_data.config.system_prompt,
        temperature=agent_data.config.temperature,
        max_tokens=agent_data.config.max_tokens,
        voice_provider=agent_data.config.voice_provider,
        voice_id=agent_data.config.voice_id,
        voice_model=agent_data.config.voice_model,
        voice_speed=agent_data.config.voice_speed,
        voice_temperature=agent_data.config.voice_temperature,
        voice_volume=agent_data.config.voice_volume,
        responsiveness=agent_data.config.responsiveness,
        interruption_sensitivity=agent_data.config.interruption_sensitivity,
        enable_backchannel=agent_data.config.enable_backchannel,
        backchannel_words=agent_data.config.backchannel_words,
        normalize_speech=agent_data.config.normalize_speech,
        boosted_keywords=agent_data.config.boosted_keywords,
        ambient_sound=agent_data.config.ambient_sound,
        ambient_volume=agent_data.config.ambient_volume,
        max_duration_seconds=agent_data.config.max_duration_seconds,
        end_after_silence_seconds=agent_data.config.end_after_silence_seconds,
        voicemail_detection=agent_data.config.voicemail_detection,
        voicemail_action=agent_data.config.voicemail_action,
        voicemail_message=agent_data.config.voicemail_message,
        stt_provider=agent_data.config.stt_provider,
        stt_mode=agent_data.config.stt_mode,
        denoising_mode=agent_data.config.denoising_mode,
        pii_redaction_enabled=agent_data.config.pii_redaction_enabled,
        pii_redaction_list=agent_data.config.pii_redaction_list,
        data_storage_policy=agent_data.config.data_storage_policy,
        webhook_url=agent_data.config.webhook_url,
        webhook_timeout_ms=agent_data.config.webhook_timeout_ms,
        custom_headers=agent_data.config.custom_headers,
        enabled_mcp_servers=agent_data.config.enabled_mcp_servers,
        knowledge_base_ids=agent_data.config.knowledge_base_ids,
        config_json=agent_data.config.dict()
    )
    
    db.add(agent)
    db.commit()
    db.refresh(agent)
    
    return agent


@router.put("/agents/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    agent_data: AgentUpdate,
    db: Session = Depends(get_db)
):
    """Update agent"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Update fields
    if agent_data.name:
        agent.name = agent_data.name
    if agent_data.description is not None:
        agent.description = agent_data.description
    if agent_data.config:
        # Update all config fields
        config_dict = agent_data.config.dict()
        for key, value in config_dict.items():
            if hasattr(agent, key):
                setattr(agent, key, value)
        agent.config_json = config_dict
    
    db.commit()
    db.refresh(agent)
    
    # Invalidate runtime cache
    runtime.invalidate_cache(str(agent_id))
    
    return agent


@router.delete("/agents/{agent_id}")
async def delete_agent(
    agent_id: str,
    db: Session = Depends(get_db)
):
    """Delete agent"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    db.delete(agent)
    db.commit()
    
    # Invalidate runtime cache
    runtime.invalidate_cache(str(agent_id))
    
    return {"message": "Agent deleted successfully"}


@router.post("/agents/{agent_id}/publish", response_model=AgentResponse)
async def publish_agent(
    agent_id: str,
    db: Session = Depends(get_db)
):
    """Publish agent"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent.is_published = True
    agent.version += 1
    
    db.commit()
    db.refresh(agent)
    
    # Invalidate runtime cache
    runtime.invalidate_cache(str(agent_id))
    
    return agent
