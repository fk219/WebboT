
import { supabase } from '../lib/supabase';
import { AgentConfig } from '../../types';

export interface UserProfile {
    id: string;
    email: string;
    subscription_tier: 'free' | 'pro';
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    created_at: string;
}

export interface Project {
    id: string;
    user_id: string;
    name: string;
    config: AgentConfig;
    created_at: string;
}

export interface UsageLog {
    id: string;
    project_id: string;
    user_id: string;
    tokens_used: number;
    created_at: string;
}

export const supabaseService = {
    // Expose supabase client for direct queries when needed
    supabase,

    // Profile
    async getProfile(userId: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
        return data;
    },

    // Projects
    async getProjects(userId: string): Promise<Project[]> {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching projects:', error);
            return [];
        }
        return data || [];
    },

    async createProject(userId: string, name: string, config: AgentConfig): Promise<Project | null> {
        const { data, error } = await supabase
            .from('projects')
            .insert([{ user_id: userId, name, config }])
            .select()
            .single();

        if (error) {
            console.error('Error creating project:', error);
            return null;
        }
        return data;
    },

    async updateProject(projectId: string, config: AgentConfig, name?: string): Promise<boolean> {
        const updates: any = { config };
        if (name) updates.name = name;

        const { error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', projectId);

        if (error) {
            console.error('Error updating project:', error);
            return false;
        }
        return true;
    },

    async deleteProject(projectId: string): Promise<boolean> {
        try {
            // Delete related records first (if CASCADE is not set up)
            // This is a fallback - ideally CASCADE should handle this
            await supabase
                .from('usage_logs')
                .delete()
                .eq('project_id', projectId);

            // Delete chat messages through sessions
            const { data: sessions } = await supabase
                .from('chat_sessions')
                .select('id')
                .eq('project_id', projectId);

            if (sessions && sessions.length > 0) {
                const sessionIds = sessions.map(s => s.id);
                await supabase
                    .from('chat_messages')
                    .delete()
                    .in('session_id', sessionIds);
            }

            // Delete chat sessions
            await supabase
                .from('chat_sessions')
                .delete()
                .eq('project_id', projectId);

            // Finally delete the project
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId);

            if (error) {
                console.error('Error deleting project:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            return false;
        }
    },

    // Usage
    async checkUsageAvailability(userId: string, projectId?: string, estimatedTokens: number = 0): Promise<boolean> {
        // In a real app, this should be an Edge Function to be secure.
        // For MVP, we check client-side but acknowledge the risk.

        // 1. Get subscription tier
        const profile = await this.getProfile(userId);
        if (!profile) return false;

        if (profile.subscription_tier === 'pro') return true; // Unlimited for pro (or high limit)

        // 2. Check usage for current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('usage_logs')
            .select('tokens_used')
            .eq('user_id', userId)
            .gte('created_at', startOfMonth.toISOString());

        if (error) {
            console.error('Error checking usage:', error);
            return false;
        }

        const totalTokensUsed = data?.reduce((acc, log) => acc + log.tokens_used, 0) || 0;
        const FREE_TIER_LIMIT = 50000; // Example: 50k tokens for free tier

        return (totalTokensUsed + estimatedTokens) < FREE_TIER_LIMIT;
    },

    async getUsage(userId: string): Promise<number> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('usage_logs')
            .select('tokens_used')
            .eq('user_id', userId)
            .gte('created_at', startOfMonth.toISOString());

        if (error) {
            console.error('Error fetching usage:', error);
            return 0;
        }

        return data?.reduce((sum, record) => sum + record.tokens_used, 0) || 0;
    },

    async recordUsage(userId: string, projectId: string, tokens: number): Promise<void> {
        const { error } = await supabase
            .from('usage_logs')
            .insert([{ user_id: userId, project_id: projectId, tokens_used: tokens }]);

        if (error) {
            console.error('Error recording usage:', error);
        }
    },

    // Chat History & Analytics
    async createSession(projectId: string, userId?: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('chat_sessions')
            .insert([{ project_id: projectId, user_id: userId }])
            .select('id')
            .single();

        if (error) {
            console.error('Error creating session:', error);
            return null;
        }
        return data.id;
    },

    async saveChatMessage(sessionId: string, role: 'user' | 'model', text: string): Promise<void> {
        const { error } = await supabase
            .from('chat_messages')
            .insert([{ session_id: sessionId, role, text, timestamp: new Date().toISOString() }]);

        if (error) {
            console.error('Error saving message:', error);
        }
    },

    async getChatHistory(projectId: string): Promise<any[]> {
        // Fetch sessions with their messages
        const { data: sessions, error } = await supabase
            .from('chat_sessions')
            .select(`
                id, 
                created_at, 
                chat_messages (
                    id, role, text, timestamp
                )
            `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching history:', error);
            return [];
        }

        return sessions.map(session => ({
            ...session,
            messages: session.chat_messages.sort((a: any, b: any) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            )
        }));
    },

    async getAnalytics(userId: string): Promise<any> {
        // 1. Get all projects for user
        const projects = await this.getProjects(userId);
        const projectIds = projects.map(p => p.id);

        if (projectIds.length === 0) return { totalConversations: 0, totalTokens: 0, dailyStats: [] };

        // 2. Get total conversations (sessions)
        const { count: totalConversations } = await supabase
            .from('chat_sessions')
            .select('*', { count: 'exact', head: true })
            .in('project_id', projectIds);

        // 3. Get total tokens
        const totalTokens = await this.getUsage(userId);

        // 4. Get daily stats (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: usageLogs } = await supabase
            .from('usage_logs')
            .select('created_at, tokens_used')
            .eq('user_id', userId)
            .gte('created_at', sevenDaysAgo.toISOString());

        // Aggregate by day
        const dailyStats: Record<string, number> = {};
        usageLogs?.forEach(log => {
            const date = new Date(log.created_at).toLocaleDateString();
            dailyStats[date] = (dailyStats[date] || 0) + log.tokens_used;
        });

        return {
            totalConversations: totalConversations || 0,
            totalTokens,
            dailyStats: Object.entries(dailyStats).map(([date, tokens]) => ({ date, tokens }))
        };
    }
};
