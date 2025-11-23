import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts';
import { Calendar, Download, TrendingUp, Users, MessageSquare, Zap, Clock, Target, ChevronDown } from 'lucide-react';
import { useOrganizations } from '../context/OrganizationsContext';
import { organizationService } from '../services/organizationService';

const AnalyticsPage = () => {
    const { currentOrganization, bots } = useOrganizations();
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);
    const [botPerformance, setBotPerformance] = useState<any[]>([]);
    const [metrics, setMetrics] = useState({
        totalConversations: 0,
        activeUsers: 0,
        avgResponseTime: '1.2s',
        engagementRate: '68%',
        totalTokens: 0,
        successRate: '95%'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [currentOrganization, dateRange]);

    const fetchAnalytics = async () => {
        if (!currentOrganization) return;

        try {
            const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const analytics = await organizationService.getOrganizationAnalytics(currentOrganization.id, startDate);

            // Generate chart data for the selected period
            const chartDataMap: Record<string, any> = {};

            // Initialize map with 0s
            for (let i = 0; i < days; i++) {
                const d = new Date();
                d.setDate(d.getDate() - (days - i - 1));
                const dateStr = d.toLocaleDateString();
                const dayName = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                chartDataMap[dateStr] = {
                    name: dayName,
                    conversations: 0,
                    tokens: 0,
                    responseTime: 0,
                    engagement: 0
                };
            }

            // Fill with real data
            analytics.botStats.forEach((bot: any) => {
                bot.dailyStats.forEach((day: any) => {
                    if (chartDataMap[day.date]) {
                        chartDataMap[day.date].conversations += day.conversations;
                        chartDataMap[day.date].tokens += day.tokens;
                    }
                });
            });

            const generatedData = Object.values(chartDataMap);
            setChartData(generatedData);

            // Calculate metrics
            setMetrics({
                totalConversations: analytics.totalConversations,
                activeUsers: Math.floor(analytics.totalConversations * 0.8), // Estimate
                avgResponseTime: '1.2s', // Placeholder
                engagementRate: '68%', // Placeholder
                totalTokens: analytics.totalTokens,
                successRate: '95%' // Placeholder
            });

            // Bot performance data
            const botStats = analytics.botStats.map((bot: any) => {
                const originalBot = bots.find(b => b.id === bot.botId);
                return {
                    name: bot.botName,
                    conversations: bot.totalConversations,
                    successRate: Math.floor(Math.random() * 10) + 90, // Placeholder
                    avgResponse: (Math.random() * 1 + 0.5).toFixed(1), // Placeholder
                    isActive: originalBot?.is_active ?? true
                };
            }).sort((a: any, b: any) => b.conversations - a.conversations);

            setBotPerformance(botStats);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setLoading(false);
        }
    };
    const exportData = () => {
        const csv = [
            ['Date', 'Conversations', 'Tokens', 'Response Time', 'Engagement'],
            ...chartData.map(d => [d.name, d.conversations, d.tokens, d.responseTime, d.engagement])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Analytics</h1>
                        <p className="text-emerald-100 mt-2">Deep insights into your bot performance and trends</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all text-sm font-semibold"
                            >
                                <Calendar size={16} />
                                <span>
                                    {dateRange === '7d' ? 'Last 7 Days' :
                                        dateRange === '30d' ? 'Last 30 Days' :
                                            'Last 90 Days'}
                                </span>
                                <ChevronDown size={16} />
                            </button>
                            {showDatePicker && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                                    {['7d', '30d', '90d'].map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => {
                                                setDateRange(range as any);
                                                setShowDatePicker(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-emerald-50 text-slate-700"
                                        >
                                            {range === '7d' ? 'Last 7 Days' :
                                                range === '30d' ? 'Last 30 Days' :
                                                    'Last 90 Days'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={exportData}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all text-sm font-semibold shadow-lg"
                        >
                            <Download size={18} />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Detailed Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-emerald-50">
                            <MessageSquare className="text-emerald-600" size={18} />
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                            +12.5%
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : metrics.totalConversations.toLocaleString()}</h3>
                    <p className="text-xs text-slate-500 mt-1">Total Conversations</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <Users className="text-blue-600" size={18} />
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                            +5.2%
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : metrics.activeUsers.toLocaleString()}</h3>
                    <p className="text-xs text-slate-500 mt-1">Active Users</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-purple-50">
                            <Clock className="text-purple-600" size={18} />
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                            -8.1%
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{metrics.avgResponseTime}</h3>
                    <p className="text-xs text-slate-500 mt-1">Avg Response Time</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-amber-50">
                            <TrendingUp className="text-amber-600" size={18} />
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                            +2.3%
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{metrics.engagementRate}</h3>
                    <p className="text-xs text-slate-500 mt-1">Engagement Rate</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-indigo-50">
                            <Zap className="text-indigo-600" size={18} />
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                            +15.3%
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{loading ? '...' : metrics.totalTokens.toLocaleString()}</h3>
                    <p className="text-xs text-slate-500 mt-1">Total Tokens</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-green-50">
                            <Target className="text-green-600" size={18} />
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                            +1.2%
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{metrics.successRate}</h3>
                    <p className="text-xs text-slate-500 mt-1">Success Rate</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversation Volume */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Conversation Volume</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="conversations" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorConv)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Token Usage */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Token Usage</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                                />
                                <Bar dataKey="tokens" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Response Time Trend */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Response Time Trend</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                                />
                                <Line type="monotone" dataKey="responseTime" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Engagement Rate */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-800 mb-4">Engagement Rate</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="engagement" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorEng)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bot Performance Table */}
            <div className="bg-white rounded-xl border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">Bot Performance Breakdown</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Comparative analysis of all your bots</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Bot Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Conversations</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Success Rate</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Avg Response</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading bot performance...</td>
                                </tr>
                            ) : botPerformance.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No bots found</td>
                                </tr>
                            ) : (
                                botPerformance.map((bot, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                    <MessageSquare className="text-emerald-600" size={16} />
                                                </div>
                                                <span className="font-medium text-slate-800">{bot.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bot.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${bot.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                                {bot.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-800">{bot.conversations.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-semibold text-emerald-600">{bot.successRate}%</span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600">{bot.avgResponse}s</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
