/**
 * Agent API service
 * Handles all agent-related API calls
 */

import { Agent, AgentCreateInput, AgentUpdateInput } from '../types/agent';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class AgentService {
  /**
   * List all agents for organization
   */
  static async listAgents(organizationId: string): Promise<Agent[]> {
    const response = await fetch(
      `${API_URL}/api/agents?organization_id=${organizationId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }

    return response.json();
  }

  /**
   * Get agent by ID
   */
  static async getAgent(agentId: string): Promise<Agent> {
    const response = await fetch(`${API_URL}/api/agents/${agentId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch agent');
    }

    return response.json();
  }

  /**
   * Create new agent
   */
  static async createAgent(input: AgentCreateInput): Promise<Agent> {
    const response = await fetch(`${API_URL}/api/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create agent');
    }

    return response.json();
  }

  /**
   * Update agent
   */
  static async updateAgent(
    agentId: string,
    input: AgentUpdateInput
  ): Promise<Agent> {
    const response = await fetch(`${API_URL}/api/agents/${agentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update agent');
    }

    return response.json();
  }

  /**
   * Delete agent
   */
  static async deleteAgent(agentId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/agents/${agentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete agent');
    }
  }

  /**
   * Publish agent
   */
  static async publishAgent(agentId: string): Promise<Agent> {
    const response = await fetch(`${API_URL}/api/agents/${agentId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to publish agent');
    }

    return response.json();
  }

  /**
   * Send text message to agent
   */
  static async sendMessage(
    agentId: string,
    message: string,
    sessionId: string
  ): Promise<{ response: string; metadata: any }> {
    const response = await fetch(`${API_URL}/api/chat/${agentId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, session_id: sessionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  }

  /**
   * Process voice input
   */
  static async processVoice(
    agentId: string,
    audioBlob: Blob,
    sessionId: string
  ): Promise<Blob> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('session_id', sessionId);

    const response = await fetch(`${API_URL}/api/voice/${agentId}/process`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to process voice');
    }

    return response.blob();
  }
}
