/**
 * Source Viewer Component
 * Minimal, collapsed-by-default source code display
 * Loads lazily, renders as clean text over particle background
 */

import { eventBus, EVENTS } from '../../infrastructure/events/event-bus.js';

export class SourceViewer {
    /**
     * Create a collapsible source viewer
     * @param {Object} options
     * @param {string} options.sourceUrl - URL to fetch source from
     * @param {string} [options.title] - Display title
     * @param {string} [options.language] - Language hint (huff, vyper, json, etc.)
     * @returns {HTMLElement}
     */
    static create({ sourceUrl, title = 'Source', language = null }) {
        const container = document.createElement('details');
        container.className = 'source-viewer';
        
        const summary = document.createElement('summary');
        summary.className = 'source-viewer-summary';
        summary.innerHTML = `<span class="source-viewer-title">${title}</span><span class="source-viewer-icon">+</span>`;
        
        const content = document.createElement('div');
        content.className = 'source-viewer-content';
        content.innerHTML = '<span class="source-viewer-loading">Loading...</span>';
        
        container.appendChild(summary);
        container.appendChild(content);
        
        let loaded = false;
        
        container.addEventListener('toggle', async () => {
            summary.querySelector('.source-viewer-icon').textContent = container.open ? '−' : '+';
            
            if (container.open && !loaded) {
                loaded = true;
                await this._loadContent(content, sourceUrl, language);
            }
        });
        
        return container;
    }
    
    /**
     * Load and render source content into a container
     */
    static async _loadContent(container, sourceUrl, language) {
        try {
            const response = await fetch(sourceUrl.startsWith('/') || sourceUrl.startsWith('http') ? sourceUrl : '/' + sourceUrl);
            if (!response.ok) throw new Error('Failed to load');
            
            let code = await response.text();
            if (language === 'json' || sourceUrl.endsWith('.json')) {
                try {
                    code = JSON.stringify(JSON.parse(code), null, 2);
                } catch {}
            }
            
            container.innerHTML = '';
            
            const actions = document.createElement('div');
            actions.className = 'source-viewer-actions';
            
            const pathSpan = document.createElement('span');
            pathSpan.className = 'source-viewer-path';
            pathSpan.textContent = sourceUrl;
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'source-viewer-copy';
            copyBtn.textContent = 'Copy';
            copyBtn.onclick = async () => {
                try {
                    await navigator.clipboard.writeText(code);
                    copyBtn.textContent = 'Copied';
                    setTimeout(() => copyBtn.textContent = 'Copy', 1500);
                } catch {
                    eventBus.emit(EVENTS.TOAST, { message: 'Copy failed', type: 'error' });
                }
            };
            
            actions.appendChild(pathSpan);
            actions.appendChild(copyBtn);
            
            const pre = document.createElement('pre');
            pre.className = 'source-viewer-code';
            
            const codeEl = document.createElement('code');
            codeEl.textContent = code;
            pre.appendChild(codeEl);
            
            container.appendChild(actions);
            container.appendChild(pre);
            
        } catch (error) {
            container.innerHTML = '<span class="source-viewer-error">Failed to load source</span>';
        }
    }
    
    /**
     * Create multiple source viewers in a group
     * @param {Array<{sourceUrl: string, title: string, language?: string}>} sources
     * @returns {HTMLElement}
     */
    static createGroup(sources) {
        const group = document.createElement('div');
        group.className = 'source-viewer-group';
        
        sources.forEach(source => {
            group.appendChild(this.create(source));
        });
        
        return group;
    }
    
    /**
     * Create a fullscreen minimal source page
     * Source text floats over the particle background
     * @param {Object} options
     * @param {string} options.sourceUrl - URL to fetch source from
     * @param {string} [options.title] - Display title
     * @param {Function} [options.onClose] - Called when close button clicked
     * @returns {HTMLElement}
     */
    static createFullscreen({ sourceUrl, title = 'Source', onClose = null }) {
        const overlay = document.createElement('div');
        overlay.className = 'source-fullscreen';
        
        const header = document.createElement('div');
        header.className = 'source-fullscreen-header';
        
        const titleEl = document.createElement('span');
        titleEl.className = 'source-fullscreen-title';
        titleEl.textContent = title;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'source-fullscreen-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => {
            overlay.remove();
            if (onClose) onClose();
        };
        
        header.appendChild(titleEl);
        header.appendChild(closeBtn);
        
        const content = document.createElement('div');
        content.className = 'source-fullscreen-content';
        content.innerHTML = '<span class="source-viewer-loading">Loading...</span>';
        
        overlay.appendChild(header);
        overlay.appendChild(content);
        
        this._loadContent(content, sourceUrl, null);
        
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
                if (onClose) onClose();
            }
        });
        
        return overlay;
    }
}
