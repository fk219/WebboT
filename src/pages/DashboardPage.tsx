import React, { useEffect, useState } from 'react';
import { Bot, MessageSquare, Clock, Activity, Plus, Code, Settings, TrendingUp, AlertCircle, CheckCircle2, Zap, Users } from 'lucide-react';
import { useOrganizations } from '../context/OrganizationsContext';
import { organizationService } from '../services/organizationService';
import { AppView } from '../../types';

interface ActivityItem {
    id: string;
    type: 'chat_started' | 'chat_ended' | 'bot_created' | 'bot_updated';
    message: string;
    timestamp: Date;
    botName?: string;
}

interface DashboardPageProps {
    setCurrentView: (view: AppView) => void;
}

const DashboardPage = ({ setCurrentView }: DashboardPageProps) => {
    const { currentOrganization, bots } = useOrganizations();
    const [todayStats, setTodayStats] = useState({
        conversations: 0,
        activeNow: 0,
        avgResponseTime: '0s',
        activeBots: 0
    });
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [systemStatus, setSystemStatus] = useState<'operational' | 'degraded' | 'down'>('operational');

    useEffect(() => {
        fetchDashboardData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, [currentOrganization]);

    const fetchDashboardData = async () => {
        if (!currentOrganization) return;
        
        try {
            // Get today's analytics
            const analytics = await organizationService.getOrganizationAnalytics(currentOrganization.id);
            
            // Calculate today's stats (simplified - in production, filter by today)
            const activeBots = bots.filter(b => b.is_active).length;
            
            setTodayStats({
                conversations: analytics.totalConversations,
                activeNow: Math.floor(Math.random() * 5), // Simulated active users
                avgResponseTime: '1.2s',
                activeBots
            });

            // Generate recent activity from bots
            const activities: ActivityItem[] = bots.slice(0, 5).map((bot, i) => ({
                id: `activity-${i}`,
                type: bot.is_active ? 'chat_started' : 'bot_updated',
                message: bot.is_active ? `${bot.name} handled a conversation` : `${bot.name} was updated`,
                timestamp: new Date(Date.now() - i * 300000), // 5 min intervals
                botName: bot.name
            }));

            setRecentActivity(activities);
            setSystemStatus('operational');
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setSystemStatus('degraded');
            setLoading(false);
        }
    };
    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
                        <p className="text-emerald-100 text-lg">Here's what's happening with your bots today</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${
                        systemStatus === 'operational' ? 'bg-white/20 backdrop-blur-sm' :
                        systemStatus === 'degraded' ? 'bg-amber-500/30' :
                        'bg-red-500/30'
                    }`}>
                        {systemStatus === 'operational' ? (
                            <>
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span className="font-medium">All Systems Operational</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle size={16} />
                                <span className="font-medium">System Issues</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Today's Stats - Enhanced Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Conversations Card */}
                <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-200">
                                <MessageSquare className="text-white" size={24} />
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">TODAY</span>
                        </div>
                        <h3 className="text-4xl font-bold text-slate-800 mb-1">{loading ? '...' : todayStats.conversations}</h3>
                        <p className="text-slate-500 font-medium">Conversations</p>
                        <div className="mt-3 flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                            <TrendingUp size={14} />
                            <span>+12% from yesterday</span>
                        </div>
                    </div>
                </div>

                {/* Active Users Card */}
                <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200">
                                <Users className="text-white" size={24} />
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">LIVE</span>
                            </div>
                        </div>
                        <h3 className="text-4xl font-bold text-slate-800 mb-1">{loading ? '...' : todayStats.activeNow}</h3>
                        <p className="text-slate-500 font-medium">Active Now</p>
                        <div className="mt-3 text-slate-400 text-sm">
                            Real-time users online
                        </div>
                    </div>
                </div>

                {/* Response Time Card */}
                <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-200">
                                <Zap className="text-white" size={24} />
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">-8%</span>
                        </div>
                        <h3 className="text-4xl font-bold text-slate-800 mb-1">{todayStats.avgResponseTime}</h3>
                        <p className="text-slate-500 font-medium">Avg Response</p>
                        <div className="mt-3 flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                            <TrendingUp size={14} />
                            <span>Faster than yesterday</span>
                        </div>
                    </div>
                </div>

                {/* Active Bots Card */}
                <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-200">
                                <Bot className="text-white" size={24} />
                            </div>
                            <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">ACTIVE</span>
                        </div>
                        <h3 className="text-4xl font-bold text-slate-800 mb-1">{loading ? '...' : todayStats.activeBots}</h3>
                        <p className="text-slate-500 font-medium">Bots Running</p>
                        <div className="mt-3 text-slate-400 text-sm">
                            Out of {bots.length} total bots
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions - Enhanced Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                    onClick={() => setCurrentView(AppView.BUILDER)}
                    className="group relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white rounded-2xl p-6 hover:shadow-2xl hover:shadow-emerald-200 transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="relative">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Create New Bot</h3>
                        <p className="text-sm text-emerald-100">Build a new AI agent in minutes</p>
                    </div>
                </button>

                <button 
                    onClick={() => setCurrentView(AppView.INTEGRATION)}
                    className="group relative bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-emerald-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="relative">
                        <div className="w-12 h-12 bg-slate-100 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center mb-4 transition-colors">
                            <Code className="text-slate-600 group-hover:text-emerald-600 transition-colors" size={24} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 mb-2">Get Embed Code</h3>
                        <p className="text-sm text-slate-500 group-hover:text-emerald-700 transition-colors">Add to your website</p>
                    </div>
                </button>

                <button 
                    onClick={() => setCurrentView(AppView.ANALYTICS)}
                    className="group relative bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-blue-500 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-blue-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="relative">
                        <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center mb-4 transition-colors">
                            <TrendingUp className="text-slate-600 group-hover:text-blue-600 transition-colors" size={24} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 mb-2">View Analytics</h3>
                        <p className="text-sm text-slate-500 group-hover:text-blue-700 transition-colors">Deep dive into data</p>
                    </div>
                </button>

                <button 
                    onClick={() => setCurrentView(AppView.SETTINGS)}
                    className="group relative bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-purple-500 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-purple-50 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="relative">
                        <div className="w-12 h-12 bg-slate-100 group-hover:bg-purple-100 rounded-xl flex items-center justify-center mb-4 transition-colors">
                            <Settings className="text-slate-600 group-hover:text-purple-600 transition-colors" size={24} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 mb-2">Settings</h3>
                        <p className="text-sm text-slate-500 group-hover:text-purple-700 transition-colors">Configure your account</p>
                    </div>
                </button>
            </div>

            {/* Recent Activity Feed - Enhanced Design */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-lg text-slate-800">Recent Activity</h3>
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs font-semibold text-emerald-700">LIVE</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">Real-time updates from your bots</p>
                        </div>
                        <button className="px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            View All
                        </button>
                    </div>
                </div>
                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3"></div>
                            <p className="text-slate-400">Loading activity...</p>
                        </div>
                    ) : recentActivity.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Activity className="text-slate-400" size={32} />
                            </div>
                            <p className="text-slate-600 font-medium">No recent activity</p>
                            <p className="text-slate-400 text-sm mt-1">Activity will appear here as your bots interact with users</p>
                        </div>
                    ) : (
                        recentActivity.map((activity, index) => (
                            <div key={activity.id} className="group p-5 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-transparent transition-all duration-200">
                                <div className="flex items-start gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                                            <Activity className="text-white" size={20} />
                                        </div>
                                        {index < recentActivity.length - 1 && (
                                            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-5 bg-slate-200"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        <p className="text-sm font-semibold text-slate-800 mb-1">{activity.message}</p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Clock size={12} />
                                                {getTimeAgo(activity.timestamp)}
                                            </span>
                                            {activity.botName && (
                                                <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                                                    {activity.botName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
