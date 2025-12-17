/**
 * Vulnerability Timeline Bar Chart
 * Displays monthly vulnerability counts with theme-aware monochrome palette
 */

export class TimelineChart {
    constructor(canvasId, data, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`TimelineChart: Canvas ${canvasId} not found`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.data = data || [];
        this.options = {
            height: 280,
            padding: { top: 40, right: 20, bottom: 60, left: 60 },
            barSpacing: 0.2,
            animationDuration: 400,
            ...options
        };

        this.timelineData = [];
        this.hoveredIndex = -1;

        this.setupCanvas();
        this.bindEvents();
    }

    /**
     * Setup canvas dimensions
     */
    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = this.options.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = this.options.height + 'px';

        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = this.options.height;
    }

    /**
     * Process data into monthly timeline
     */
    processTimelineData(rawData, timeRange = null) {
        const monthlyCounts = new Map();

        // Determine date range
        let minDate, maxDate;

        if (timeRange && !timeRange.isAll && timeRange.fromYear && timeRange.toYear) {
            minDate = new Date(timeRange.fromYear, (timeRange.fromMonth || 1) - 1, 1);
            maxDate = new Date(timeRange.toYear, (timeRange.toMonth || 12), 0); // Last day of month
        } else {
            // Find min and max dates from data
            const dates = rawData.map(item => new Date(item['First Detected']))
                .filter(d => !isNaN(d.getTime()));

            if (dates.length > 0) {
                minDate = new Date(Math.min(...dates));
                maxDate = new Date(Math.max(...dates));
                minDate.setDate(1); // First day of month
                maxDate.setMonth(maxDate.getMonth() + 1, 0); // Last day of month
            } else {
                minDate = new Date();
                maxDate = new Date();
            }
        }

        // Initialize all months in range with 0
        const currentDate = new Date(minDate);
        while (currentDate <= maxDate) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const key = `${year}-${String(month).padStart(2, '0')}`;
            monthlyCounts.set(key, 0);
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        // Count vulnerabilities per month
        rawData.forEach(item => {
            const date = new Date(item['First Detected']);
            if (isNaN(date.getTime())) return;

            const year = date.getFullYear();
            const month = date.getMonth() + 1; // 1-12

            // Apply time range filter if provided
            if (timeRange && !timeRange.isAll) {
                const { fromYear, fromMonth, toYear, toMonth } = timeRange;

                if (fromYear && fromMonth) {
                    const fromDate = new Date(fromYear, fromMonth - 1);
                    const itemDate = new Date(year, month - 1);
                    if (itemDate < fromDate) return;
                }

                if (toYear && toMonth) {
                    const toDate = new Date(toYear, toMonth);
                    const itemDate = new Date(year, month);
                    if (itemDate > toDate) return;
                }
            }

            const key = `${year}-${String(month).padStart(2, '0')}`;
            if (monthlyCounts.has(key)) {
                monthlyCounts.set(key, monthlyCounts.get(key) + 1);
            }
        });

        // Sort by date and create timeline data
        const sorted = Array.from(monthlyCounts.entries())
            .sort((a, b) => a[0].localeCompare(b[0]));

        this.timelineData = sorted.map(([key, count]) => {
            const [year, month] = key.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return {
                key,
                year: parseInt(year),
                month: parseInt(month),
                label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                count
            };
        });

        return this.timelineData;
    }

    /**
     * Get theme-aware colors
     */
    getColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        return {
            barFill: isDark ? '#fafafa' : '#171717',
            barHover: isDark ? '#ffffff' : '#000000',
            text: isDark ? '#fafafa' : '#171717',
            grid: isDark ? '#404040' : '#e5e5e5',
            axis: isDark ? '#737373' : '#525252'
        };
    }

    /**
     * Render the chart
     */
    render() {
        if (!this.ctx) return;

        // Always clear the entire canvas first
        const dpr = window.devicePixelRatio || 1;
        this.ctx.clearRect(0, 0, this.width * dpr, this.height * dpr);
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.timelineData.length === 0) {
            this.renderEmptyState();
            return;
        }

        const colors = this.getColors();
        const { padding } = this.options;
        const chartWidth = this.width - padding.left - padding.right;
        const chartHeight = this.height - padding.top - padding.bottom;

        // Calculate bar dimensions
        const barCount = this.timelineData.length;
        const barWidth = chartWidth / barCount;
        const barInnerWidth = barWidth * (1 - this.options.barSpacing);
        const barPadding = barWidth * this.options.barSpacing;

        // Find max count for scaling
        const maxCount = Math.max(...this.timelineData.map(d => d.count));
        const scale = chartHeight / (maxCount * 1.1); // 10% padding at top

        // Draw grid lines
        this.drawGrid(chartHeight, maxCount, colors, padding);

        // Draw bars
        this.timelineData.forEach((item, index) => {
            const x = padding.left + (index * barWidth) + (barPadding / 2);
            const barHeight = item.count * scale;
            const y = padding.top + chartHeight - barHeight;

            const isHovered = index === this.hoveredIndex;
            this.ctx.fillStyle = isHovered ? colors.barHover : colors.barFill;
            this.ctx.globalAlpha = isHovered ? 1.0 : 0.8;

            // Draw bar with rounded top
            this.drawRoundedBar(x, y, barInnerWidth, barHeight, 4);

            // Draw label (rotated)
            if (index % Math.max(1, Math.floor(barCount / 12)) === 0) { // Show every Nth label
                this.ctx.save();
                this.ctx.translate(x + barInnerWidth / 2, this.height - padding.bottom + 15);
                this.ctx.rotate(-Math.PI / 4);
                this.ctx.fillStyle = colors.text;
                this.ctx.globalAlpha = 0.7;
                this.ctx.font = '11px var(--font-sans)';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(item.label, 0, 0);
                this.ctx.restore();
            }
        });

        this.ctx.globalAlpha = 1.0;

        // Draw Y-axis labels
        this.drawYAxisLabels(maxCount, chartHeight, colors, padding);

        // Draw hover tooltip
        if (this.hoveredIndex >= 0) {
            this.drawTooltip(this.hoveredIndex);
        }
    }

    /**
     * Draw rounded bar
     */
    drawRoundedBar(x, y, width, height, radius) {
        const ctx = this.ctx;
        ctx.beginPath();

        // Start from bottom left
        ctx.moveTo(x, y + height);
        ctx.lineTo(x, y + radius);

        // Top left corner
        ctx.arcTo(x, y, x + radius, y, radius);

        // Top right corner
        ctx.arcTo(x + width, y, x + width, y + radius, radius);

        // Bottom right
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);

        ctx.closePath();
        ctx.fill();
    }

    /**
     * Draw grid lines
     */
    drawGrid(chartHeight, maxCount, colors, padding) {
        const gridLines = 5;
        const step = chartHeight / gridLines;

        this.ctx.strokeStyle = colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;

        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (i * step);
            this.ctx.beginPath();
            this.ctx.moveTo(padding.left, y);
            this.ctx.lineTo(this.width - padding.right, y);
            this.ctx.stroke();
        }

        this.ctx.globalAlpha = 1.0;
    }

    /**
     * Draw Y-axis labels
     */
    drawYAxisLabels(maxCount, chartHeight, colors, padding) {
        const gridLines = 5;
        const step = maxCount / gridLines;

        this.ctx.fillStyle = colors.text;
        this.ctx.globalAlpha = 0.7;
        this.ctx.font = '12px var(--font-sans)';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';

        for (let i = 0; i <= gridLines; i++) {
            const value = Math.round(maxCount - (i * step));
            const y = padding.top + (i * (chartHeight / gridLines));
            this.ctx.fillText(value, padding.left - 10, y);
        }

        this.ctx.globalAlpha = 1.0;
    }

    /**
     * Draw tooltip
     */
    drawTooltip(index) {
        const item = this.timelineData[index];
        const colors = this.getColors();

        // Tooltip text
        const text = `${item.label}: ${item.count} vulnerabilities`;

        this.ctx.font = '13px var(--font-sans)';
        const metrics = this.ctx.measureText(text);
        const tooltipWidth = metrics.width + 24;
        const tooltipHeight = 32;

        // Calculate position
        const { padding } = this.options;
        const barCount = this.timelineData.length;
        const barWidth = (this.width - padding.left - padding.right) / barCount;
        const x = padding.left + (index * barWidth) + (barWidth / 2);
        const y = padding.top - 10;

        // Draw tooltip background
        this.ctx.fillStyle = isDarkTheme() ? '#262626' : '#ffffff';
        this.ctx.strokeStyle = colors.axis;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.95;

        const tooltipX = Math.max(10, Math.min(x - tooltipWidth / 2, this.width - tooltipWidth - 10));
        this.drawRoundedRect(tooltipX, y - tooltipHeight - 5, tooltipWidth, tooltipHeight, 6);

        // Draw text
        this.ctx.globalAlpha = 1.0;
        this.ctx.fillStyle = colors.text;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, tooltipX + 12, y - tooltipHeight / 2 - 5);
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
        this.ctx.fillText('No data available for selected time range', this.width / 2, this.height / 2);
        this.ctx.globalAlpha = 1.0;
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

        const { padding } = this.options;
        const chartWidth = this.width - padding.left - padding.right;
        const barWidth = chartWidth / this.timelineData.length;

        const index = Math.floor((x - padding.left) / barWidth);

        if (index >= 0 && index < this.timelineData.length) {
            if (this.hoveredIndex !== index) {
                this.hoveredIndex = index;
                this.render();
            }
            this.canvas.style.cursor = 'pointer';
        } else {
            if (this.hoveredIndex !== -1) {
                this.hoveredIndex = -1;
                this.render();
            }
            this.canvas.style.cursor = 'default';
        }
    }

    /**
     * Handle mouse leave
     */
    handleMouseLeave() {
        if (this.hoveredIndex !== -1) {
            this.hoveredIndex = -1;
            this.render();
        }
        this.canvas.style.cursor = 'default';
    }

    /**
     * Update chart with new data
     */
    update(data, timeRange) {
        this.data = data;
        this.processTimelineData(data, timeRange);
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

/**
 * Helper function to check if dark theme is active
 */
function isDarkTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}
