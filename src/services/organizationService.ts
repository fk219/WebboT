import { supabase } from '../lib/supabase';
import { Organization, Bot, OrganizationMember, OrganizationWithBots } from '../types/organization';
import { AgentConfig } from '../../types';

export const organizationService = {
  // ============================================
  // ORGANIZATIONS
  // ============================================
  
  async getOrganizations(userId: string): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching organizations:', error);
      return [];
    }
    return data || [];
  },

  async getOrganizationWithBots(organizationId: string): Promise<OrganizationWithBots | null> {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return null;
    }

    const { data: bots, error: botsError } = await supabase
      .from('bots')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (botsError) {
      console.error('Error fetching bots:', botsError);
      return { ...org, bots: [] };
    }

    return { ...org, bots: bots || [] };
  },

  async createOrganization(userId: string, name: string, description?: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .insert([{ owner_id: userId, name, description }])
      .select()
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      return null;
    }
    return data;
  },

  async updateOrganization(organizationId: string, name: string, description?: string): Promise<boolean> {
    const { error } = await supabase
      .from('organizations')
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq('id', organizationId);

    if (error) {
      console.error('Error updating organization:', error);
      return false;
    }
    return true;
  },

  async deleteOrganization(organizationId: string): Promise<{ success: boolean; error?: string }> {
    // Database CASCADE will automatically delete all bots and related data
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId);

    if (error) {
      console.error('Error deleting organization:', error);
      return { success: false, error: 'Failed to delete organization' };
    }
    return { success: true };
  },

  // ============================================
  // BOTS
  // ============================================

  async getBots(organizationId: string): Promise<Bot[]> {
    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bots:', error);
      return [];
    }
    return data || [];
  },

  async getBot(botId: string): Promise<Bot | null> {
    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .single();

    if (error) {
      console.error('Error fetching bot:', error);
      return null;
    }
    return data;
  },

  async createBot(
    organizationId: string,
    userId: string,
    name: string,
    config: AgentConfig,
    description?: string
  ): Promise<Bot | null> {
    const { data, error } = await supabase
      .from('bots')
      .insert([{
        organization_id: organizationId,
        created_by: userId,
        name,
        description,
        config,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating bot:', error);
      return null;
    }
    return data;
  },

  async updateBot(
    botId: string,
    config: AgentConfig,
    name?: string,
    description?: string
  ): Promise<boolean> {
    const updates: any = { config, updated_at: new Date().toISOString() };
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;

    const { error } = await supabase
      .from('bots')
      .update(updates)
      .eq('id', botId);

    if (error) {
      console.error('Error updating bot:', error);
      return false;
    }
    return true;
  },

  async deleteBot(botId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete related records
      await supabase
        .from('usage_logs')
        .delete()
        .eq('bot_id', botId);

      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('bot_id', botId);

      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        await supabase
          .from('chat_messages')
          .delete()
          .in('session_id', sessionIds);
      }

      await supabase
        .from('chat_sessions')
        .delete()
        .eq('bot_id', botId);

      const { error } = await supabase
        .from('bots')
        .delete()
        .eq('id', botId);

      if (error) {
        console.error('Error deleting bot:', error);
        return { success: false, error: 'Failed to delete bot' };
      }
      return { success: true };
    } catch (error) {
      console.error('Error deleting bot:', error);
      return { success: false, error: 'Failed to delete bot' };
    }
  },

  async toggleBotStatus(botId: string, isActive: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('bots')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', botId);

    if (error) {
      console.error('Error toggling bot status:', error);
      return false;
    }
    return true;
  },

  // ============================================
  // ORGANIZATION MEMBERS
  // ============================================

  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error fetching members:', error);
      return [];
    }
    return data || [];
  },

  async addOrganizationMember(
    organizationId: string,
    userId: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<boolean> {
    const { error } = await supabase
      .from('organization_members')
      .insert([{ organization_id: organizationId, user_id: userId, role }]);

    if (error) {
      console.error('Error adding member:', error);
      return false;
    }
    return true;
  },

  async removeOrganizationMember(organizationId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing member:', error);
      return false;
    }
    return true;
  },

  // ============================================
  // ANALYTICS
  // ============================================

  async getBotAnalytics(botId: string): Promise<any> {
    // Get total conversations
    const { count: totalConversations } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('bot_id', botId);

    // Get total tokens
    const { data: usageLogs } = await supabase
      .from('usage_logs')
      .select('tokens_used')
      .eq('bot_id', botId);

    const totalTokens = usageLogs?.reduce((sum, log) => sum + log.tokens_used, 0) || 0;

    // Get daily stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentUsage } = await supabase
      .from('usage_logs')
      .select('created_at, tokens_used')
      .eq('bot_id', botId)
      .gte('created_at', sevenDaysAgo.toISOString());

    const dailyStats: Record<string, number> = {};
    recentUsage?.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString();
      dailyStats[date] = (dailyStats[date] || 0) + log.tokens_used;
    });

    return {
      totalConversations: totalConversations || 0,
      totalTokens,
      dailyStats: Object.entries(dailyStats).map(([date, tokens]) => ({ date, tokens }))
    };
  },

  async getOrganizationAnalytics(organizationId: string): Promise<any> {
    // Get all bots in organization
    const bots = await this.getBots(organizationId);
    const botIds = bots.map(b => b.id);

    if (botIds.length === 0) {
      return { totalConversations: 0, totalTokens: 0, botStats: [] };
    }

    // Get total conversations across all bots
    const { count: totalConversations } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .in('bot_id', botIds);

    // Get total tokens across all bots
    const { data: usageLogs } = await supabase
      .from('usage_logs')
      .select('tokens_used, bot_id')
      .in('bot_id', botIds);

    const totalTokens = usageLogs?.reduce((sum, log) => sum + log.tokens_used, 0) || 0;

    // Get stats per bot
    const botStats = await Promise.all(
      bots.map(async (bot) => {
        const analytics = await this.getBotAnalytics(bot.id);
        return {
          botId: bot.id,
          botName: bot.name,
          ...analytics
        };
      })
    );

    return {
      totalConversations: totalConversations || 0,
      totalTokens,
      botStats
    };
  }
};
