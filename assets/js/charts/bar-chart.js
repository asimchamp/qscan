/**
 * Bar Chart Renderer
 * Creates vertical bar charts with monochrome grey palette following shadcn/ui design
 */

export class BarChart {
    constructor(canvasId, data, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }

        this.data = data; // [{ label, value, color }]
        this.options = {
            padding: { top: 20, right: 20, bottom: 60, left: 50 },
            barRadius: 6,
            showValues: true,
            showGrid: true,
            ...options
        };

        this.hoveredIndex = -1;

        this.setupCanvas();
        this.render();
    }

    /**
     * Setup canvas with DPR scaling
     */
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const container = this.canvas.parentElement;
        const width = container.clientWidth;
        const height = this.options.height || 300;

        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;

        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(dpr, dpr);

        this.width = width;
        this.height = height;
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
            muted: isDark ? '#a1a1aa' : '#737373',
            grid: isDark ? '#404040' : '#e5e5e5'
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

    getDimensions() {
        const { padding } = this.options;
        return {
            width: this.width - padding.left - padding.right,
            height: this.height - padding.top - padding.bottom,
            left: padding.left,
            top: padding.top
        };
    }

    clear() {
        const dpr = window.devicePixelRatio || 1;
        this.ctx.clearRect(0, 0, this.width * dpr, this.height * dpr);
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawGrid() {
        if (!this.options.showGrid) return;

        const { width, height, left, top } = this.getDimensions();
        const maxValue = Math.max(...this.data.map(d => d.value));
        const colors = this.getColors();

        this.ctx.strokeStyle = colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;
        this.ctx.setLineDash([2, 2]);

        // Draw 5 horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const value = (maxValue / 5) * i;
            const y = top + (height - (value / maxValue) * height);

            this.ctx.beginPath();
            this.ctx.moveTo(left, y);
            this.ctx.lineTo(left + width, y);
            this.ctx.stroke();

            // Y-axis labels
            this.ctx.font = '11px var(--font-sans)';
            this.ctx.fillStyle = colors.muted;
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(Math.round(value).toString(), left - 10, y);
        }

        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;
    }

    drawBars() {
        const { width, height, left, top } = this.getDimensions();
        const barCount = this.data.length;
        const barWidth = (width / barCount) * 0.6;
        const maxValue = Math.max(...this.data.map(d => d.value));

        const colors = this.getColors();

        this.data.forEach((item, i) => {
            const x = left + (i + 0.5) * (width / barCount) - barWidth / 2;
            const barHeight = (item.value / maxValue) * height;
            const y = top + height - barHeight;

            // Get monochrome color based on severity
            const severityIndex = this.getSeverityIndex(item.label);
            const color = colors.severities[severityIndex];

            // Draw bar
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = this.hoveredIndex === i ? 1 : 0.85;

            this.drawRoundedBar(x, y, barWidth, barHeight);

            this.ctx.globalAlpha = 1;

            // Draw value on top
            if (this.options.showValues) {
                this.ctx.font = 'bold 12px var(--font-sans)';
                this.ctx.fillStyle = colors.text;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'bottom';
                this.ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
            }

            // Draw label
            this.ctx.font = '12px var(--font-sans)';
            this.ctx.fillStyle = colors.muted;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(item.label, x + barWidth / 2, top + height + 10);
        });
    }

    drawRoundedBar(x, y, width, height) {
        const radius = this.options.barRadius;
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    render() {
        this.clear();
        this.drawGrid();
        this.drawBars();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const { width, left, top } = this.getDimensions();
            const barCount = this.data.length;
            const barWidth = (width / barCount) * 0.6;

            let newHoveredIndex = -1;

            this.data.forEach((item, i) => {
                const barX = left + (i + 0.5) * (width / barCount) - barWidth / 2;
                const barRight = barX + barWidth;

                if (x >= barX && x <= barRight && y >= top) {
                    newHoveredIndex = i;
                }
            });

            if (newHoveredIndex !== this.hoveredIndex) {
                this.hoveredIndex = newHoveredIndex;
                this.render();
            }

            this.canvas.style.cursor = newHoveredIndex !== -1 ? 'pointer' : 'default';
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
