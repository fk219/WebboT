import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { organizationService } from '../services/organizationService';
import { useAuth } from './AuthContext';
import { Organization, Bot } from '../types/organization';
import { AgentConfig } from '../../types';

interface OrganizationsContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  bots: Bot[];
  currentBot: Bot | null;
  loading: boolean;
  setCurrentOrganization: (org: Organization | null) => void;
  setCurrentBot: (bot: Bot | null) => void;
  loadOrganizations: () => Promise<void>;
  loadBots: (organizationId: string) => Promise<void>;
  createOrganization: (name: string, description?: string) => Promise<Organization | null>;
  updateOrganization: (orgId: string, name: string, description?: string) => Promise<boolean>;
  deleteOrganization: (orgId: string) => Promise<{ success: boolean; error?: string }>;
  createBot: (name: string, config: AgentConfig, description?: string) => Promise<Bot | null>;
  updateBot: (botId: string, config: AgentConfig, name?: string, description?: string) => Promise<boolean>;
  deleteBot: (botId: string) => Promise<{ success: boolean; error?: string }>;
  toggleBotStatus: (botId: string, isActive: boolean) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const OrganizationsContext = createContext<OrganizationsContextType | undefined>(undefined);

export const OrganizationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [currentBot, setCurrentBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setBots([]);
      setCurrentBot(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let data = await organizationService.getOrganizations(user.id);
      
      // If no organizations exist, create default one
      if (data.length === 0) {
        console.log('No organizations found, creating default...');
        const defaultOrg = await organizationService.createOrganization(
          user.id,
          'My Organization',
          'Default organization'
        );
        if (defaultOrg) {
          data = [defaultOrg];
          
          // Create default bot
          const defaultConfig: AgentConfig = {
            id: crypto.randomUUID(),
            name: 'My First Bot',
            greeting: 'Hello! How can I help you today?',
            systemInstruction: 'You are a helpful AI assistant.',
            maxReplyTokens: 150,
            tools: [],
            quickReplies: [],
            voice: {
              enabled: true,
              name: 'Alloy',
              language: 'English',
              speed: 1.0,
              pitch: 1.0,
              phoneCallEnabled: true
            },
            theme: {
              primaryColor: '#10b981',
              mode: 'light' as const,
              fontFamily: 'inter' as const,
              fontStyle: 'regular' as const,
              radius: 'xl' as const,
              avatarIcon: 'bot' as const,
              showBranding: true
            }
          };
          
          await organizationService.createBot(
            defaultOrg.id,
            user.id,
            'My First Bot',
            defaultConfig
          );
        }
      }
      
      setOrganizations(data);
      
      // Set current organization if not set
      if (!currentOrganization && data.length > 0) {
        setCurrentOrganization(data[0]);
        await loadBots(data[0].id);
      } else if (currentOrganization) {
        // Update current organization if it exists in the new data
        const updatedCurrent = data.find(o => o.id === currentOrganization.id);
        if (updatedCurrent) {
          setCurrentOrganization(updatedCurrent);
        } else if (data.length > 0) {
          // Current organization was deleted, switch to first available
          setCurrentOrganization(data[0]);
          await loadBots(data[0].id);
        } else {
          setCurrentOrganization(null);
          setBots([]);
          setCurrentBot(null);
        }
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBots = async (organizationId: string) => {
    try {
      const data = await organizationService.getBots(organizationId);
      setBots(data);
      
      // Set current bot if not set
      if (!currentBot && data.length > 0) {
        setCurrentBot(data[0]);
      } else if (currentBot) {
        // Update current bot if it exists in the new data
        const updatedCurrent = data.find(b => b.id === currentBot.id);
        if (updatedCurrent) {
          setCurrentBot(updatedCurrent);
        } else if (data.length > 0) {
          // Current bot was deleted, switch to first available
          setCurrentBot(data[0]);
        } else {
          setCurrentBot(null);
        }
      }
    } catch (error) {
      console.error('Error loading bots:', error);
    }
  };

  const createOrganization = async (name: string, description?: string): Promise<Organization | null> => {
    if (!user) return null;

    try {
      const newOrg = await organizationService.createOrganization(user.id, name, description);
      if (newOrg) {
        // Reload organizations to get fresh data
        await loadOrganizations();
        setCurrentOrganization(newOrg);
        
        // Create default bot for new organization
        const defaultConfig: AgentConfig = {
          id: crypto.randomUUID(),
          name: 'My First Bot',
          greeting: 'Hello! How can I help you today?',
          systemInstruction: 'You are a helpful AI assistant.',
          maxReplyTokens: 150,
          tools: [],
          quickReplies: [],
          voice: {
            enabled: true,
            name: 'Alloy',
            language: 'English',
            speed: 1.0,
            pitch: 1.0,
            phoneCallEnabled: true
          },
          theme: {
            primaryColor: '#10b981',
            mode: 'light' as const,
            fontFamily: 'inter' as const,
            fontStyle: 'regular' as const,
            radius: 'xl' as const,
            avatarIcon: 'bot' as const,
            showBranding: true
          }
        };
        
        await organizationService.createBot(newOrg.id, user.id, 'My First Bot', defaultConfig);
        await loadBots(newOrg.id);
        
        return newOrg;
      }
    } catch (error) {
      console.error('Error creating organization:', error);
    }
    return null;
  };

  const updateOrganization = async (orgId: string, name: string, description?: string): Promise<boolean> => {
    try {
      const success = await organizationService.updateOrganization(orgId, name, description);
      if (success) {
        await loadOrganizations();
        return true;
      }
    } catch (error) {
      console.error('Error updating organization:', error);
    }
    return false;
  };

  const deleteOrganization = async (orgId: string): Promise<{ success: boolean; error?: string }> => {
    // Check if this is the last organization
    if (organizations.length <= 1) {
      return { 
        success: false, 
        error: 'You must have at least one organization. Create a new organization before deleting this one.' 
      };
    }

    try {
      const result = await organizationService.deleteOrganization(orgId);
      if (result.success) {
        setOrganizations(prev => prev.filter(o => o.id !== orgId));
        
        // If deleted organization was current, switch to another
        if (currentOrganization?.id === orgId) {
          const remaining = organizations.filter(o => o.id !== orgId);
          if (remaining.length > 0) {
            setCurrentOrganization(remaining[0]);
            await loadBots(remaining[0].id);
          } else {
            setCurrentOrganization(null);
            setBots([]);
            setCurrentBot(null);
          }
        }
        
        return { success: true };
      }
      return result;
    } catch (error) {
      console.error('Error deleting organization:', error);
      return { success: false, error: 'Failed to delete organization. Please try again.' };
    }
  };

  const createBot = async (name: string, config: AgentConfig, description?: string): Promise<Bot | null> => {
    if (!user || !currentOrganization) return null;

    try {
      const newBot = await organizationService.createBot(
        currentOrganization.id,
        user.id,
        name,
        config,
        description
      );
      if (newBot) {
        // Reload bots to get fresh data
        await loadBots(currentOrganization.id);
        setCurrentBot(newBot);
        return newBot;
      }
    } catch (error) {
      console.error('Error creating bot:', error);
    }
    return null;
  };

  const updateBot = async (
    botId: string,
    config: AgentConfig,
    name?: string,
    description?: string
  ): Promise<boolean> => {
    try {
      const success = await organizationService.updateBot(botId, config, name, description);
      if (success && currentOrganization) {
        await loadBots(currentOrganization.id);
        return true;
      }
    } catch (error) {
      console.error('Error updating bot:', error);
    }
    return false;
  };

  const deleteBot = async (botId: string): Promise<{ success: boolean; error?: string }> => {
    // Check if this is the last bot
    if (bots.length <= 1) {
      return { 
        success: false, 
        error: 'You must have at least one bot. Create a new bot before deleting this one.' 
      };
    }

    try {
      const result = await organizationService.deleteBot(botId);
      if (result.success) {
        setBots(prev => prev.filter(b => b.id !== botId));
        
        // If deleted bot was current, switch to another
        if (currentBot?.id === botId) {
          const remaining = bots.filter(b => b.id !== botId);
          setCurrentBot(remaining.length > 0 ? remaining[0] : null);
        }
        
        return { success: true };
      }
      return result;
    } catch (error) {
      console.error('Error deleting bot:', error);
      return { success: false, error: 'Failed to delete bot. Please try again.' };
    }
  };

  const toggleBotStatus = async (botId: string, isActive: boolean): Promise<boolean> => {
    try {
      const success = await organizationService.toggleBotStatus(botId, isActive);
      if (success && currentOrganization) {
        await loadBots(currentOrganization.id);
        return true;
      }
    } catch (error) {
      console.error('Error toggling bot status:', error);
    }
    return false;
  };

  const refreshData = async () => {
    await loadOrganizations();
    if (currentOrganization) {
      await loadBots(currentOrganization.id);
    }
  };

  // Load organizations when user changes
  useEffect(() => {
    if (user) {
      loadOrganizations();
    } else {
      setOrganizations([]);
      setCurrentOrganization(null);
      setBots([]);
      setCurrentBot(null);
      setLoading(false);
    }
  }, [user]);

  // Load bots when current organization changes
  useEffect(() => {
    if (currentOrganization) {
      loadBots(currentOrganization.id);
    } else {
      setBots([]);
      setCurrentBot(null);
    }
  }, [currentOrganization?.id]);

  return (
    <OrganizationsContext.Provider
      value={{
        organizations,
        currentOrganization,
        bots,
        currentBot,
        loading,
        setCurrentOrganization,
        setCurrentBot,
        loadOrganizations,
        loadBots,
        createOrganization,
        updateOrganization,
        deleteOrganization,
        createBot,
        updateBot,
        deleteBot,
        toggleBotStatus,
        refreshData,
      }}
    >
      {children}
    </OrganizationsContext.Provider>
  );
};

export const useOrganizations = () => {
  const context = useContext(OrganizationsContext);
  if (context === undefined) {
    throw new Error('useOrganizations must be used within an OrganizationsProvider');
  }
  return context;
};
