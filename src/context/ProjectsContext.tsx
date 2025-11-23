import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabaseService, Project } from '../services/supabaseService';
import { useAuth } from './AuthContext';
import { AgentConfig } from '../../types';

interface ProjectsContextType {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  setCurrentProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  createProject: (name: string, config: AgentConfig) => Promise<Project | null>;
  updateProject: (projectId: string, config: AgentConfig, name?: string) => Promise<boolean>;
  deleteProject: (projectId: string) => Promise<{ success: boolean; error?: string }>;
  refreshProjects: () => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const ProjectsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    if (!user) {
      setProjects([]);
      setCurrentProject(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await supabaseService.getProjects(user.id);
      setProjects(data);
      
      // Set current project if not set
      if (!currentProject && data.length > 0) {
        setCurrentProject(data[0]);
      } else if (currentProject) {
        // Update current project if it exists in the new data
        const updatedCurrent = data.find(p => p.id === currentProject.id);
        if (updatedCurrent) {
          setCurrentProject(updatedCurrent);
        } else if (data.length > 0) {
          // Current project was deleted, switch to first available
          setCurrentProject(data[0]);
        } else {
          setCurrentProject(null);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name: string, config: AgentConfig): Promise<Project | null> => {
    if (!user) return null;

    try {
      const newProject = await supabaseService.createProject(user.id, name, config);
      if (newProject) {
        setProjects(prev => [newProject, ...prev]);
        setCurrentProject(newProject);
        return newProject;
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
    return null;
  };

  const updateProject = async (projectId: string, config: AgentConfig, name?: string): Promise<boolean> => {
    try {
      const success = await supabaseService.updateProject(projectId, config, name);
      if (success) {
        // Reload projects to get updated data
        await loadProjects();
        return true;
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
    return false;
  };

  const deleteProject = async (projectId: string): Promise<{ success: boolean; error?: string }> => {
    // Check if this is the last project
    if (projects.length <= 1) {
      return { 
        success: false, 
        error: 'You must have at least one project. Create a new project before deleting this one.' 
      };
    }

    try {
      const success = await supabaseService.deleteProject(projectId);
      if (success) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        
        // If deleted project was current, switch to another
        if (currentProject?.id === projectId) {
          const remaining = projects.filter(p => p.id !== projectId);
          setCurrentProject(remaining.length > 0 ? remaining[0] : null);
        }
        
        return { success: true };
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      return { success: false, error: 'Failed to delete project. Please try again.' };
    }
    return { success: false, error: 'Failed to delete project. Please try again.' };
  };

  const refreshProjects = async () => {
    await loadProjects();
  };

  // Load projects when user changes
  useEffect(() => {
    if (user) {
      loadProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
      setLoading(false);
    }
  }, [user]);

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        currentProject,
        loading,
        setCurrentProject,
        loadProjects,
        createProject,
        updateProject,
        deleteProject,
        refreshProjects,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};
