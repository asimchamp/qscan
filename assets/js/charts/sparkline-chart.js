/**
 * Mini Sparkline Chart Component
 * Creates small inline trend visualizations for metric cards
 * Following shadcn/ui design language
 */

export class SparklineChart {
    constructor(canvasId, data, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`SparklineChart: Canvas ${canvasId} not found`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.data = data || [];
        this.options = {
            width: 120,
            height: 40,
            lineWidth: 2,
            showDots: true,
            smooth: true,
            color: null, // Auto-detect from theme
            ...options
        };

        this.setupCanvas();
    }

    /**
     * Setup canvas dimensions
     */
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = this.options.width * dpr;
        this.canvas.height = this.options.height * dpr;
        this.canvas.style.width = this.options.width + 'px';
        this.canvas.style.height = this.options.height + 'px';

        this.ctx.scale(dpr, dpr);
        this.width = this.options.width;
        this.height = this.options.height;
    }

    /**
     * Get theme-aware color
     */
    getColor() {
        if (this.options.color) return this.options.color;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return isDark ? '#fafafa' : '#171717';
    }

    /**
     * Render the sparkline
     */
    render() {
        if (!this.ctx || this.data.length === 0) return;

        // Clear canvas
        const dpr = window.devicePixelRatio || 1;
        this.ctx.clearRect(0, 0, this.width * dpr, this.height * dpr);
        this.ctx.clearRect(0, 0, this.width, this.height);

        const color = this.getColor();
        const padding = 4;
        const chartWidth = this.width - (padding * 2);
        const chartHeight = this.height - (padding * 2);

        // Find min and max
        const values = this.data.map(d => d.value || d);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        // Calculate points
        const points = values.map((value, index) => {
            const x = padding + (index / (values.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((value - min) / range) * chartHeight;
            return { x, y };
        });

        // Draw gradient fill
        if (this.options.showFill !== false) {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, color + '20'); // 12% opacity
            gradient.addColorStop(1, color + '00'); // 0% opacity

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, this.height - padding);
            points.forEach(point => this.ctx.lineTo(point.x, point.y));
            this.ctx.lineTo(points[points.length - 1].x, this.height - padding);
            this.ctx.closePath();
            this.ctx.fill();
        }

        // Draw line
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = this.options.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        points.forEach((point, index) => {
            if (index === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        });
        this.ctx.stroke();

        // Draw dots
        if (this.options.showDots) {
            this.ctx.fillStyle = color;

            // Only show first and last dot
            [points[0], points[points.length - 1]].forEach(point => {
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }
    }

    /**
     * Update chart with new data
     */
    update(data) {
        this.data = data;
        this.render();
    }

    /**
     * Destroy chart
     */
    destroy() {
        // Cleanup if needed
    }
}
