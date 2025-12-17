/**
 * Sparkline Renderer
 * Tiny trend charts for metric cards
 */

import { setupCanvas, createScale, getChartColors } from './chart-utils.js';

export class Sparkline {
    constructor(canvasId, data, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.data = data; // Array of numbers
        this.options = {
            color: 'primary',
            lineWidth: 1.5,
            showArea: true,
            ...options
        };

        this.colors = getChartColors();
        this.render();
    }

    render() {
        const width = 100;
        const height = 30;
        const ctx = setupCanvas(this.canvas, width, height);

        if (this.data.length < 2) return;

        const color = this.colors[this.options.color] || this.options.color;
        const minValue = Math.min(...this.data);
        const maxValue = Math.max(...this.data);

        const xScale = createScale([0, this.data.length - 1], [2, width - 2]);
        const yScale = createScale([minValue, maxValue], [height - 2, 2]);

        const points = this.data.map((value, i) => ({
            x: xScale(i),
            y: yScale(value)
        }));

        // Draw area fill
        if (this.options.showArea) {
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, color.replace(')', ', 0.3)').replace('hsl', 'hsla'));
            gradient.addColorStop(1, color.replace(')', ', 0)').replace('hsl', 'hsla'));

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(points[0].x, height);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(points[points.length - 1].x, height);
            ctx.closePath();
            ctx.fill();
        }

        // Draw line
        ctx.strokeStyle = color;
        ctx.lineWidth = this.options.lineWidth;
        ctx.beginPath();
        points.forEach((p, i) => {
            i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
    }
}
