/**
 * Template Renderer
 * Lazy-renders HTML templates into containers on first access
 * Uses Intersection Observer for automatic rendering when scrolled into view
 */

export class TemplateRenderer {
    static rendered = new Set();
    static observers = new Map();
    
    /**
     * Render a template into a container immediately
     * @param {string} templateId - ID of the template element
     * @param {string} containerId - ID of the container element
     */
    static render(templateId, containerId) {
        // Already rendered?
        if (this.rendered.has(templateId)) {
            console.log(`⚠️ Template already rendered: ${templateId}`);
            return;
        }
        
        const template = document.getElementById(templateId);
        const container = document.getElementById(containerId);
        
        if (!template) {
            console.error(`❌ Template not found: ${templateId}`);
            return;
        }
        
        if (!container) {
            console.error(`❌ Container not found: ${containerId}`);
            return;
        }
        
        // Clone and append template content
        const content = template.content.cloneNode(true);
        container.appendChild(content);
        this.rendered.add(templateId);
        
        console.log(`📄 Rendered template: ${templateId}`);
    }
    
    /**
     * Render a template when the container becomes visible
     * Uses Intersection Observer for performance
     * @param {string} templateId - ID of the template element
     * @param {string} containerId - ID of the container element
     * @param {Object} options - Intersection Observer options
     */
    static renderOnVisible(templateId, containerId, options = {}) {
        // Already rendered?
        if (this.rendered.has(templateId)) {
            return;
        }
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Container not found: ${containerId}`);
            return;
        }
        
        // Default options: render when 10% visible
        const observerOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1,
            ...options
        };
        
        // Create observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    console.log(`👁️ Container visible, rendering: ${templateId}`);
                    this.render(templateId, containerId);
                    observer.disconnect();
                    this.observers.delete(templateId);
                }
            });
        }, observerOptions);
        
        // Start observing
        observer.observe(container);
        this.observers.set(templateId, observer);
        
        console.log(`👀 Observing container for lazy render: ${templateId}`);
    }
    
    /**
     * Render on user interaction (click, hover, etc.)
     * @param {string} templateId - ID of the template element
     * @param {string} containerId - ID of the container element
     * @param {string} triggerSelector - CSS selector for trigger element
     * @param {string} eventType - Event type (click, mouseenter, etc.)
     */
    static renderOnInteraction(templateId, containerId, triggerSelector, eventType = 'click') {
        const trigger = document.querySelector(triggerSelector);
        
        if (!trigger) {
            console.error(`❌ Trigger element not found: ${triggerSelector}`);
            return;
        }
        
        const handler = () => {
            this.render(templateId, containerId);
            trigger.removeEventListener(eventType, handler);
        };
        
        trigger.addEventListener(eventType, handler);
        console.log(`🖱️ Registered interaction trigger for: ${templateId}`);
    }
    
    /**
     * Render multiple templates at once
     * @param {Array} templates - Array of {templateId, containerId} objects
     */
    static renderBatch(templates) {
        console.log(`📦 Batch rendering ${templates.length} templates...`);
        
        templates.forEach(({ templateId, containerId }) => {
            this.render(templateId, containerId);
        });
        
        console.log(`✅ Batch render complete`);
    }
    
    /**
     * Check if a template has been rendered
     * @param {string} templateId - ID of the template element
     * @returns {boolean}
     */
    static isRendered(templateId) {
        return this.rendered.has(templateId);
    }
    
    /**
     * Disconnect all observers (cleanup)
     */
    static cleanup() {
        console.log(`🧹 Cleaning up ${this.observers.size} template observers...`);
        
        this.observers.forEach((observer, templateId) => {
            observer.disconnect();
        });
        
        this.observers.clear();
        console.log(`✅ Template observers cleaned up`);
    }
    
    /**
     * Reset rendered state (useful for testing or SPA navigation)
     */
    static reset() {
        this.cleanup();
        this.rendered.clear();
        console.log(`🔄 Template renderer reset`);
    }
}

