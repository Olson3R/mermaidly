(function () {
  'use strict';

  console.log('Mermaidly: Script loaded');

  // Debug mode - enable via: localStorage.setItem('mermaidly-debug', 'true') in console
  const debugEnabled = localStorage.getItem('mermaidly-debug') === 'true';
  let debugDiv = null;

  if (debugEnabled) {
    debugDiv = document.createElement('div');
    debugDiv.style.cssText = 'position:fixed;top:0;left:0;background:yellow;color:black;padding:4px 8px;font-size:12px;z-index:9999;cursor:pointer;';
    debugDiv.title = 'Click to dismiss (disable: localStorage.removeItem("mermaidly-debug"))';
    debugDiv.textContent = 'Mermaidly: Loading...';
    debugDiv.onclick = () => debugDiv.remove();
    document.body.appendChild(debugDiv);
  }

  function updateDebug(msg) {
    if (debugDiv) debugDiv.textContent = msg;
    console.log('Mermaidly:', msg);
  }

  setTimeout(() => {
    const allCode = document.querySelectorAll('code.language-mermaid');
    const rendered = document.querySelectorAll('.mermaidly-container');
    updateDebug(`Mermaid: ${typeof mermaid !== 'undefined' ? 'YES' : 'NO'} | Found: ${allCode.length} | Rendered: ${rendered.length}`);
  }, 2000);

  // Configuration
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 4;
  const ZOOM_STEP = 0.1;

  // Track rendered diagrams via data attribute (not Set, which breaks on DOM refresh)

  // Initialize mermaid
  if (typeof mermaid !== 'undefined') {
    console.log('Mermaidly: Mermaid library found');
    mermaid.initialize({
      startOnLoad: false,
      theme: document.body.classList.contains('vscode-dark') ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'var(--vscode-font-family)',
    });
  } else {
    console.error('Mermaidly: Mermaid library NOT found');
  }

  // Create zoom controls HTML
  function createControls(mermaidCode) {
    const controls = document.createElement('div');
    controls.className = 'mermaidly-controls';
    controls.dataset.mermaidCode = mermaidCode;
    controls.innerHTML = `
      <button class="mermaidly-btn mermaidly-zoom-in" title="Zoom In">+</button>
      <button class="mermaidly-btn mermaidly-zoom-out" title="Zoom Out">−</button>
      <button class="mermaidly-btn mermaidly-zoom-fit" title="Fit to View">Fit</button>
      <button class="mermaidly-btn mermaidly-fullscreen" title="Toggle Fullscreen">⛶</button>
      <span class="mermaidly-zoom-level">100%</span>
      <span class="mermaidly-spacer"></span>
      <button class="mermaidly-btn mermaidly-copy-code" title="Copy Mermaid code">Code</button>
      <button class="mermaidly-btn mermaidly-copy-svg" title="Copy as SVG">SVG</button>
      <button class="mermaidly-btn mermaidly-copy-png" title="Copy as PNG">PNG</button>
    `;
    return controls;
  }

  // Copy Mermaid source code
  async function copyMermaidCode(container) {
    console.log('Mermaidly: copyMermaidCode called');
    const code = container.querySelector('.mermaidly-controls')?.dataset.mermaidCode;
    if (!code) {
      showToast('No code found');
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      showToast('Code copied!');
    } catch (err) {
      console.error('Failed to copy code:', err);
      showToast('Failed to copy');
    }
  }

  // Copy SVG to clipboard
  async function copySvg(container) {
    console.log('Mermaidly: copySvg called');
    const svg = container.querySelector('.mermaidly-content svg');
    if (!svg) {
      console.error('Mermaidly: No SVG found in container');
      showToast('No SVG found');
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      console.log('Mermaidly: SVG data length:', svgData.length);
      await navigator.clipboard.writeText(svgData);
      showToast('SVG copied!');
    } catch (err) {
      console.error('Mermaidly: Failed to copy SVG:', err);
      showToast('Failed: ' + err.message);
    }
  }

  // Copy PNG to clipboard
  async function copyPng(container) {
    console.log('Mermaidly: copyPng called');
    const svg = container.querySelector('.mermaidly-content svg');
    if (!svg) {
      console.error('Mermaidly: No SVG found for PNG export');
      showToast('No SVG found');
      return;
    }

    try {
      // Clone SVG and fix dimensions
      const svgClone = svg.cloneNode(true);
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Get dimensions from viewBox since width might be "100%"
      const viewBox = svg.viewBox?.baseVal;
      const width = viewBox?.width || svg.getBoundingClientRect().width || 800;
      const height = viewBox?.height || svg.getBoundingClientRect().height || 600;

      // Set fixed dimensions on clone (important for canvas rendering)
      svgClone.setAttribute('width', width);
      svgClone.setAttribute('height', height);

      console.log('Mermaidly: PNG dimensions:', width, height);

      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
      const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);

      const img = new Image();

      img.onload = async () => {
        console.log('Mermaidly: Image loaded, drawing to canvas');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            showToast('Failed to create PNG');
            return;
          }

          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            showToast('PNG copied!');
          } catch (err) {
            console.error('Mermaidly: Clipboard write failed:', err);
            // Fallback: download instead
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'diagram.png';
            a.click();
            URL.revokeObjectURL(url);
            showToast('PNG downloaded (clipboard failed)');
          }
        }, 'image/png');
      };

      img.onerror = (e) => {
        console.error('Mermaidly: Image load failed:', e);
        showToast('Failed to render PNG');
      };

      img.src = dataUrl;
    } catch (err) {
      console.error('Mermaidly: PNG export error:', err);
      showToast('Failed: ' + err.message);
    }
  }

  // Toggle fullscreen mode for a container
  function toggleFullscreen(container) {
    const isFullscreen = container.classList.toggle('mermaidly-fullscreen-mode');

    if (isFullscreen) {
      // Store scroll position
      container.dataset.scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';

      // Add escape key listener
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          toggleFullscreen(container);
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
      container._escHandler = escHandler;
    } else {
      document.body.style.overflow = '';
      // Restore scroll position
      if (container.dataset.scrollY) {
        window.scrollTo(0, parseInt(container.dataset.scrollY));
      }
      // Remove escape handler
      if (container._escHandler) {
        document.removeEventListener('keydown', container._escHandler);
      }
    }
  }

  // Simple toast notification
  function showToast(message) {
    const existing = document.querySelector('.mermaidly-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'mermaidly-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2000);
  }

  // Set up zoom and pan for a container
  function setupZoomPan(container) {
    const viewport = container.querySelector('.mermaidly-viewport');
    const content = container.querySelector('.mermaidly-content');
    const zoomInBtn = container.querySelector('.mermaidly-zoom-in');
    const zoomOutBtn = container.querySelector('.mermaidly-zoom-out');
    const fitBtn = container.querySelector('.mermaidly-zoom-fit');
    const zoomLevel = container.querySelector('.mermaidly-zoom-level');

    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isPanning = false;
    let startX = 0;
    let startY = 0;

    function updateTransform() {
      content.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      zoomLevel.textContent = `${Math.round(scale * 100)}%`;
    }

    function zoom(delta) {
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale + delta));
      if (newScale !== scale) {
        scale = newScale;
        updateTransform();
      }
    }

    function fitToView() {
      const svg = content.querySelector('svg');
      if (!svg) return;

      const viewportRect = viewport.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();

      // Calculate scale to fit, accounting for current scale
      const currentScale = scale;
      const naturalWidth = svgRect.width / currentScale;
      const naturalHeight = svgRect.height / currentScale;

      const scaleX = (viewportRect.width - 40) / naturalWidth;  // 40px padding
      const scaleY = (viewportRect.height - 40) / naturalHeight;
      const newScale = Math.min(scaleX, scaleY, MAX_ZOOM);

      scale = Math.max(MIN_ZOOM, newScale);
      translateX = 0;
      translateY = 0;
      updateTransform();
    }

    // Button handlers
    zoomInBtn.addEventListener('click', (e) => {
      e.preventDefault();
      zoom(ZOOM_STEP);
    });

    zoomOutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      zoom(-ZOOM_STEP);
    });

    fitBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      fitToView();
    });

    // Mouse wheel zoom
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      zoom(delta);
    }, { passive: false });

    // Pan functionality
    viewport.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Only left click
      isPanning = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      viewport.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform();
    });

    document.addEventListener('mouseup', () => {
      if (isPanning) {
        isPanning = false;
        viewport.style.cursor = 'grab';
      }
    });

    // Touch support
    let lastTouchDistance = 0;

    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isPanning = true;
        startX = e.touches[0].clientX - translateX;
        startY = e.touches[0].clientY - translateY;
      } else if (e.touches.length === 2) {
        lastTouchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && isPanning) {
        translateX = e.touches[0].clientX - startX;
        translateY = e.touches[0].clientY - startY;
        updateTransform();
      } else if (e.touches.length === 2) {
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = (distance - lastTouchDistance) * 0.01;
        zoom(delta);
        lastTouchDistance = distance;
      }
    }, { passive: true });

    viewport.addEventListener('touchend', () => {
      isPanning = false;
    }, { passive: true });

    // Double-click to fit
    viewport.addEventListener('dblclick', (e) => {
      e.preventDefault();
      fitToView();
    });

    // Copy buttons
    container.querySelector('.mermaidly-copy-code')?.addEventListener('click', (e) => {
      e.preventDefault();
      copyMermaidCode(container);
    });

    container.querySelector('.mermaidly-copy-svg')?.addEventListener('click', (e) => {
      e.preventDefault();
      copySvg(container);
    });

    container.querySelector('.mermaidly-copy-png')?.addEventListener('click', (e) => {
      e.preventDefault();
      copyPng(container);
    });

    container.querySelector('.mermaidly-fullscreen')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleFullscreen(container);
    });
  }

  // Render a single mermaid code block
  async function renderDiagram(codeBlock) {
    console.log('Mermaidly: renderDiagram called');
    const code = codeBlock.textContent || '';
    const id = `mermaidly-${Math.random().toString(36).substr(2, 9)}`;

    // Skip if already rendered (check parent pre element)
    const pre = codeBlock.closest('pre');
    if (pre && pre.dataset.mermaidlyRendered) {
      console.log('Mermaidly: Skipping already rendered');
      return;
    }
    if (pre) {
      pre.dataset.mermaidlyRendered = 'true';
    }

    console.log('Mermaidly: Rendering diagram with code length:', code.length);

    try {
      const { svg } = await mermaid.render(id, code);
      console.log('Mermaidly: Got SVG, length:', svg.length);

      // Create container structure
      const container = document.createElement('div');
      container.className = 'mermaidly-container';

      const viewport = document.createElement('div');
      viewport.className = 'mermaidly-viewport';

      const content = document.createElement('div');
      content.className = 'mermaidly-content';
      content.innerHTML = svg;

      viewport.appendChild(content);
      container.appendChild(viewport);
      container.appendChild(createControls(code));

      // Replace the code block
      if (pre) {
        pre.replaceWith(container);
      } else {
        codeBlock.replaceWith(container);
      }

      // Set up interactions
      setupZoomPan(container);
      console.log('Mermaidly: Diagram rendered successfully');

    } catch (error) {
      console.error('Mermaidly: Failed to render diagram', error);

      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'mermaidly-error';
      errorDiv.innerHTML = `
        <strong>Diagram Error</strong>
        <pre>${escapeHtml(error.message || 'Unknown error')}</pre>
      `;

      const pre = codeBlock.closest('pre');
      if (pre) {
        pre.replaceWith(errorDiv);
      }
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Find and render all mermaid code blocks
  async function renderAllDiagrams() {
    if (typeof mermaid === 'undefined') {
      console.warn('Mermaidly: Mermaid library not loaded');
      return;
    }

    // Try multiple selectors for different VS Code versions
    const selectors = [
      'pre > code.language-mermaid',
      'code.language-mermaid',
      'pre[data-language="mermaid"] > code',
      '.vscode-markdown-preview code.language-mermaid',
    ];

    let codeBlocks = [];
    for (const selector of selectors) {
      codeBlocks = document.querySelectorAll(selector);
      if (codeBlocks.length > 0) {
        console.log(`Mermaidly: Found ${codeBlocks.length} blocks with selector: ${selector}`);
        break;
      }
    }

    if (codeBlocks.length === 0) {
      console.log('Mermaidly: No mermaid code blocks found');
      // Debug: log all code elements
      const allCode = document.querySelectorAll('code');
      console.log('Mermaidly: All code elements:', allCode.length);
      allCode.forEach((c, i) => {
        console.log(`  ${i}: class="${c.className}", parent="${c.parentElement?.tagName}"`);
      });

      // Update debug div
      updateDebug(`Mermaid: ${typeof mermaid !== 'undefined' ? 'YES' : 'NO'} | Blocks: 0 | Code elements: ${allCode.length}`);
    } else {
      updateDebug(`Mermaid: YES | Rendering ${codeBlocks.length} diagrams...`);
    }

    console.log('Mermaidly: About to render', codeBlocks.length, 'diagrams');
    for (let i = 0; i < codeBlocks.length; i++) {
      console.log('Mermaidly: Processing block', i);
      try {
        await renderDiagram(codeBlocks[i]);
      } catch (err) {
        console.error('Mermaidly: Failed to render block', i, err);
      }
    }
  }

  // Initial render
  console.log('Mermaidly: Document readyState:', document.readyState);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Mermaidly: DOMContentLoaded fired');
      renderAllDiagrams();
    });
  } else {
    // Delay slightly to ensure VS Code has finished rendering
    console.log('Mermaidly: Scheduling immediate render');
    setTimeout(() => {
      console.log('Mermaidly: Running delayed render');
      renderAllDiagrams();
    }, 100);
  }

  // Re-render on content changes (VS Code updates the preview)
  const observer = new MutationObserver((mutations) => {
    let shouldRender = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches?.('pre') || node.querySelector?.('pre > code.language-mermaid')) {
              shouldRender = true;
              break;
            }
          }
        }
      }
      if (shouldRender) break;
    }

    if (shouldRender) {
      // Small delay to let the DOM settle
      setTimeout(renderAllDiagrams, 50);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
