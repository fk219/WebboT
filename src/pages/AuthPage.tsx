
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bot, Loader2, ArrowRight, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
    const { signInWithEmail, signUp } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password);
                if (error) throw error;
                setSuccessMessage('Account created successfully! Please check your email to confirm your account before signing in.');
                setIsSignUp(false); // Switch to login view
            } else {
                const { error } = await signInWithEmail(email, password);
                if (error) throw error;
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            if (err.message === 'Invalid login credentials') {
                setError('Invalid email or password. If you haven\'t created an account yet, please switch to Sign Up.');
            } else {
                setError(err.message || 'An error occurred during authentication.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 font-sans bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]">
            <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6">
                            <Bot className="text-white" size={32} />
                        </div>
                        <h1 className="text-2xl font-medium text-slate-900 mb-2 tracking-tight">Welcome to Verdant<span className="text-emerald-500">AI</span></h1>
                        <p className="text-slate-500 text-sm">
                            Create intelligent, nature-inspired AI agents.
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-100/80 rounded-xl mb-6 backdrop-blur-sm">
                        <button
                            onClick={() => { setIsSignUp(false); setError(null); setSuccessMessage(null); }}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${!isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <LogIn size={16} />
                            Sign In
                        </button>
                        <button
                            onClick={() => { setIsSignUp(true); setError(null); setSuccessMessage(null); }}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <UserPlus size={16} />
                            Sign Up
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                            <div className="mt-0.5 min-w-[4px] h-4 bg-red-500 rounded-full"></div>
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg border border-emerald-100 flex items-start gap-2">
                            <div className="mt-0.5 min-w-[4px] h-4 bg-emerald-500 rounded-full"></div>
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5 ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                            {isSignUp && <p className="text-xs text-slate-400 mt-1 ml-1">Must be at least 6 characters</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 disabled:cursor-wait mt-6 shadow-lg shadow-slate-900/20"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                                    <ArrowRight size={16} className="opacity-50" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-xs text-slate-400 mt-6 text-center">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
                <div className="bg-slate-50/50 p-4 text-center border-t border-slate-100 backdrop-blur-sm">
                    <p className="text-xs text-slate-500">Trusted by 10,000+ developers</p>
                </div>
            </div>
        </div>
    );
}
