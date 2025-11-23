import React from 'react';
import { CheckCircle2, Zap, Shield, CreditCard } from 'lucide-react';

export default function BillingPage() {
    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            {/* Page Title with Gradient */}
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Billing & Plans</h1>
                        <p className="text-emerald-100 mt-2">Manage your subscription and usage limits</p>
                    </div>
                    <button className="px-6 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all text-sm font-semibold shadow-lg">
                        Manage Subscription
                    </button>
                </div>
            </div>

            {/* Current Plan Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">Current Plan</h2>
                    <p className="text-sm text-slate-500 mt-1">Your active subscription details</p>
                </div>
                
                <div className="p-6">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-2">Active Plan</p>
                            <h2 className="text-3xl font-bold text-slate-800">Pro Plan</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Renewal Date</p>
                            <p className="text-xl font-semibold text-slate-800">Dec 24, 2025</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600 font-medium">Token Usage</span>
                            <span className="text-slate-800 font-semibold">482k / 2M</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 w-[24%] rounded-full shadow-sm"></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">24% of monthly limit used</p>
                    </div>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Free Plan */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-slate-800 mb-2">Starter</h3>
                        <div className="text-3xl font-light text-slate-900">Free</div>
                    </div>
                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                            <CheckCircle2 size={18} className="text-emerald-500" /> 1 Agent
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                            <CheckCircle2 size={18} className="text-emerald-500" /> 50k Tokens/mo
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                            <CheckCircle2 size={18} className="text-emerald-500" /> Standard Support
                        </li>
                    </ul>
                    <button className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                        Upgrade
                    </button>
                </div>

                {/* Pro Plan */}
                <div className="bg-white p-8 rounded-2xl border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 relative">
                    <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
                        Current
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-slate-800 mb-2">Pro</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-medium text-slate-900">$29</span>
                            <span className="text-slate-500">/mo</span>
                        </div>
                    </div>
                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                            <CheckCircle2 size={18} className="text-emerald-500" /> 5 Agents
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                            <CheckCircle2 size={18} className="text-emerald-500" /> 2M Tokens/mo
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                            <CheckCircle2 size={18} className="text-emerald-500" /> Priority Support
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                            <CheckCircle2 size={18} className="text-emerald-500" /> No Branding
                        </li>
                    </ul>
                    <button className="w-full py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200">
                        Current Plan
                    </button>
                </div>

                {/* Enterprise Plan */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-slate-800 mb-2">Enterprise</h3>
                        <div className="text-3xl font-light text-slate-900">Custom</div>
                    </div>
                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                            <CheckCircle2 size={18} className="text-emerald-500" /> Unlimited Agents
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                            <CheckCircle2 size={18} className="text-emerald-500" /> Custom Token Limits
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                            <CheckCircle2 size={18} className="text-emerald-500" /> Dedicated Account Manager
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                            <CheckCircle2 size={18} className="text-emerald-500" /> SLA
                        </li>
                    </ul>
                    <button className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                        Contact Sales
                    </button>
                </div>
            </div>
        </div>
    );
}
