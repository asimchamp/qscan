/**
 * Application Status Distribution Chart
 * Displays stacked bar chart showing status breakdown per application
 * Following shadcn/ui design language with monochrome grey palette
 */

export class ApplicationStatusChart {
    constructor(canvasId, data, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`ApplicationStatusChart: Canvas ${canvasId} not found`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.data = data || [];
        this.options = {
            height: 400,
            padding: { top: 40, right: 20, bottom: 80, left: 120 },
            barSpacing: 0.15, // Reduced spacing for thicker bars
            ...options
        };

        this.processedData = [];
        this.hoveredBar = -1;
        this.hoveredSegment = null;

        this.setupCanvas();
        this.bindEvents();
        this.processData(data);
        this.render();
    }

    /**
     * Setup canvas dimensions with DPR scaling
     */
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;

        // Set display size (CSS pixels)
        this.canvas.style.width = '700px';  // Reduced from 800px for better alignment
        this.canvas.style.height = this.options.height + 'px';

        // Set actual size in memory (scaled for DPR)
        this.canvas.width = 700 * dpr;
        this.canvas.height = this.options.height * dpr;

        // Scale context for DPR
        this.ctx.scale(dpr, dpr);

        // Store dimensions for rendering
        this.width = 700;
        this.height = this.options.height;
    }

    /**
     * Process data into application + status breakdown
     */
    processData(rawData) {
        const appStatusMap = new Map();

        rawData.forEach(item => {
            const app = item.Application || 'Unknown';
            const status = item['Vuln Status'] || 'Unknown';

            if (!appStatusMap.has(app)) {
                appStatusMap.set(app, {
                    application: app,
                    statuses: new Map(),
                    total: 0
                });
            }

            const appData = appStatusMap.get(app);
            appData.statuses.set(status, (appData.statuses.get(status) || 0) + 1);
            appData.total++;
        });

        // Convert to array and sort by total (descending)
        this.processedData = Array.from(appStatusMap.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 15); // Top 15 applications

        return this.processedData;
    }

    /**
     * Get theme-aware monochrome grey palette for status segments
     */
    getColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        if (isDark) {
            return {
                statuses: [
                    '#fafafa', // Lightest
                    '#d4d4d4',
                    '#a1a1aa',
                    '#737373',
                    '#525252'  // Darkest
                ],
                text: '#fafafa',
                grid: '#404040',
                axis: '#737373',
                tooltip: '#262626'
            };
        } else {
            return {
                statuses: [
                    '#171717', // Darkest
                    '#404040',
                    '#737373',
                    '#a1a1aa',
                    '#d4d4d8'  // Lightest
                ],
                text: '#171717',
                grid: '#e5e5e5',
                axis: '#525252',
                tooltip: '#ffffff'
            };
        }
    }

    /**
     * Render the chart
     */
    render() {
        if (!this.ctx) return;

        // Force complete canvas clear for theme changes
        const dpr = window.devicePixelRatio || 1;
        this.ctx.clearRect(0, 0, this.width * dpr, this.height * dpr);
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.processedData.length === 0) {
            this.renderEmptyState();
            return;
        }

        const colors = this.getColors();
        const { padding } = this.options;
        const chartWidth = this.width - padding.left - padding.right;
        const chartHeight = this.height - padding.top - padding.bottom;

        // Calculate bar dimensions
        const barCount = this.processedData.length;
        const barHeight = chartHeight / barCount;
        const barInnerHeight = barHeight * (1 - this.options.barSpacing);
        const barPadding = barHeight * this.options.barSpacing;

        // Find max total for scaling
        const maxTotal = Math.max(...this.processedData.map(d => d.total));
        const scale = chartWidth / (maxTotal * 1.1); // 10% padding

        // Draw grid lines
        this.drawGrid(chartWidth, maxTotal, colors, padding);

        // Draw bars
        this.processedData.forEach((item, index) => {
            const y = padding.top + (index * barHeight) + (barPadding / 2);
            const allStatuses = Array.from(item.statuses.entries());

            let currentX = padding.left;

            // Draw each status segment
            allStatuses.forEach(([status, count], statusIndex) => {
                const segmentWidth = count * scale;
                const colorIndex = statusIndex % colors.statuses.length;

                const isHovered = index === this.hoveredBar &&
                    this.hoveredSegment?.status === status;

                this.ctx.fillStyle = colors.statuses[colorIndex];
                this.ctx.globalAlpha = isHovered ? 1.0 : 0.85;

                this.ctx.fillRect(currentX, y, segmentWidth, barInnerHeight);

                currentX += segmentWidth;
            });

            // Draw application name (left side)
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = colors.text;
            this.ctx.font = '12px var(--font-sans)';
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                this.truncateText(item.application, 18),
                padding.left - 10,
                y + barInnerHeight / 2
            );

            // Draw total count (right side)
            this.ctx.fillStyle = colors.axis;
            this.ctx.globalAlpha = 0.7;
            this.ctx.font = '11px var(--font-sans)';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(
                item.total,
                currentX + 5,
                y + barInnerHeight / 2
            );
        });

        this.ctx.globalAlpha = 1.0;

        // Draw X-axis labels
        this.drawXAxisLabels(maxTotal, chartWidth, colors, padding);

        // Draw hover tooltip
        if (this.hoveredBar >= 0 && this.hoveredSegment) {
            this.drawTooltip();
        }
    }

    /**
     * Draw grid lines
     */
    drawGrid(chartWidth, maxTotal, colors, padding) {
        const gridLines = 5;
        const step = chartWidth / gridLines;

        this.ctx.strokeStyle = colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.2;

        for (let i = 0; i <= gridLines; i++) {
            const x = padding.left + (i * step);
            this.ctx.beginPath();
            this.ctx.moveTo(x, padding.top);
            this.ctx.lineTo(x, this.height - padding.bottom);
            this.ctx.stroke();
        }

        this.ctx.globalAlpha = 1.0;
    }

    /**
     * Draw X-axis labels
     */
    drawXAxisLabels(maxTotal, chartWidth, colors, padding) {
        const gridLines = 5;
        const step = maxTotal / gridLines;

        this.ctx.fillStyle = colors.text;
        this.ctx.globalAlpha = 0.7;
        this.ctx.font = '11px var(--font-sans)';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        for (let i = 0; i <= gridLines; i++) {
            const value = Math.round(i * step);
            const x = padding.left + (i * (chartWidth / gridLines));
            this.ctx.fillText(value, x, this.height - padding.bottom + 10);
        }

        this.ctx.globalAlpha = 1.0;
    }

    /**
     * Draw tooltip
     */
    drawTooltip() {
        if (!this.hoveredSegment) return;

        const colors = this.getColors();
        const { application, status, count, total } = this.hoveredSegment;
        const percentage = ((count / total) * 100).toFixed(1);

        const text = `${application} - ${status}: ${count} (${percentage}%)`;

        this.ctx.font = '13px var(--font-sans)';
        const metrics = this.ctx.measureText(text);
        const tooltipWidth = metrics.width + 24;
        const tooltipHeight = 32;

        // Position at top center
        const x = this.width / 2 - tooltipWidth / 2;
        const y = 10;

        // Draw background
        this.ctx.fillStyle = colors.tooltip;
        this.ctx.strokeStyle = colors.axis;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.95;

        this.drawRoundedRect(x, y, tooltipWidth, tooltipHeight, 6);

        // Draw text
        this.ctx.globalAlpha = 1.0;
        this.ctx.fillStyle = colors.text;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + 12, y + tooltipHeight / 2);
    }

    /**
     * Draw rounded rectangle
     */
    drawRoundedRect(x, y, width, height, radius) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        const colors = this.getColors();
        this.ctx.fillStyle = colors.text;
        this.ctx.globalAlpha = 0.5;
        this.ctx.font = '14px var(--font-sans)';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('No data available', this.width / 2, this.height / 2);
        this.ctx.globalAlpha = 1.0;
    }

    /**
     * Truncate text to max length
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 2) + '..';
    }

    /**
     * Bind mouse events
     */
    bindEvents() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const { padding } = this.options;
        const chartHeight = this.height - padding.top - padding.bottom;
        const barHeight = chartHeight / this.processedData.length;
        const barInnerHeight = barHeight * (1 - this.options.barSpacing);
        const barPadding = barHeight * this.options.barSpacing;

        // Find which bar was hovered
        const barIndex = Math.floor((y - padding.top) / barHeight);

        if (barIndex >= 0 && barIndex < this.processedData.length) {
            const item = this.processedData[barIndex];
            const barY = padding.top + (barIndex * barHeight) + (barPadding / 2);

            // Check if mouse is within bar height
            if (y >= barY && y <= barY + barInnerHeight) {
                const maxTotal = Math.max(...this.processedData.map(d => d.total));
                const chartWidth = this.width - padding.left - padding.right;
                const scale = chartWidth / (maxTotal * 1.1);

                // Find which segment was hovered
                let currentX = padding.left;
                const allStatuses = Array.from(item.statuses.entries());

                for (const [status, count] of allStatuses) {
                    const segmentWidth = count * scale;

                    if (x >= currentX && x <= currentX + segmentWidth) {
                        const newSegment = {
                            application: item.application,
                            status,
                            count,
                            total: item.total
                        };

                        if (this.hoveredBar !== barIndex ||
                            this.hoveredSegment?.status !== status) {
                            this.hoveredBar = barIndex;
                            this.hoveredSegment = newSegment;
                            this.render();
                        }

                        this.canvas.style.cursor = 'pointer';
                        return;
                    }

                    currentX += segmentWidth;
                }
            }
        }

        // No hover
        if (this.hoveredBar !== -1) {
            this.hoveredBar = -1;
            this.hoveredSegment = null;
            this.render();
        }
        this.canvas.style.cursor = 'default';
    }

    /**
     * Handle mouse leave
     */
    handleMouseLeave() {
        if (this.hoveredBar !== -1) {
            this.hoveredBar = -1;
            this.hoveredSegment = null;
            this.render();
        }
        this.canvas.style.cursor = 'default';
    }

    /**
     * Update chart with new data
     */
    update(data) {
        this.data = data;
        this.processData(data);
        this.render();
    }

    /**
     * Destroy chart
     */
    destroy() {
        if (this.canvas) {
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
        }
    }
}
