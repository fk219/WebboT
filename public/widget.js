(function () {
    // Get the script element to read configuration
    const script = document.currentScript;
    const agentId = script.getAttribute('data-agent-id');

    if (!agentId) {
        console.error('Webbot Widget: data-agent-id is required');
        return;
    }

    // Determine the base URL from the script source
    const scriptSrc = script.src;
    const baseUrl = new URL(scriptSrc).origin;

    // Create container
    const container = document.createElement('div');
    container.id = 'webbot-widget-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '999999';
    container.style.fontFamily = 'Inter, system-ui, sans-serif';
    document.body.appendChild(container);

    // Create Iframe (Hidden by default)
    const iframe = document.createElement('iframe');
    iframe.src = `${baseUrl}/embed/${agentId}`;
    iframe.style.width = '380px';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '16px';
    iframe.style.boxShadow = '0 4px 24px rgba(0,0,0,0.15)';
    iframe.style.marginBottom = '16px';
    iframe.style.display = 'none'; // Start hidden
    iframe.style.backgroundColor = 'white';
    iframe.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    iframe.style.opacity = '0';
    iframe.style.transform = 'translateY(20px)';
    container.appendChild(iframe);

    // Create Toggle Button
    const button = document.createElement('button');
    button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;
    button.style.width = '56px';
    button.style.height = '56px';
    button.style.borderRadius = '50%';
    button.style.backgroundColor = '#10b981'; // Emerald-500
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.transition = 'transform 0.2s ease, background-color 0.2s ease';

    button.onmouseenter = () => {
        button.style.transform = 'scale(1.05)';
        button.style.backgroundColor = '#059669'; // Emerald-600
    };
    button.onmouseleave = () => {
        button.style.transform = 'scale(1)';
        button.style.backgroundColor = '#10b981';
    };

    let isOpen = false;

    button.onclick = () => {
        isOpen = !isOpen;
        if (isOpen) {
            iframe.style.display = 'block';
            // Small delay to allow display:block to apply before transition
            setTimeout(() => {
                iframe.style.opacity = '1';
                iframe.style.transform = 'translateY(0)';
            }, 10);

            button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
        } else {
            iframe.style.opacity = '0';
            iframe.style.transform = 'translateY(20px)';
            setTimeout(() => {
                iframe.style.display = 'none';
            }, 300); // Match transition duration

            button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
        }
    };

    container.appendChild(button);

})();
