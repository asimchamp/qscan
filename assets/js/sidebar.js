/**
 * Sidebar Loader Module
 * Dynamically loads and injects sidebar component
 */

export async function loadSidebar() {
    try {
        const response = await fetch('/components/sidebar.html');
        if (!response.ok) {
            throw new Error(`Failed to load sidebar: ${response.statusText}`);
        }

        const html = await response.text();
        const container = document.getElementById('sidebar-container');

        if (container) {
            container.innerHTML = html;
            setActiveNavItem();
        }
    } catch (error) {
        console.error('Error loading sidebar:', error);
    }
}

/**
 * Set active navigation item based on current page
 */
function setActiveNavItem() {
    const path = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && path.includes(href)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Default to "Overview" page (index.html)
    if (path.endsWith('index.html') || path.endsWith('/')) {
        // Remove all active states first
        navItems.forEach(item => item.classList.remove('active'));

        // Set Overview as active
        const overviewItem = document.querySelector('.nav-item[href="index.html"]');
        if (overviewItem) {
            overviewItem.classList.add('active');
        }
    }
}
