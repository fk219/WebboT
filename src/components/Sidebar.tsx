import React, { memo } from 'react';
import {
  LayoutDashboard,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  Code,
  History,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Check,
  Plus,
  X,
  Edit2,
  Folder,
  Sparkles
} from 'lucide-react';
import { AppView } from '../../types';

interface SidebarProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  currentView: AppView | 'projects';
  setCurrentView: (view: AppView | 'projects') => void;
  organizations: any[];
  currentProject: any;
  showProjectDropdown: boolean;
  setShowProjectDropdown: (show: boolean) => void;
  handleSwitchProject: (project: any) => void;
  handleRenameProject: (project: any, e: React.MouseEvent) => void;
  handleDeleteOrganization: (project: any, e: React.MouseEvent) => void;
  setShowCreateModal: (show: boolean) => void;
  profile: any;
  userEmail: string;
  signOut: () => void;
  isPro: boolean;
}

const Sidebar = memo(({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  currentView,
  setCurrentView,
  organizations,
  currentProject,
  showProjectDropdown,
  setShowProjectDropdown,
  handleSwitchProject,
  handleRenameProject,
  handleDeleteOrganization,
  setShowCreateModal,
  profile,
  userEmail,
  signOut,
  isPro
}: SidebarProps) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', view: AppView.DASHBOARD },
    { icon: Bot, label: 'Simple Builder', view: AppView.BUILDER },
    { icon: Sparkles, label: 'LangGraph Agents', view: AppView.AGENTS, badge: 'New' },
    { icon: BarChart3, label: 'Analytics', view: AppView.ANALYTICS },
    { icon: History, label: 'History', view: AppView.HISTORY },
    { icon: Code, label: 'Integration', view: AppView.INTEGRATION },
    { icon: Settings, label: 'Settings', view: AppView.SETTINGS },
    { icon: CreditCard, label: 'Billing', view: AppView.BILLING, badge: !isPro ? 'Upgrade' : undefined }
  ];

  return (
    <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-[#0f172a] border-r border-slate-800 p-4 flex flex-col transition-all duration-300 relative flex-shrink-0`}>
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="absolute -right-3 top-8 bg-slate-800 text-slate-400 p-1 rounded-full border border-slate-700 hover:text-white transition-colors z-10"
        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isSidebarCollapsed ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
      </button>

      {/* Logo and Project Switcher */}
      <div className={`mb-8 ${isSidebarCollapsed ? 'items-center justify-center' : ''} flex flex-col`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Bot className="text-white" size={24} />
          </div>
          {!isSidebarCollapsed && (
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight">Web<span className="text-emerald-400">bot</span></h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Enterprise Agent</p>
            </div>
          )}
        </div>

        {/* Project Selector */}
        {!isSidebarCollapsed ? (
          <div className="relative">
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0">
                  {currentProject?.name.substring(0, 1) || 'A'}
                </div>
                <span className="text-sm font-medium text-slate-200 truncate min-w-0">{currentProject?.name || 'My Agent'}</span>
              </div>
              <ChevronDown size={14} className={`text-slate-500 transition-transform flex-shrink-0 ${showProjectDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Organization Dropdown */}
            {showProjectDropdown && (
              <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-20 animate-fade-in">
                {organizations.map(p => (
                  <div key={p.id} className="group/item">
                    <div onClick={() => handleSwitchProject(p)} className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-xs text-slate-300 flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="truncate">{p.name}</span>
                        {currentProject?.id === p.id && <Check size={12} className="text-emerald-400 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleRenameProject(p, e)}
                          className="p-1 text-slate-500 hover:text-blue-400 hover:bg-slate-600 rounded transition-colors"
                          title="Rename"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteOrganization(p, e)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-600 rounded transition-colors"
                          title="Delete"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700 border-t border-slate-700 cursor-pointer text-xs text-emerald-400 font-medium flex items-center gap-2">
                  <Plus size={12} /> New Project
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative group">
            <div className="w-10 h-10 mx-auto rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-emerald-400 text-xs font-bold cursor-pointer hover:bg-slate-800">
              {currentProject?.name.substring(0, 1) || 'A'}
            </div>
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-700 top-1/2 -translate-y-1/2">
              {currentProject?.name || 'My Agent'}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;

          return (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start'} gap-3 px-3 py-2.5 rounded-lg transition-all relative group ${isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!isSidebarCollapsed && (
                <>
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-700">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile and Sign Out */}
      <div className="pt-4 border-t border-slate-800">
        {!isSidebarCollapsed && (
          <>
            {/* Profile Completion */}
            {(() => {
              // Check which fields are filled
              const fields = [
                profile?.email,
                profile?.full_name,
                profile?.company_name,
                profile?.phone_number
              ];
              const completed = fields.filter(f => f && String(f).trim() !== '').length;
              const percentage = Math.round((completed / fields.length) * 100);

              // Debug log
              console.log('Profile completion:', {
                email: profile?.email,
                full_name: profile?.full_name,
                company_name: profile?.company_name,
                phone_number: profile?.phone_number,
                completed,
                percentage
              });

              if (percentage < 100) {
                return (
                  <div className="mb-3 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-400">Profile</span>
                      <span className="text-xs font-medium text-emerald-400">{percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </>
        )}

        <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {profile?.full_name ?
              profile.full_name.substring(0, 2).toUpperCase() :
              (userEmail ? userEmail.substring(0, 2).toUpperCase() : 'U')
            }
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.full_name || userEmail?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            </div>
          )}
          {!isSidebarCollapsed && (
            <button onClick={signOut} className="text-slate-500 hover:text-white transition-colors">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
