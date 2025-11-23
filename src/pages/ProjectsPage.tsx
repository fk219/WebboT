import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useProjects } from '../context/ProjectsContext';
import { useNavigate } from 'react-router-dom';
import CreateProjectModal from '../components/CreateProjectModal';
import Toast, { ToastType } from '../components/Toast';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loading, createProject, updateProject, deleteProject: deleteProjectContext } = useProjects();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleCreateProject = async (name: string) => {
    const defaultConfig = {
      id: crypto.randomUUID(),
      name: name,
      greeting: `Hello! I'm ${name}. How can I help you today?`,
      systemInstruction: 'You are a helpful AI assistant.',
      maxReplyTokens: 150,
      tools: [],
      quickReplies: [],
      voice: {
        enabled: true,
        name: 'Alloy',
        language: 'English',
        speed: 1.0,
        pitch: 1.0,
        phoneCallEnabled: true
      },
      theme: {
        primaryColor: '#10b981',
        mode: 'light' as const,
        fontFamily: 'inter' as const,
        fontStyle: 'regular' as const,
        radius: 'xl' as const,
        avatarIcon: 'bot' as const,
        showBranding: true
      }
    };

    await createProject(name, defaultConfig);
  };

  const handleRenameProject = async (project: any, newName: string) => {
    if (!newName.trim()) return;

    const success = await updateProject(project.id, project.config, newName);
    if (success) {
      setEditingProject(null);
    } else {
      alert('Failed to rename project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    const result = await deleteProjectContext(projectId);
    if (!result.success) {
      setToast({
        message: result.error || 'Failed to delete project',
        type: 'error'
      });
    } else {
      setToast({
        message: 'Project deleted successfully',
        type: 'success'
      });
    }
  };

  const copyToClipboard = (text: string, projectId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(projectId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getEmbedCode = (projectId: string) => {
    return `<script src="${window.location.origin}/widget-embed.js" data-agent-id="${projectId}"></script>`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-emerald-100 mt-2">Manage your AI agents and integrations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all text-sm font-semibold shadow-lg"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-start justify-between mb-4">
                {editingProject?.id === project.id ? (
                  <input
                    type="text"
                    defaultValue={project.name}
                    onBlur={(e) => handleRenameProject(project, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameProject(project, e.currentTarget.value);
                      }
                    }}
                    className="flex-1 px-2 py-1 border border-emerald-500 rounded-lg text-lg font-medium outline-none"
                    autoFocus
                  />
                ) : (
                  <h3 className="text-lg font-medium text-slate-800 flex-1">{project.name}</h3>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingProject(project)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                    title="Rename"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate">ID: {project.id}</p>
              <p className="text-xs text-slate-400 mt-1">Created {new Date(project.created_at).toLocaleDateString()}</p>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 space-y-2">
              <button
                onClick={() => navigate(`/dashboard/builder?project=${project.id}`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-emerald-500 hover:text-emerald-600 transition-all text-sm font-medium"
              >
                <Edit2 size={16} />
                Edit Agent
              </button>

              <button
                onClick={() => copyToClipboard(getEmbedCode(project.id), project.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-emerald-500 hover:text-emerald-600 transition-all text-sm font-medium"
              >
                {copiedId === project.id ? (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy Embed Code
                  </>
                )}
              </button>

              <button
                onClick={() => window.open(`/widget/${project.id}`, '_blank')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-emerald-500 hover:text-emerald-600 transition-all text-sm font-medium"
              >
                <ExternalLink size={16} />
                Preview Widget
              </button>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-2">No projects yet</h3>
          <p className="text-slate-500 text-sm mb-6">Create your first AI agent to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-medium shadow-lg shadow-emerald-200"
          >
            <Plus size={20} />
            Create Project
          </button>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
