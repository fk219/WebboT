import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatWidget from '../../components/ChatWidget';
import { supabase } from '../lib/supabase';
import { AgentConfig } from '../../types';

/**
 * Standalone widget page that can be embedded in an iframe
 * URL: /widget/:projectId
 */
const WidgetPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWidgetConfig();
  }, [projectId]);

  const loadWidgetConfig = async () => {
    if (!projectId) {
      setError('No project ID provided');
      setLoading(false);
      return;
    }

    try {
      // In a real app, this would be a public API endpoint
      // For now, we'll fetch from Supabase directly
      const { data, error } = await supabase
        .from('bots')
        .select('config')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      if (data?.config) {
        setConfig(data.config as AgentConfig);
      } else {
        setError('Widget configuration not found');
      }
    } catch (err: any) {
      console.error('Failed to load widget:', err);
      setError(err.message || 'Failed to load widget');
    } finally {
      setLoading(false);
    }
  };

  // Notify parent window of size changes
  useEffect(() => {
    const notifyResize = () => {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'verdantai-resize',
          width: '400px',
          height: '600px'
        }, '*');
      }
    };

    notifyResize();
    window.addEventListener('resize', notifyResize);
    return () => window.removeEventListener('resize', notifyResize);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading widget...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center p-6">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Widget Not Found</h2>
          <p className="text-slate-600 text-sm">{error || 'Configuration not available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-transparent">
      <ChatWidget
        config={config}
        projectId={projectId}
        previewMode={false}
      />
    </div>
  );
};

export default WidgetPage;
