import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabaseService } from '../services/supabaseService';
import { UserProfile } from '../../types';
import { useNotifications } from '../context/NotificationsContext';

export default function SettingsPage() {
  const { user, refreshProfile } = useAuth();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabaseService.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      addNotification('error', 'Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabaseService.supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          company_name: profile.company_name,
          phone_number: profile.phone_number,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile in AuthContext
      await refreshProfile();
      
      addNotification('success', 'Profile Updated', 'Your profile has been saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      addNotification('error', 'Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-emerald-600 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent border-t-emerald-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-slate-600 animate-pulse">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Title with Gradient */}
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-emerald-100 mt-2">Manage your personal information and account preferences</p>
      </div>

      {/* Profile Information Section */}
      <div className="bg-white rounded-2xl border border-slate-200 mb-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Personal Information</h2>
          <p className="text-sm text-slate-500 mt-1">Update your personal details and contact information</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Email (Read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email || ''}
                disabled
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1.5">Email cannot be changed</p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={profile.company_name || ''}
                onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                placeholder="Acme Inc."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={profile.phone_number || ''}
                onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={loadProfile}
              className="px-5 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              {saving ? (
                <>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Subscription & Billing</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your subscription plan and billing information</p>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-2">Current Plan</p>
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold capitalize">
                  {profile.subscription_tier}
                </span>
                {profile.subscription_tier === 'free' && (
                  <span className="text-xs text-slate-500">Limited features</span>
                )}
              </div>
            </div>
            {profile.subscription_tier === 'free' && (
              <button className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 font-medium transition-all shadow-sm hover:shadow-md">
                Upgrade to Pro →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
