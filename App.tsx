import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
  Bell
} from 'lucide-react';
import { AgentConfig, AppView, BuilderTab } from './types';
import ChatWidget from './components/ChatWidget';
import { previewVoice } from './services/geminiService';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { OrganizationsProvider, useOrganizations } from './src/context/OrganizationsContext';
import { NotificationsProvider, useNotifications } from './src/context/NotificationsContext';
import AuthPage from './src/pages/AuthPage';
import SettingsPage from './src/pages/SettingsPage';
import BillingPage from './src/pages/BillingPage';
import { supabaseService, Project } from './src/services/supabaseService';
import AgentBuilderNew from './src/pages/AgentBuilderNew';
import AgentListPage from './src/pages/AgentListPage';
import AgentCreatePage from './src/pages/AgentCreatePage';
import AgentsRouter from './src/pages/AgentsRouter';
import HistoryPage from './src/pages/HistoryPage';
import AnalyticsPage from './src/pages/AnalyticsPage';
import DashboardPage from './src/pages/DashboardPage';
import IntegrationPageNew from './src/pages/IntegrationPageNew';
import ProjectsPage from './src/pages/ProjectsPage';
import WidgetPage from './src/pages/WidgetPage';
import { RequireAuth } from './src/components/RequireAuth';
import CreateProjectModal from './src/components/CreateProjectModal';
import ConfirmModal from './src/components/ConfirmModal';
import NotificationPanel from './src/components/NotificationPanel';
import Toast, { ToastType } from './src/components/Toast';
import LoadingSpinner, { LoadingOverlay, LoadingState } from './src/components/LoadingSpinner';
import Sidebar from './src/components/Sidebar';

// --- Mock Data ---

const INITIAL_AGENT: AgentConfig = {
  id: 'agent_01',
  name: 'Webbot Assistant',
  greeting: 'Hello! I am your Webbot AI assistant. How can I help you today?',
  systemInstruction: 'You are a helpful, professional, and concise AI assistant for a SaaS platform. Be polite and use an emerald/nature metaphor occasionally.',
  knowledgeContext: 'Webbot is a premium SaaS platform that allows businesses to embed Gemini-powered AI agents into their websites.',
  tools: ['googleSearch'],
  maxReplyTokens: 150,
  quickReplies: ['Pricing?', 'How does it work?', 'Contact Support'],
  voice: {
    enabled: true,
    name: 'Kore',
    language: 'English',
    speed: 1.0,
    pitch: 1.0,
    phoneCallEnabled: true,
    callButtonIcon: 'Phone'
  },
  theme: {
    primaryColor: '#10b981',
    headerColor: '#10b981',
    headerHeight: 'regular',
    headerTitleSize: 'md',
    headerTitleWeight: 'medium',
    headerBackgroundStyle: 'solid',
    userBubbleColor: '#f1f5f9',
    userBubbleRadius: 'xl',
    botBubbleColor: '#ffffff',
    botBubbleBorderColor: '#e2e8f0',
    botBubbleRadius: 'xl',
    bubbleShadow: true,
    sendButtonIcon: 'send',
    sendButtonStyle: 'solid',
    sendButtonColor: '#10b981',
    mode: 'light',
    fontFamily: 'inter',
    fontStyle: 'regular',
    radius: 'xl',
    avatarIcon: 'bot',
    showBranding: true,
  },
};

const AppLayout = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(INITIAL_AGENT);
  const [activeBuilderTab, setActiveBuilderTab] = useState<BuilderTab>('identity');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionProgress, setIngestionProgress] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [newQuickReply, setNewQuickReply] = useState('');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<string>('all');

  const { user, profile, signOut } = useAuth();
  const {
    organizations,
    currentOrganization,
    setCurrentOrganization,
    bots,
    currentBot,
    loading: organizationsLoading,
    createOrganization,
    updateOrganization,
    deleteOrganization
  } = useOrganizations();
  const isPro = profile?.subscription_tier === 'pro';
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const { addNotification, unreadCount } = useNotifications();

  // Load agent config when current bot changes
  useEffect(() => {
    if (currentBot?.config) {
      const loadedConfig = currentBot.config as AgentConfig;
      const configWithDefaults = {
        ...loadedConfig,
        voice: {
          enabled: true,
          name: 'Kore',
          language: 'English',
          speed: 1.0,
          pitch: 1.0,
          phoneCallEnabled: true,
          callButtonIcon: 'Phone',
          ...loadedConfig.voice,
        }
      };
      setAgentConfig(configWithDefaults);
    }
  }, [currentBot]);



  const handleSwitchOrganization = (org: any) => {
    setCurrentOrganization(org);
    setShowOrgDropdown(false);
    // Navigate to builder when switching organizations
    setCurrentView(AppView.BUILDER);
  };

  const handleRenameOrganization = async (org: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = prompt('Enter new name:', org.name);
    if (newName && newName.trim() && newName !== org.name) {
      const success = await updateOrganization(org.id, newName.trim());
      if (success) {
        setToast({ message: `Organization renamed to "${newName.trim()}"`, type: 'success' });
        addNotification('success', 'Organization Renamed', `"${org.name}" renamed to "${newName.trim()}"`);
      } else {
        setToast({ message: 'Failed to rename organization', type: 'error' });
        addNotification('error', 'Rename Failed', 'Could not rename organization');
      }
    }
  };

  const handleDeleteOrganization = async (org: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOrgDropdown(false);

    // Check if this is the last organization
    if (organizations.length <= 1) {
      setToast({
        message: 'You must have at least one organization',
        type: 'error'
      });
      addNotification('error', 'Cannot Delete', 'You must have at least one organization');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete Organization?',
      message: `Are you sure you want to delete "${org.name}"? This will permanently delete all bots, conversations, and data in this organization. This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        setIsDeleting(true);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));

        try {
          const result = await deleteOrganization(org.id);

          if (result.success) {
            setToast({ message: `Organization "${org.name}" deleted successfully`, type: 'success' });
            addNotification('success', 'Organization Deleted', `"${org.name}" has been deleted`);
          } else {
            setToast({ message: result.error || 'Failed to delete organization', type: 'error' });
            addNotification('error', 'Delete Failed', result.error || 'Could not delete organization');
          }
        } catch (error) {
          setToast({ message: 'An error occurred while deleting', type: 'error' });
          addNotification('error', 'Error', 'An unexpected error occurred');
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const handleCreateOrganization = async (name: string) => {
    const newOrg = await createOrganization(name);
    if (newOrg) {
      setShowCreateOrgModal(false);
      setShowOrgDropdown(false);
    }
  };

  // Compatibility aliases for old code that still references projects
  const projects = organizations;
  const currentProject = currentOrganization;
  const showProjectDropdown = showOrgDropdown;
  const setShowProjectDropdown = setShowOrgDropdown;
  const handleSwitchProject = handleSwitchOrganization;
  const handleRenameProject = handleRenameOrganization;
  const setShowCreateModal = setShowCreateOrgModal;
  const showCreateModal = showCreateOrgModal;
  const handleCreateProject = handleCreateOrganization;

  const handleUrlScrape = async () => {
    if (!urlInput) return;
    setIsIngesting(true);
    setIngestionProgress(0);

    // Simulate scraping
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setIngestionProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsIngesting(false);
        setAgentConfig(prev => ({
          ...prev,
          knowledgeContext: (prev.knowledgeContext || '') + `\n\n--- Scraped Content from ${urlInput} ---\nWebbot is a leading provider of AI solutions...`
        }));
        setUrlInput('');
      }
    }, 100);
  };

  const toggleTool = (toolId: string) => {
    setAgentConfig(prev => {
      const tools = prev.tools.includes(toolId)
        ? prev.tools.filter(t => t !== toolId)
        : [...prev.tools, toolId];
      return { ...prev, tools };
    });
  };

  const addQuickReply = () => {
    if (!newQuickReply) return;
    setAgentConfig(prev => ({
      ...prev,
      quickReplies: [...prev.quickReplies, newQuickReply]
    }));
    setNewQuickReply('');
  };

  const removeQuickReply = (reply: string) => {
    setAgentConfig(prev => ({
      ...prev,
      quickReplies: prev.quickReplies.filter(r => r !== reply)
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAgentConfig(prev => ({ ...prev, theme: { ...prev.theme, avatarImage: e.target?.result as string } }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlayVoicePreview = async () => {
    if (isPlayingPreview) return;
    setIsPlayingPreview(true);
    await previewVoice(agentConfig);
    setIsPlayingPreview(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsIngesting(true);
    setIngestionProgress(0);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // Simulate processing time
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setIngestionProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setIsIngesting(false);
          setAgentConfig(prev => ({
            ...prev,
            knowledgeContext: (prev.knowledgeContext || '') + `\n\n--- Document: ${file.name} ---\n${text}`
          }));
        }
      }, 100);
    };
    reader.readAsText(file);
  };

  const SidebarItem = ({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all group relative
        ${active ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
        ${collapsed ? 'justify-center' : ''} `}
      title={collapsed ? label : undefined}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="font-medium text-sm truncate min-w-0 animate-fade-in">{label}</span>}
      {active && !collapsed && <div className="absolute right-2 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>}
      {active && collapsed && <div className="absolute right-2 top-2 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>}
      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-700">
          {label}
        </div>
      )}
    </button>
  );



  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        currentView={currentView}
        setCurrentView={setCurrentView}
        organizations={projects}
        currentProject={currentProject}
        showProjectDropdown={showProjectDropdown}
        setShowProjectDropdown={setShowProjectDropdown}
        handleSwitchProject={handleSwitchProject}
        handleRenameProject={handleRenameProject}
        handleDeleteOrganization={handleDeleteOrganization}
        setShowCreateModal={setShowCreateModal}
        profile={profile}
        userEmail={user?.email || ''}
        signOut={signOut}
        isPro={isPro}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden transition-all duration-300 ease-in-out flex flex-col">
        {/* Organization Header - Hide for Settings and Billing (account-wide views) */}
        {currentProject && currentView !== 'projects' && currentView !== AppView.SETTINGS && currentView !== AppView.BILLING && (
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Folder size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{currentProject.name}</h2>
                  <p className="text-xs text-slate-400 font-mono">Org ID: {currentProject.id}</p>
                </div>
              </div>

              {/* Notification Bell */}
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-3 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Bell size={20} className="text-slate-600" />
                {unreadCount > 0 && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </button>
            </div>
          </div>
        )
        }

        {/* Account-Wide Header for Settings and Billing */}
        {
          (currentView === AppView.SETTINGS || currentView === AppView.BILLING) && (
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                    {currentView === AppView.SETTINGS ? <Settings size={20} /> : <CreditCard size={20} />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      {currentView === AppView.SETTINGS ? 'Account Settings' : 'Billing & Plans'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {currentView === AppView.SETTINGS ? 'Manage your profile and preferences' : 'Manage your subscription and billing'}
                    </p>
                  </div>
                </div>

                {/* Notification Bell */}
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative p-3 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <Bell size={20} className="text-slate-600" />
                  {unreadCount > 0 && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </button>
              </div>
            </div>
          )
        }

        {/* Content Area - Flexible */}
        <div className={`flex-1 overflow-hidden ${currentView === AppView.BUILDER ? '' : 'p-6 overflow-y-auto'}`}>
          {organizationsLoading ? (
            <LoadingState text="Loading your workspace..." variant="orbit" />
          ) : (
            <>
              {currentView === AppView.DASHBOARD && <DashboardPage setCurrentView={setCurrentView} />}
              {currentView === AppView.BUILDER && (
                <AgentBuilderNew
                  agentConfig={agentConfig}
                  setAgentConfig={setAgentConfig}
                  activeTab={activeBuilderTab}
                  setActiveTab={setActiveBuilderTab}
                  isIngesting={isIngesting}
                  ingestionProgress={ingestionProgress}
                  urlInput={urlInput}
                  setUrlInput={setUrlInput}
                  handleFileUpload={handleFileUpload}
                  handleUrlScrape={handleUrlScrape}
                  toggleTool={toggleTool}
                  addQuickReply={addQuickReply}
                  removeQuickReply={removeQuickReply}
                  newQuickReply={newQuickReply}
                  setNewQuickReply={setNewQuickReply}
                  handleLogoUpload={handleLogoUpload}
                  handlePlayVoicePreview={handlePlayVoicePreview}
                  isPlayingPreview={isPlayingPreview}
                  currentProjectId={currentBot?.id}
                />
              )}
              {currentView === AppView.AGENTS && <AgentsRouter />}
              {currentView === AppView.ANALYTICS && <AnalyticsPage />}
              {currentView === AppView.HISTORY && <HistoryPage />}
              {currentView === AppView.INTEGRATION && <IntegrationPageNew />}
              {currentView === AppView.SETTINGS && <SettingsPage />}
              {currentView === AppView.BILLING && <BillingPage />}
              {currentView === 'projects' && <ProjectsPage />}
            </>
          )}
        </div>
      </main >

      {/* Modals and Overlays */}
      {isDeleting && <LoadingOverlay text="Deleting organization..." variant="orbit" />}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {
        toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )
      }
    </div >
  );
};

// --- Main App Entry Point ---

export default function App() {
  return (
    <AuthProvider>
      <OrganizationsProvider>
        <NotificationsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/widget/:projectId" element={<WidgetPage />} />
              <Route path="/dashboard/*" element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              } />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationsProvider>
      </OrganizationsProvider>
    </AuthProvider>
  );
}
