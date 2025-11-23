/**
 * VerdantAI Widget Embed Script
 * This script loads and initializes the chat widget on any website
 */

(function() {
  'use strict';

  // Get the script tag that loaded this file
  const currentScript = document.currentScript || document.querySelector('script[data-agent-id]');
  const agentId = currentScript?.getAttribute('data-agent-id');
  
  if (!agentId) {
    console.error('VerdantAI: Missing data-agent-id attribute');
    return;
  }

  // Configuration
  const WIDGET_HOST = currentScript?.getAttribute('data-host') || 'http://localhost:3000';
  const API_ENDPOINT = `${WIDGET_HOST}/api/widget/${agentId}`;

  // Create widget container
  function createWidgetContainer() {
    const container = document.createElement('div');
    container.id = 'verdantai-widget-container';
    container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 999999;';
    document.body.appendChild(container);
    return container;
  }

  // Load widget configuration
  async function loadWidgetConfig() {
    try {
      const response = await fetch(API_ENDPOINT);
      if (!response.ok) throw new Error('Failed to load widget config');
      return await response.json();
    } catch (error) {
      console.error('VerdantAI: Failed to load widget:', error);
      return null;
    }
  }

  // Initialize widget
  async function initWidget() {
    console.log('🚀 VerdantAI: Initializing widget...', { agentId, host: WIDGET_HOST });
    
    const config = await loadWidgetConfig();
    if (!config) {
      console.error('VerdantAI: Could not load widget configuration');
      return;
    }

    const container = createWidgetContainer();
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = `${WIDGET_HOST}/widget/${agentId}`;
    iframe.style.cssText = 'border: none; width: 100%; height: 100%; position: absolute; bottom: 0; right: 0;';
    iframe.setAttribute('allow', 'microphone');
    
    container.appendChild(iframe);

    // Handle messages from iframe
    window.addEventListener('message', (event) => {
      if (event.origin !== WIDGET_HOST) return;
      
      if (event.data.type === 'verdantai-resize') {
        container.style.width = event.data.width;
        container.style.height = event.data.height;
      }
    });

    console.log('✅ VerdantAI: Widget loaded successfully');
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
