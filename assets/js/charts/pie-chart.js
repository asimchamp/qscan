/**
 * Pie Chart Renderer
 * Donut chart with monochrome grey palette following shadcn/ui design
 */

export class PieChart {
    constructor(canvasId, data, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.data = data; // [{ label, value, color }]
        this.options = {
            donut: true,
            innerRadius: 0.65,
            showLabels: true,
            showPercentages: true,
            ...options
        };

        this.hoveredIndex = -1;
        this.total = data.reduce((sum, d) => sum + d.value, 0);

        this.setupCanvas();
        this.setupEventListeners();
        this.render();
    }

    /**
     * Setup canvas with DPR scaling
     */
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const size = Math.min(this.canvas.parentElement.clientWidth, 300);

        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';

        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;

        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(dpr, dpr);

        this.size = size;
    }

    /**
     * Get theme-aware monochrome colors
     */
    getColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        return {
            // Darkest to lightest - maps to Critical → Info
            severities: isDark
                ? ['#fafafa', '#d4d4d4', '#a1a1aa', '#737373', '#525252']
                : ['#171717', '#404040', '#737373', '#a1a1aa', '#d4d4d8'],
            text: isDark ? '#fafafa' : '#171717',
            muted: isDark ? '#a1a1aa' : '#737373'
        };
    }

    /**
     * Map severity label to grey scale index
     */
    getSeverityIndex(label) {
        const normalized = label.toLowerCase();
        if (normalized.includes('critical') || normalized === '5') return 0; // Darkest
        if (normalized.includes('high') || normalized === '4') return 1;
        if (normalized.includes('medium') || normalized === '3') return 2;
        if (normalized.includes('low') || normalized === '2') return 3;
        return 4; // Lightest (Info, 1, or unknown)
    }

    clear() {
        const dpr = window.devicePixelRatio || 1;
        this.ctx.clearRect(0, 0, this.size * dpr, this.size * dpr);
        this.ctx.clearRect(0, 0, this.size, this.size);
    }

    drawSlices(progress = 1) {
        const centerX = this.size / 2;
        const centerY = this.size / 2;
        const radius = Math.min(centerX, centerY) - 30;

        let currentAngle = -Math.PI / 2;

        const colors = this.getColors();

        this.data.forEach((item, index) => {
            const sliceAngle = (item.value / this.total) * Math.PI * 2 * progress;

            // Get monochrome color based on severity
            const severityIndex = this.getSeverityIndex(item.label);
            const color = colors.severities[severityIndex];

            // Highlight hovered slice
            const isHovered = this.hoveredIndex === index;
            const sliceRadius = isHovered ? radius + 5 : radius;

            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, sliceRadius, currentAngle, currentAngle + sliceAngle);

            if (this.options.donut) {
                const innerRadius = sliceRadius * this.options.innerRadius;
                this.ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
            } else {
                this.ctx.lineTo(centerX, centerY);
            }

            this.ctx.closePath();
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = isHovered ? 1 : 0.85;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;

            // Draw percentage label outside
            if (this.options.showPercentages && progress === 1 && item.value > 0) {
                const labelAngle = currentAngle + sliceAngle / 2;
                const labelRadius = radius + 15;
                const labelX = centerX + Math.cos(labelAngle) * labelRadius;
                const labelY = centerY + Math.sin(labelAngle) * labelRadius;

                const percentage = ((item.value / this.total) * 100).toFixed(1);

                this.ctx.font = 'bold 11px var(--font-sans)';
                this.ctx.fillStyle = colors.text;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(`${percentage}%`, labelX, labelY);
            }

            currentAngle += sliceAngle;
        });
    }

    drawCenterLabel() {
        if (!this.options.donut) return;

        const centerX = this.size / 2;
        const centerY = this.size / 2;

        const colors = this.getColors();

        // Total count
        this.ctx.font = 'bold 28px var(--font-sans)';
        this.ctx.fillStyle = colors.text;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(this.total.toString(), centerX, centerY - 5);

        // "Total" label
        this.ctx.font = '12px var(--font-sans)';
        this.ctx.fillStyle = colors.muted;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('Total', centerX, centerY + 10);
    }

    render() {
        this.clear();
        this.drawSlices(1);
        this.drawCenterLabel();
    }

    getSliceAtPoint(x, y) {
        const centerX = this.size / 2;
        const centerY = this.size / 2;
        const radius = Math.min(centerX, centerY) - 30;

        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if point is within donut ring
        const innerRadius = radius * this.options.innerRadius;
        if (this.options.donut && distance < innerRadius) return -1;
        if (distance > radius) return -1;

        // Calculate angle
        let angle = Math.atan2(dy, dx) + Math.PI / 2;
        if (angle < 0) angle += Math.PI * 2;

        let currentAngle = 0;
        for (let i = 0; i < this.data.length; i++) {
            const sliceAngle = (this.data[i].value / this.total) * Math.PI * 2;
            if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
                return i;
            }
            currentAngle += sliceAngle;
        }

        return -1;
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const index = this.getSliceAtPoint(x, y);

            if (index !== this.hoveredIndex) {
                this.hoveredIndex = index;
                this.render();
            }

            this.canvas.style.cursor = index !== -1 ? 'pointer' : 'default';
        });

        this.canvas.addEventListener('mouseleave', () => {
            if (this.hoveredIndex !== -1) {
                this.hoveredIndex = -1;
                this.render();
            }
            this.canvas.style.cursor = 'default';
        });
    }
}
