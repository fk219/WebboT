import React, { useEffect, useState } from 'react';
import { MessageSquare, Filter, ChevronDown, Clock, Zap, User, Bot, Calendar, Download, Search, X } from 'lucide-react';
import { useOrganizations } from '../context/OrganizationsContext';
import { organizationService } from '../services/organizationService';

interface ChatSession {
    id: string;
    bot_id: string;
    bot_name: string;
    user_id: string | null;
    created_at: string;
    message_count: number;
    tokens_used: number;
    duration: string;
    messages: ChatMessage[];
}

interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: string;
}

const HistoryPage = () => {
    const { currentOrganization, bots } = useOrganizations();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [showTranscript, setShowTranscript] = useState(false);
    const [filterBot, setFilterBot] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

    useEffect(() => {
        fetchHistory();
    }, [currentOrganization]);

    useEffect(() => {
        applyFilters();
    }, [sessions, filterBot, searchQuery, dateRange]);

    const fetchHistory = async () => {
        if (!currentOrganization) return;
        
        setLoading(true);
        try {
            // Fetch all sessions for the organization's bots
            const allSessions: ChatSession[] = [];
            
            for (const bot of bots) {
                // Simulated data - in production, fetch from Supabase
                const botSessions = Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => {
                    const date = new Date();
                    date.setHours(date.getHours() - Math.floor(Math.random() * 168)); // Last week
                    const messageCount = Math.floor(Math.random() * 20) + 5;
                    const tokensUsed = messageCount * Math.floor(Math.random() * 100 + 50);
                    
                    return {
                        id: `session-${bot.id}-${i}`,
                        bot_id: bot.id,
                        bot_name: bot.name,
                        user_id: Math.random() > 0.5 ? `user-${i}` : null,
                        created_at: date.toISOString(),
                        message_count: messageCount,
                        tokens_used: tokensUsed,
                        duration: `${Math.floor(Math.random() * 15) + 1}m`,
                        messages: []
                    };
                });
                allSessions.push(...botSessions);
            }
            
            // Sort by date
            allSessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setSessions(allSessions);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...sessions];

        // Filter by bot
        if (filterBot !== 'all') {
            filtered = filtered.filter(s => s.bot_id === filterBot);
        }

        // Filter by date range
        const now = new Date();
        if (dateRange === 'today') {
            filtered = filtered.filter(s => {
                const sessionDate = new Date(s.created_at);
                return sessionDate.toDateString() === now.toDateString();
            });
        } else if (dateRange === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(s => new Date(s.created_at) >= weekAgo);
        } else if (dateRange === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(s => new Date(s.created_at) >= monthAgo);
        }

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(s => 
                s.bot_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.user_id && s.user_id.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredSessions(filtered);
    };

    const getTotalTokens = () => filteredSessions.reduce((sum, s) => sum + s.tokens_used, 0);
    const getTotalSessions = () => filteredSessions.length;
    const getAvgTokensPerSession = () => Math.round(getTotalTokens() / (getTotalSessions() || 1));

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const exportToCSV = () => {
        const csv = [
            ['Session ID', 'Bot', 'User', 'Date', 'Messages', 'Tokens', 'Duration'],
            ...filteredSessions.map(s => [
                s.id,
                s.bot_name,
                s.user_id || 'Anonymous',
                new Date(s.created_at).toLocaleString(),
                s.message_count,
                s.tokens_used,
                s.duration
            ])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Conversation History</h1>
                        <p className="text-emerald-100 mt-2">Review past interactions and token usage</p>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all text-sm font-semibold shadow-lg"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-emerald-50">
                            <MessageSquare className="text-emerald-600" size={20} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{getTotalSessions()}</h3>
                    <p className="text-sm text-slate-500 mt-1">Total Sessions</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                            <Zap className="text-blue-600" size={20} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{getTotalTokens().toLocaleString()}</h3>
                    <p className="text-sm text-slate-500 mt-1">Total Tokens Used</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-purple-50">
                            <Bot className="text-purple-600" size={20} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">{getAvgTokensPerSession()}</h3>
                    <p className="text-sm text-slate-500 mt-1">Avg Tokens/Session</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search sessions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                    </div>

                    {/* Bot Filter */}
                    <select
                        value={filterBot}
                        onChange={(e) => setFilterBot(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    >
                        <option value="all">All Bots</option>
                        {bots.map(bot => (
                            <option key={bot.id} value={bot.id}>{bot.name}</option>
                        ))}
                    </select>

                    {/* Date Range */}
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as any)}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                    </select>

                    {/* Clear Filters */}
                    {(filterBot !== 'all' || searchQuery || dateRange !== 'all') && (
                        <button
                            onClick={() => {
                                setFilterBot('all');
                                setSearchQuery('');
                                setDateRange('all');
                            }}
                            className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm text-slate-600"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Sessions Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Session</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Bot</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Messages</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Tokens</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                        Loading sessions...
                                    </td>
                                </tr>
                            ) : filteredSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <MessageSquare className="mx-auto text-slate-300 mb-3" size={48} />
                                        <p className="text-slate-600 font-medium">No sessions found</p>
                                        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredSessions.map((session) => (
                                    <tr
                                        key={session.id}
                                        onClick={() => {
                                            setSelectedSession(session);
                                            setShowTranscript(true);
                                        }}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                    <MessageSquare className="text-emerald-600" size={18} />
                                                </div>
                                                <span className="text-sm font-mono text-slate-600">{session.id.substring(0, 12)}...</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-800">{session.bot_name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="text-slate-400" size={14} />
                                                <span className="text-sm text-slate-600">{session.user_id || 'Anonymous'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-semibold text-slate-800">{session.message_count}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Zap className="text-amber-500" size={14} />
                                                <span className="text-sm font-semibold text-slate-800">{session.tokens_used.toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm text-slate-600">{session.duration}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                                <Clock size={14} />
                                                {formatDate(session.created_at)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transcript Modal */}
            {showTranscript && selectedSession && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowTranscript(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Session Transcript</h2>
                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                                    <span className="flex items-center gap-1.5">
                                        <Bot size={14} />
                                        {selectedSession.bot_name}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <MessageSquare size={14} />
                                        {selectedSession.message_count} messages
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Zap size={14} className="text-amber-500" />
                                        {selectedSession.tokens_used.toLocaleString()} tokens
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock size={14} />
                                        {selectedSession.duration}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowTranscript(false)}
                                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] bg-slate-50">
                            <div className="max-w-3xl mx-auto space-y-4">
                                <div className="text-center text-sm text-slate-500 mb-6">
                                    Session started on {new Date(selectedSession.created_at).toLocaleString()}
                                </div>
                                
                                {/* Placeholder messages */}
                                {Array.from({ length: selectedSession.message_count }, (_, i) => {
                                    const isUser = i % 2 === 0;
                                    return (
                                        <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
                                                <div className={`px-4 py-3 rounded-2xl ${
                                                    isUser
                                                        ? 'bg-emerald-600 text-white rounded-tr-none'
                                                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                                }`}>
                                                    <p className="text-sm">
                                                        {isUser
                                                            ? `User message ${Math.floor(i / 2) + 1}`
                                                            : `Bot response ${Math.floor(i / 2) + 1}`}
                                                    </p>
                                                </div>
                                                <div className={`flex items-center gap-2 mt-1 text-xs text-slate-500 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                    <span>{new Date(selectedSession.created_at).toLocaleTimeString()}</span>
                                                    {!isUser && (
                                                        <span className="flex items-center gap-1">
                                                            <Zap size={10} className="text-amber-500" />
                                                            {Math.floor(selectedSession.tokens_used / (selectedSession.message_count / 2))} tokens
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
