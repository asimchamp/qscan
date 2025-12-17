/**
 * All Owners Radial Chart
 * Multi-layer concentric ownership visualization
 * Renders ownership distribution in a premium radial format
 */

import { getChartColors, animate, debounce } from './chart-utils.js';

export class AllOwnersRadialChart {
    constructor(containerId, data, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        this.rawData = data;
        this.options = {
            size: 400,
            padding: 80,
            centerRadius: 0.35,
            innerRingStart: 0.5,
            innerRingEnd: 0.65,
            outerRingStart: 0.7,
            outerRingEnd: 0.9,
            guideLinesCount: 5,
            radialLinesCount: 12,
            animationDuration: 1200,
            ...options
        };

        this.hoveredSegment = null;
        this.ownershipData = this.processOwnershipData();

        this.init();
    }

    /**
     * Process CSV data to calculate ownership distribution
     * Shows top 5 owners individually + "Others" for remaining
     */
    processOwnershipData() {
        // Count vulnerabilities by owner
        const ownerCounts = {};

        this.rawData.forEach(row => {
            const owner = row['LT Owner'] || 'Unknown';
            ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;
        });

        const total = this.rawData.length;

        // Sort owners by count (descending)
        const sortedOwners = Object.entries(ownerCounts)
            .sort((a, b) => b[1] - a[1]);

        // Take top 5 owners
        const topOwners = sortedOwners.slice(0, 5);
        const otherOwners = sortedOwners.slice(5);

        // Calculate "Others" total
        const othersTotal = otherOwners.reduce((sum, [, count]) => sum + count, 0);

        // Build categories array
        const categories = [];

        // Color palette - use chart colors with good visibility
        // These are the actual chart color CSS variables
        const colors = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'muted'];

        // Add top owners
        topOwners.forEach(([owner, count], index) => {
            categories.push({
                label: owner,
                value: count,
                percentage: (count / total) * 100,
                color: colors[index],
                ringIndex: index
            });
        });

        // Add "Others" if there are remaining owners
        if (othersTotal > 0) {
            categories.push({
                label: 'Others',
                labelVi: 'CỔ ĐÔNG KHÁC',
                value: othersTotal,
                percentage: (othersTotal / total) * 100,
                color: colors[5],
                ringIndex: 5
            });
        }

        return {
            categories,
            total
        };
    }

    /**
     * Initialize SVG and render
     */
    init() {
        this.createSVG();
        this.render();
        this.setupEventListeners();
    }

    /**
     * Create SVG element
     */
    createSVG() {
        const { size, padding } = this.options;
        const totalSize = size + (padding * 2);

        this.container.innerHTML = `
            <svg id="radial-chart-svg" 
                 viewBox="0 0 ${totalSize} ${totalSize}" 
                 class="radial-chart">
                <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                        <feOffset dx="0" dy="2" result="offsetblur"/>
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.2"/>
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <g id="guide-rings" transform="translate(${padding}, ${padding})"></g>
                <g id="radial-lines" transform="translate(${padding}, ${padding})"></g>
                <g id="data-arcs" transform="translate(${padding}, ${padding})"></g>
                <g id="labels" transform="translate(${padding}, ${padding})"></g>
            </svg>
        `;

        this.svg = document.getElementById('radial-chart-svg');
    }

    /**
     * Render complete chart
     */
    render() {
        console.log('RadialChart: Starting render');
        this.clear();

        // Draw static elements once
        this.drawGuideRings();
        this.drawRadialLines();
        console.log('RadialChart: Static elements drawn');

        // Draw base ring for 3D effect
        this.drawBaseRing();

        // Draw arcs at 100% immediately (NO ANIMATION for testing)
        this.drawDataArcs(1);
        this.drawLabels();
        console.log('RadialChart: Arcs and labels drawn (no animation)');
    }

    /**
     * Clear chart
     */
    clear() {
        ['guide-rings', 'radial-lines', 'data-arcs', 'labels'].forEach(id => {
            const g = document.getElementById(id);
            if (g) g.innerHTML = '';
        });
    }

    /**
     * Draw concentric guide rings
     */
    drawGuideRings() {
        const { size, guideLinesCount, centerRadius } = this.options;
        const center = size / 2;
        const maxRadius = (size / 2) * 0.95;
        const minRadius = (size / 2) * centerRadius;
        const g = document.getElementById('guide-rings');
        const colors = getChartColors();

        for (let i = 0; i <= guideLinesCount; i++) {
            const radius = minRadius + ((maxRadius - minRadius) / guideLinesCount) * i;
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', center);
            circle.setAttribute('cy', center);
            circle.setAttribute('r', radius);
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', colors.grid);
            circle.setAttribute('stroke-width', '0.5');
            circle.setAttribute('opacity', '0.2');
            g.appendChild(circle);
        }
    }

    /**
     * Draw radial divider lines
     */
    drawRadialLines() {
        const { size, radialLinesCount, centerRadius } = this.options;
        const center = size / 2;
        const innerRadius = (size / 2) * centerRadius;
        const outerRadius = (size / 2) * 0.95;
        const g = document.getElementById('radial-lines');
        const colors = getChartColors();

        for (let i = 0; i < radialLinesCount; i++) {
            const angle = (Math.PI * 2 / radialLinesCount) * i - Math.PI / 2;
            const x1 = center + innerRadius * Math.cos(angle);
            const y1 = center + innerRadius * Math.sin(angle);
            const x2 = center + outerRadius * Math.cos(angle);
            const y2 = center + outerRadius * Math.sin(angle);

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', colors.grid);
            line.setAttribute('stroke-width', '0.5');
            line.setAttribute('opacity', '0.15');
            g.appendChild(line);
        }
    }

    /**
     * Draw base full donut ring for 3D depth effect
     */
    drawBaseRing() {
        const g = document.getElementById('data-arcs');
        if (!g) return;

        const { size } = this.options;
        const center = size / 2;

        // Base ring spans from innermost to outermost radius
        const baseInnerRadius = (size / 2) * 0.38;
        const baseOuterRadius = (size / 2) * 0.92;

        // Full circle (360 degrees)
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2) - 0.001; // Prevent full circle collapse

        const path = this.createArcPath(center, center, baseInnerRadius, baseOuterRadius, startAngle, endAngle);
        const baseRing = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        baseRing.setAttribute('d', path);
        baseRing.setAttribute('fill', '#e5e5e5'); // Light grey for subtle 3D effect
        baseRing.setAttribute('opacity', '0.15');
        baseRing.setAttribute('stroke', 'none');
        baseRing.setAttribute('id', 'base-ring');

        // Insert as first child so it appears behind data arcs
        g.insertBefore(baseRing, g.firstChild);

        console.log('RadialChart: Base ring drawn');
    }

    /**
     * Draw data arcs - one ring per owner
     */
    drawDataArcs(progress = 1) {
        const g = document.getElementById('data-arcs');
        if (!g) {
            console.error('RadialChart: data-arcs group not found!');
            return;
        }

        // Clear previous rings
        g.innerHTML = '';

        const { size } = this.options;
        const center = size / 2;
        const colors = getChartColors();

        const numRings = this.ownershipData.categories.length;
        const ringWidth = 0.08; // Width of each ring
        const startRadius = 0.4; // Start from 40% of chart radius

        console.log(`RadialChart: Drawing ${numRings} rings at progress ${progress}`);

        this.ownershipData.categories.forEach((category, idx) => {
            // Reverse ring order: largest owner on outside
            const reversedIdx = numRings - 1 - idx;

            // Calculate ring radii - each ring is further out
            const innerRadiusRatio = startRadius + (ringWidth * reversedIdx);
            const outerRadiusRatio = innerRadiusRatio + ringWidth;

            const innerRadius = (size / 2) * innerRadiusRatio;
            const outerRadius = (size / 2) * outerRadiusRatio;

            // Draw arc based on percentage (not full circle)
            const startAngle = -Math.PI / 2; // Start at top
            const angleRange = (category.percentage / 100) * (Math.PI * 2); // Percentage of 360°

            // Apply animation progress
            const currentAngle = angleRange * progress;

            // Prevent 360° collapse (use 359.99° max)
            const maxAngle = Math.min(currentAngle, (Math.PI * 2) - 0.001);
            const endAngle = startAngle + maxAngle;

            // Use ONLY hex colors (no CSS variables)
            const hexColors = {
                'chart-1': '#ef4444', // Red
                'chart-2': '#3b82f6', // Blue
                'chart-3': '#8b5cf6', // Purple
                'chart-4': '#eab308', // Yellow
                'chart-5': '#f97316', // Orange
                'muted': '#71717a'    // Gray
            };

            const colorKey = category.color;
            const color = hexColors[colorKey] || '#3b82f6'; // Always use hex

            console.log(`Ring ${idx}: Using hex color ${color} for ${colorKey}`);
            const path = this.createArcPath(center, center, innerRadius, outerRadius, startAngle, endAngle);
            const arcElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            arcElement.setAttribute('d', path);
            arcElement.setAttribute('fill', color);
            arcElement.setAttribute('opacity', this.hoveredSegment === idx ? '1' : '0.85');
            arcElement.setAttribute('stroke', 'var(--background)');
            arcElement.setAttribute('stroke-width', '3');
            arcElement.setAttribute('data-index', idx);
            arcElement.style.transition = 'opacity 0.2s ease';

            g.appendChild(arcElement);
        });

        console.log(`RadialChart: Added ${numRings} path elements to SVG`);
    }

    /**
     * Create SVG arc path
     */
    createArcPath(cx, cy, innerR, outerR, startAngle, endAngle) {
        const startOuter = this.polarToCartesian(cx, cy, outerR, startAngle);
        const endOuter = this.polarToCartesian(cx, cy, outerR, endAngle);
        const startInner = this.polarToCartesian(cx, cy, innerR, startAngle);
        const endInner = this.polarToCartesian(cx, cy, innerR, endAngle);

        const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;

        return [
            `M ${startInner.x} ${startInner.y}`,
            `L ${startOuter.x} ${startOuter.y}`,
            `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
            `L ${endInner.x} ${endInner.y}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}`,
            'Z'
        ].join(' ');
    }

    /**
     * Convert polar to cartesian coordinates
     */
    polarToCartesian(cx, cy, radius, angle) {
        return {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle)
        };
    }

    /**
     * Draw labels with connector lines for each owner
     */
    drawLabels() {
        const g = document.getElementById('labels');
        if (!g) return;
        g.innerHTML = '';

        const { size } = this.options;
        const center = size / 2;
        const labelRadius = (size / 2) * 1.05; // Reduced from 1.15 to fit within viewBox

        // Get theme-aware colors from CSS variables
        const rootStyles = getComputedStyle(document.documentElement);
        const foreground = rootStyles.getPropertyValue('--foreground').trim();
        const mutedForeground = rootStyles.getPropertyValue('--muted-foreground').trim();

        // Position labels evenly around the circle
        const numCategories = this.ownershipData.categories.length;
        const angleStep = (Math.PI * 2) / numCategories;

        this.ownershipData.categories.forEach((category, idx) => {
            const angle = -Math.PI / 2 + (angleStep * idx);
            const point = this.polarToCartesian(center, center, labelRadius, angle);

            // Calculate ring center for connector
            const ringWidth = 0.08;
            const startRadius = 0.4;
            const ringCenterRatio = startRadius + (ringWidth * idx) + (ringWidth / 2);
            const arcPoint = this.polarToCartesian(center, center, (size / 2) * ringCenterRatio, angle);

            // Determine text alignment
            const align = point.x > center ? 'start' : 'end';

            // Connector line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', arcPoint.x);
            line.setAttribute('y1', arcPoint.y);
            line.setAttribute('x2', point.x);
            line.setAttribute('y2', point.y);
            line.setAttribute('stroke', `hsl(${mutedForeground})`);
            line.setAttribute('stroke-width', '1');
            line.setAttribute('opacity', '0.6');
            g.appendChild(line);

            // Label group  
            const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

            // Percentage (large, bold) - theme-aware color
            const percentage = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            percentage.setAttribute('x', point.x);
            percentage.setAttribute('y', point.y + 5);
            percentage.setAttribute('text-anchor', align);
            percentage.setAttribute('font-size', '22'); // Increased from 18
            percentage.setAttribute('font-weight', 'bold');
            percentage.setAttribute('fill', `hsl(${foreground})`); // Theme-aware
            percentage.textContent = `${category.percentage.toFixed(2)}%`;
            labelGroup.appendChild(percentage);

            // Owner name (smaller, above percentage) - theme-aware color
            const ownerName = category.labelVi || category.label;
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', point.x);
            label.setAttribute('y', point.y - 10);
            label.setAttribute('text-anchor', align);
            label.setAttribute('font-size', '14'); // Increased from 11
            label.setAttribute('font-weight', '500');
            label.setAttribute('fill', `hsl(${mutedForeground})`); // Theme-aware
            label.textContent = ownerName.length > 25 ? ownerName.substring(0, 22) + '...' : ownerName;
            labelGroup.appendChild(label);

            g.appendChild(labelGroup);
        });

        console.log('Labels drawn:', numCategories);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Hover on arc segments
        this.svg.addEventListener('mouseover', (e) => {
            if (e.target.tagName === 'path' && e.target.dataset.index !== undefined) {
                this.hoveredSegment = parseInt(e.target.dataset.index);
                this.drawDataArcs(1);
            }
        });

        this.svg.addEventListener('mouseout', () => {
            this.hoveredSegment = null;
            this.drawDataArcs(1);
        });

        // Responsive resize
        window.addEventListener('resize', debounce(() => {
            this.render();
        }, 250));
    }
}
