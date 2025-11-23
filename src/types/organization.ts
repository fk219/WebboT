import { AgentConfig } from '../../types';

export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface Bot {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  config: AgentConfig;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationWithBots extends Organization {
  bots: Bot[];
  member_count?: number;
}
