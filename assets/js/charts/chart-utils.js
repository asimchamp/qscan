/**
 * Chart Utilities Module
 * Core helpers for all chart types
 */

/**
 * Setup high-DPR canvas
 */
export function setupCanvas(canvas, width, height) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    return ctx;
}

/**
 * Create linear scale for mapping data to pixels
 */
export function createScale(domain, range) {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    const scale = (value) => {
        return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
    };
    scale.domain = domain;
    scale.range = range;
    return scale;
}

/**
 * Get theme-aware chart colors
 */
export function getChartColors() {
    const style = getComputedStyle(document.documentElement);

    return {
        critical: style.getPropertyValue('--destructive').trim(),
        high: style.getPropertyValue('--warning').trim(),
        medium: style.getPropertyValue('--chart-5').trim(),
        low: style.getPropertyValue('--info').trim(),
        primary: style.getPropertyValue('--primary').trim(),
        success: style.getPropertyValue('--success').trim(),
        warning: style.getPropertyValue('--warning').trim(),
        destructive: style.getPropertyValue('--destructive').trim(),
        grid: style.getPropertyValue('--border').trim(),
        text: style.getPropertyValue('--foreground').trim(),
        muted: style.getPropertyValue('--muted-foreground').trim(),
        // Chart color palette
        'chart-1': style.getPropertyValue('--chart-1').trim(),
        'chart-2': style.getPropertyValue('--chart-2').trim(),
        'chart-3': style.getPropertyValue('--chart-3').trim(),
        'chart-4': style.getPropertyValue('--chart-4').trim(),
        'chart-5': style.getPropertyValue('--chart-5').trim()
    };
}

/**
 * Animate using requestAnimationFrame
 */
export function animate(callback, duration = 1000) {
    const start = performance.now();

    function frame(time) {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);

        callback(eased, progress);

        if (progress < 1) {
            requestAnimationFrame(frame);
        }
    }

    requestAnimationFrame(frame);
}

/**
 * Draw rounded rectangle
 */
export function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Calculate control points for smooth curves (Bezier)
 */
export function calculateControlPoints(points) {
    const controlPoints = [];
    const n = points.length - 1;

    for (let i = 0; i < n; i++) {
        const p0 = i > 0 ? points[i - 1] : points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i < n - 1 ? points[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        controlPoints.push({ cp1x, cp1y, cp2x, cp2y });
    }

    return controlPoints;
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Format date for axis labels
 */
export function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;

    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Draw text with proper alignment
 */
export function drawText(ctx, text, x, y, options = {}) {
    const {
        align = 'center',
        baseline = 'middle',
        font = '12px sans-serif',
        color = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim(),
        maxWidth
    } = options;

    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;

    if (maxWidth) {
        ctx.fillText(text, x, y, maxWidth);
    } else {
        ctx.fillText(text, x, y);
    }

    ctx.restore();
}

/**
 * Create tooltip element
 */
export function createTooltip() {
    let tooltip = document.getElementById('chart-tooltip');

    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'chart-tooltip';
        tooltip.className = 'chart-tooltip';
        tooltip.style.cssText = `
      position: fixed;
      display: none;
      background: var(--popover);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      color: var(--popover-foreground);
      pointer-events: none;
      z-index: 1000;
      box-shadow: var(--shadow-md);
    `;
        document.body.appendChild(tooltip);
    }

    return tooltip;
}

/**
 * Show tooltip
 */
export function showTooltip(content, x, y) {
    const tooltip = createTooltip();
    tooltip.innerHTML = content;
    tooltip.style.display = 'block';
    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y - 10}px`;
}

/**
 * Hide tooltip
 */
export function hideTooltip() {
    const tooltip = document.getElementById('chart-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

/**
 * Debounce function for resize handlers
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
