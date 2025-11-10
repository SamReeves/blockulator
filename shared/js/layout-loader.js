/**
 * Layout Loader
 * Loads shared header and footer components into pages
 */

/**
 * Load the shared header
 */
export async function loadHeader() {
    const headerContainer = document.getElementById('header-container');
    if (!headerContainer) {
        console.warn('Header container not found');
        return;
    }
    
    try {
        const response = await fetch('/shared/components/header.html');
        if (!response.ok) throw new Error('Failed to load header');
        const html = await response.text();
        headerContainer.innerHTML = html;
        
        // Highlight active nav link based on current page
        highlightActiveNav();
        
        console.log('✅ Header loaded');
    } catch (error) {
        console.error('Failed to load header:', error);
    }
}

/**
 * Highlight the active navigation link
 */
function highlightActiveNav() {
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        // Check if current path matches link
        if (path.includes(href) || 
            (href.includes('games') && path.includes('games')) ||
            (href.includes('tools') && path.includes('tools')) ||
            (href.includes('discussions') && path.includes('discussions')) ||
            (href.includes('factory') && path.includes('factory'))) {
            link.classList.add('active');
        }
    });
}

/**
 * Load the shared footer
 */
export async function loadFooter() {
    const footerContainer = document.getElementById('footer-container');
    if (!footerContainer) {
        return; // Footer is optional
    }
    
    try {
        const response = await fetch('/shared/components/footer.html');
        if (!response.ok) throw new Error('Failed to load footer');
        const html = await response.text();
        footerContainer.innerHTML = html;
        
        console.log('✅ Footer loaded');
    } catch (error) {
        console.error('Failed to load footer:', error);
    }
}

/**
 * Setup breadcrumb navigation
 */
export function setupBreadcrumbs(items) {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (!breadcrumb) return;
    
    const html = items.map((item, index) => {
        if (index === items.length - 1) {
            // Last item (current page)
            return `<span class="breadcrumb-current">${item.label}</span>`;
        } else {
            return `<a href="${item.href}" class="breadcrumb-link">${item.label}</a>`;
        }
    }).join(' → ');
    
    breadcrumb.innerHTML = html;
}

