/**
 * Line Chart Renderer
 * Multi-line chart with smooth curves and gradient fills
 */

import {
    setupCanvas,
    createScale,
    getChartColors,
    animate,
    drawText,
    showTooltip,
    hideTooltip,
    debounce,
    calculateControlPoints,
    formatDate
} from './chart-utils.js';

export class LineChart {
    constructor(canvasId, chartData, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.labels = chartData.labels;
        this.datasets = chartData.datasets; // [{ label, data: [...], color }]
        this.options = {
            padding: { top: 30, right: 30, bottom: 60, left: 50 },
            smooth: true,
            showPoints: true,
            showGrid: true,
            gradientFill: true,
            ...options
        };

        this.hoveredPoint = null;

        this.resize();
        this.setupEventListeners();
    }

    resize() {
        const width = this.canvas.parentElement.clientWidth;
        const height = this.options.height || 350;
        this.ctx = setupCanvas(this.canvas, width, height);
        this.width = width;
        this.height = height;
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
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawGrid() {
        const { width, height, left, top } = this.getDimensions();
        const allValues = this.datasets.flatMap(d => d.data);
        const maxValue = Math.max(...allValues, 1);
        const yScale = createScale([0, maxValue], [height, 0]);

        const colors = getChartColors();

        this.ctx.strokeStyle = colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;
        this.ctx.setLineDash([2, 2]);

        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const value = (maxValue / 5) * i;
            const y = top + yScale(value);

            this.ctx.beginPath();
            this.ctx.moveTo(left, y);
            this.ctx.lineTo(left + width, y);
            this.ctx.stroke();

            this.ctx.globalAlpha = 1;
            drawText(this.ctx, Math.round(value).toString(), left - 10, y, {
                align: 'right',
                baseline: 'middle',
                font: '11px sans-serif',
                color: colors.muted
            });
            this.ctx.globalAlpha = 0.3;
        }

        this.ctx.globalAlpha = 1;
        this.ctx.setLineDash([]);
    }

    drawLine(dataset, progress = 1) {
        const { width, height, left, top } = this.getDimensions();
        const allValues = this.datasets.flatMap(d => d.data);
        const maxValue = Math.max(...allValues, 1);

        const xScale = createScale([0, dataset.data.length - 1], [0, width]);
        const yScale = createScale([0, maxValue], [height, 0]);

        const points = dataset.data.map((value, i) => ({
            x: left + xScale(i),
            y: top + yScale(value * progress)
        }));

        const colors = getChartColors();
        const color = colors[dataset.color] || dataset.color;

        // Draw gradient fill
        if (this.options.gradientFill) {
            const gradient = this.ctx.createLinearGradient(0, top, 0, top + height);
            // Convert oklch to oklch with alpha
            const colorWithAlpha = color.replace('oklch(', 'oklch(').replace(')', ' / 0.2)');
            const transparentColor = color.replace('oklch(', 'oklch(').replace(')', ' / 0)');

            gradient.addColorStop(0, colorWithAlpha);
            gradient.addColorStop(1, transparentColor);

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, top + height);
            points.forEach(p => this.ctx.lineTo(p.x, p.y));
            this.ctx.lineTo(points[points.length - 1].x, top + height);
            this.ctx.closePath();
            this.ctx.fill();
        }

        // Draw line
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();

        if (this.options.smooth && points.length > 2) {
            this.ctx.moveTo(points[0].x, points[0].y);

            for (let i = 0; i < points.length - 1; i++) {
                const xc = (points[i].x + points[i + 1].x) / 2;
                const yc = (points[i].y + points[i + 1].y) / 2;
                this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }

            this.ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        } else {
            points.forEach((p, i) => {
                i === 0 ? this.ctx.moveTo(p.x, p.y) : this.ctx.lineTo(p.x, p.y);
            });
        }

        this.ctx.stroke();

        // Draw points
        if (this.options.showPoints) {
            points.forEach((p, i) => {
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                this.ctx.fill();

                // White border
                const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
                this.ctx.strokeStyle = bgColor;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            });
        }
    }

    drawLegend() {
        const { left, top } = this.getDimensions();
        let legendX = left;

        const colors = getChartColors();

        this.datasets.forEach((dataset, i) => {
            const color = colors[dataset.color] || dataset.color;

            // Color box
            this.ctx.fillStyle = color;
            this.ctx.fillRect(legendX, top - 20, 12, 12);

            // Label
            drawText(this.ctx, dataset.label, legendX + 18, top - 14, {
                align: 'left',
                baseline: 'middle',
                font: '12px sans-serif',
                color: colors.text
            });

            legendX += this.ctx.measureText(dataset.label).width + 40;
        });
    }

    drawXAxisLabels() {
        const { width, height, left, top } = this.getDimensions();
        const labelCount = Math.min(this.labels.length, 6);
        const step = Math.floor(this.labels.length / labelCount);

        const colors = getChartColors();

        for (let i = 0; i < labelCount; i++) {
            const index = i * step;
            if (index >= this.labels.length) break;

            const x = left + (width / (this.labels.length - 1)) * index;
            const label = formatDate(this.labels[index]);

            drawText(this.ctx, label, x, top + height + 25, {
                align: 'center',
                font: '11px sans-serif',
                color: colors.muted
            });
        }
    }

    render() {
        this.clear();
        this.drawGrid();

        animate((eased) => {
            this.clear();
            this.drawGrid();
            this.datasets.forEach(dataset => this.drawLine(dataset, eased));
            if (eased === 1) {
                this.drawLegend();
                this.drawXAxisLabels();
            }
        }, 1000);
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;

            const { width, left } = this.getDimensions();
            const relX = x - left;

            if (relX >= 0 && relX <= width) {
                const index = Math.round((relX / width) * (this.labels.length - 1));

                if (index >= 0 && index < this.labels.length) {
                    const tooltipContent = `
            <strong>${formatDate(this.labels[index])}</strong><br/>
            ${this.datasets.map(d => `${d.label}: ${d.data[index]}`).join('<br/>')}
          `;
                    showTooltip(tooltipContent, e.clientX, e.clientY);
                }
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            hideTooltip();
        });

        window.addEventListener('resize', debounce(() => {
            this.resize();
            this.render();
        }, 250));
    }
}
