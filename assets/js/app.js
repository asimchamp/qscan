/**
 * App Bootstrap Module
 * Main application initialization
 */

import { loadCSV, normalizeData, getUniqueValues } from './csv-parser.js';
import { FilterManager } from './filters.js';
import { MetricsCalculator, formatNumber, formatDelta } from './metrics.js';
import { DataTable } from './table.js';
import { ThemeManager } from './theme.js';
import { loadSidebar } from './sidebar.js';
import { ChartDataProcessor } from './charts/chart-data.js';
import { BarChart } from './charts/bar-chart.js';
import { LineChart } from './charts/line-chart.js';
import { PieChart } from './charts/pie-chart.js';
import { AllOwnersRadialChart } from './charts/all-owners-radial.js';
import { TimelineChart } from './charts/timeline-chart.js';
import { TimeRangeFilter } from './time-range-filter.js';
import { ApplicationStatusChart } from './charts/application-status-chart.js';
import { SparklineChart } from './charts/sparkline-chart.js';

// Global state
let filterManager;
let metricsCalculator;
let dataTable;
let themeManager;
let rawData = [];
let chartDataProcessor;
let charts = {};
let timeRangeFilter;
let timelineChart;
let applicationStatusChart = null;
let sparklines = {};

/**
 * Initialize application
 */
async function init() {
    try {
        console.log('Initializing dashboard...');

        // Initialize theme
        themeManager = new ThemeManager();
        setupThemeToggle();

        // Load sidebar
        await loadSidebar();

        // Setup sidebar toggle
        setupSidebarToggle();

        // Load CSV data
        console.log('Loading CSV data...');
        rawData = await loadCSV('/data/WIP Appsec.csv');
        console.log(`Loaded ${rawData.length} vulnerability records`);

        // Normalize data
        const normalizedData = normalizeData(rawData);

        // Initialize managers
        filterManager = new FilterManager(normalizedData);
        metricsCalculator = new MetricsCalculator(normalizedData);
        dataTable = new DataTable('data-table', 10);

        // Populate filter dropdowns
        populateFilters();

        // Render initial state
        renderMetrics();
        dataTable.setData(normalizedData);

        // Initialize charts
        initializeCharts(normalizedData);

        // Initialize timeline chart
        timelineChart = new TimelineChart('timeline-chart', rawData, {
            height: 280
        });

        // Render Customize Columns button
        renderCustomizeColumnsButton();

        // Initialize application status chart
        applicationStatusChart = new ApplicationStatusChart('application-status-chart', rawData, {
            height: 400
        });

        // Initialize sparklines with sample trend data
        initializeSparklines(rawData);

        // Initialize time range filter
        initializeTimeRangeFilter();

        // Setup event listeners
        setupFilterListeners();

        console.log('Dashboard initialized successfully');

    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to load dashboard. Please refresh the page.');
    }
}

/**
 * Populate filter dropdowns
 */
function populateFilters() {
    // LT Owner
    const owners = filterManager.getUniqueValues('LT Owner');
    populateSelect('filter-owner', owners, 'All Owners');

    // Application
    const apps = filterManager.getUniqueValues('Application');
    populateSelect('filter-application', apps, 'All Applications');

    // Status
    const statuses = filterManager.getUniqueValues('Vuln Status');
    populateSelect('filter-status', statuses, 'All Status');
}

/**
 * Populate select element
 */
function populateSelect(id, options, placeholder) {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = `<option value="">${placeholder}</option>`;

    if (Array.isArray(options) && typeof options[0] === 'object') {
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            select.appendChild(option);
        });
    } else {
        options.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
    }
}

/**
 * Get unique years from data
 */
function getYearsFromData() {
    const years = new Set();
    rawData.forEach(row => {
        const date = new Date(row['First Detected']);
        if (!isNaN(date.getTime())) {
            years.add(date.getFullYear());
        }
    });
    return Array.from(years).sort((a, b) => b - a);
}

/**
 * Setup filter event listeners
 */
function setupFilterListeners() {
    const filterIds = ['filter-owner', 'filter-application', 'filter-status'];
    const filterKeys = ['owner', 'application', 'status'];

    filterIds.forEach((id, index) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', (e) => {
                const value = e.target.value || null;
                filterManager.setFilter(filterKeys[index], value);
                updateDashboard();
            });
        }
    });

    // Reset button
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            filterManager.reset();

            // Clear all selects
            filterIds.forEach(id => {
                const select = document.getElementById(id);
                if (select) select.value = '';
            });

            updateDashboard();
        });
    }
}

/**
 * Update dashboard after filter change
 */
function updateDashboard() {
    const filteredData = filterManager.getData();
    metricsCalculator.setData(filteredData);
    renderMetrics();
    // Update data table
    dataTable.setData(filteredData);

    // Update charts
    updateCharts(filteredData);

    // Update sparklines
    updateSparklines(filteredData);
}

/**
 * Render metrics to dashboard
 */
function renderMetrics() {
    const metrics = metricsCalculator.getAllMetrics();

    // Define metric configurations
    const metricConfigs = {
        total: {
            id: 'metric-total',
            value: metrics.total.value,
            delta: metrics.total.delta,
            deltaType: metrics.total.delta > 0 ? 'positive' : metrics.total.delta < 0 ? 'negative' : 'neutral'
        },
        active: {
            id: 'metric-active',
            value: metrics.active.value,
            delta: metrics.active.delta,
            deltaType: metrics.active.delta > 0 ? 'warning' : 'positive'
        },
        fixed: {
            id: 'metric-fixed',
            value: metrics.fixed.value,
            delta: metrics.fixed.delta,
            deltaType: metrics.fixed.delta > 0 ? 'positive' : 'neutral'
        },
        critical: {
            id: 'metric-critical',
            value: metrics.critical.value,
            delta: metrics.critical.delta,
            deltaType: metrics.critical.delta > 0 ? 'critical' : 'positive'
        }
    };

    // Update each metric card
    Object.values(metricConfigs).forEach(config => {
        const card = document.getElementById(config.id);
        if (!card) return;

        // Update value (not label - keep existing HTML label)
        const valueEl = card.querySelector('.card-value');
        if (valueEl) {
            valueEl.textContent = formatNumber(config.value);
        }

        // Update delta
        const deltaEl = card.querySelector('.card-delta');
        if (deltaEl) {
            deltaEl.textContent = formatDelta(config.delta);
            // Update delta class
            deltaEl.className = 'card-delta ' + config.deltaType;
        }
    });
}

/**
 * Setup theme toggle button
 */
function setupThemeToggle() {
    // Wait for sidebar to load
    setTimeout(() => {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                themeManager.toggle();

                // Re-render all charts to update colors
                rerenderAllCharts();
            });
        }
    }, 100);
}

/**
 * Setup sidebar collapse/expand toggle
 */
function setupSidebarToggle() {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');

    if (!sidebar || !toggleBtn) return;

    // Load saved state
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
    }

    // Toggle handler
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        const collapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebar-collapsed', collapsed);
    });
}
/**
 * Show error message
 */
function showError(message) {
    const main = document.querySelector('.main-content');
    if (main) {
        main.innerHTML = `< div style = "text-align: center; padding: 4rem; color: hsl(var(--destructive));" > ${message}</div > `;
    }
}

/**
 * Initialize all charts
 */
function initializeCharts(data) {
    chartDataProcessor = new ChartDataProcessor(data);

    // Bar Chart - Severity Distribution
    const severityData = chartDataProcessor.getSeverityDistribution();
    charts.barChart = new BarChart('severity-bar-chart', severityData, {
        height: 300
    });

    // Pie Chart - Severity Distribution
    charts.pieChart = new PieChart('severity-pie-chart', severityData, {
        donut: true
    });

    // Line Chart - Trends Over Time
    const trendsData = chartDataProcessor.getMonthlyTrends();
    charts.lineChart = new LineChart('trends-line-chart', trendsData, {
        height: 350
    });

    // Radial Chart - All Owners Distribution
    charts.radialChart = new AllOwnersRadialChart('all-owners-radial-chart', data, {
        size: 450
    });

    // Timeline Chart - Vulnerability Timeline
    timelineChart = new TimelineChart('timeline-chart', data);
    timelineChart.processTimelineData(data, null);
    timelineChart.render();

    // Render all
    Object.values(charts).forEach(chart => chart.render());
}

/**
 * Initialize time range filter
 */
function initializeTimeRangeFilter() {
    timeRangeFilter = new TimeRangeFilter((range) => {
        console.log('Time range changed:', range);
        handleTimeRangeChange(range);
    });

    // Populate years from data
    const years = getYearsFromData();
    timeRangeFilter.populateYears(years);
}

/**
 * Initialize sparklines for metric cards
 */
function initializeSparklines(data) {
    // Generate last 12 periods of data for each metric
    const sparklineData = generateSparklineData(data);

    // Create sparkline for each metric (full width ~200px based on card width)
    sparklines.total = new SparklineChart('sparkline-total', sparklineData.total, {
        width: 200,
        height: 40,
        showFill: true
    });
    sparklines.total.render();

    sparklines.active = new SparklineChart('sparkline-active', sparklineData.active, {
        width: 200,
        height: 40,
        showFill: true
    });
    sparklines.active.render();

    sparklines.fixed = new SparklineChart('sparkline-fixed', sparklineData.fixed, {
        width: 200,
        height: 40,
        showFill: true
    });
    sparklines.fixed.render();

    sparklines.critical = new SparklineChart('sparkline-critical', sparklineData.critical, {
        width: 200,
        height: 40,
        showFill: true
    });
    sparklines.critical.render();
}

/**
 * Generate sparkline data from vulnerability data
 */
function generateSparklineData(data) {
    // Get last 12 months
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(date);
    }

    // Count vulnerabilities by month for each metric
    const totals = [];
    const actives = [];
    const fixeds = [];
    const criticals = [];

    months.forEach(month => {
        const monthData = data.filter(item => {
            const date = new Date(item['First Detected']);
            return date.getMonth() === month.getMonth() &&
                date.getFullYear() === month.getFullYear();
        });

        totals.push(monthData.length);
        actives.push(monthData.filter(item => item['Vuln Status'] === 'Active').length);
        fixeds.push(monthData.filter(item => item['Vuln Status'] === 'Fixed').length);
        criticals.push(monthData.filter(item =>
            item.Severity === 'Critical' || item.Severity === 'High'
        ).length);
    });

    return {
        total: totals,
        active: actives,
        fixed: fixeds,
        critical: criticals
    };
}

/**
 * Update sparklines with new data
 */
function updateSparklines(data) {
    if (!data || data.length === 0) return;

    const sparklineData = generateSparklineData(data);

    if (sparklines.total) sparklines.total.update(sparklineData.total);
    if (sparklines.active) sparklines.active.update(sparklineData.active);
    if (sparklines.fixed) sparklines.fixed.update(sparklineData.fixed);
    if (sparklines.critical) sparklines.critical.update(sparklineData.critical);
}

/**
 * Handle time range change
 */
function handleTimeRangeChange(timeRange) {
    console.log('Time range changed:', timeRange);

    // Store original rawData if not already stored
    if (!window.originalRawData) {
        window.originalRawData = [...rawData];
    }

    // Filter data by time range
    let filteredByTime = window.originalRawData;

    if (!timeRange.isAll && timeRange.fromYear && timeRange.toYear) {
        filteredByTime = window.originalRawData.filter(item => {
            const date = new Date(item['First Detected']);
            if (isNaN(date.getTime())) return false;

            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            if (timeRange.fromYear && timeRange.fromMonth) {
                const fromDate = new Date(timeRange.fromYear, timeRange.fromMonth - 1);
                const itemDate = new Date(year, month - 1);
                if (itemDate < fromDate) return false;
            }

            if (timeRange.toYear && timeRange.toMonth) {
                const toDate = new Date(timeRange.toYear, timeRange.toMonth);
                const itemDate = new Date(year, month);
                if (itemDate > toDate) return false;
            }

            return true;
        });
    }

    console.log(`Filtered data: ${filteredByTime.length} items (from ${window.originalRawData.length} total)`);

    // Update timeline chart first
    if (timelineChart) {
        timelineChart.update(filteredByTime, timeRange);
    }

    // Update application status chart
    if (applicationStatusChart) {
        applicationStatusChart.update(filteredByTime);
    }

    // Update sparklines with new time-filtered data
    updateSparklines(filteredByTime);

    // Set the time-filtered data as the new base for other filters
    filterManager.setData(filteredByTime);

    // Apply existing filters on top of time-filtered data
    const finalData = filterManager.getData();

    console.log(`Final filtered data: ${finalData.length} items`);

    // Update all dashboard components
    metricsCalculator.setData(finalData);
    renderMetrics();

    dataTable.setData(finalData);

    updateCharts(finalData);
}

/**
 * Update charts with filtered data
 */
function updateCharts(data) {
    chartDataProcessor = new ChartDataProcessor(data);

    // Update bar chart
    if (charts.barChart) {
        charts.barChart.data = chartDataProcessor.getSeverityDistribution();
        charts.barChart.render();
    }

    // Update pie chart
    if (charts.pieChart) {
        charts.pieChart.data = chartDataProcessor.getSeverityDistribution();
        charts.pieChart.total = charts.pieChart.data.reduce((sum, d) => sum + d.value, 0);
        charts.pieChart.render();
    }

    // Update line chart
    if (charts.lineChart) {
        const trendsData = chartDataProcessor.getMonthlyTrends();
        charts.lineChart.labels = trendsData.labels;
        charts.lineChart.datasets = trendsData.datasets;
        charts.lineChart.render();
    }

    // Update radial chart
    if (charts.radialChart) {
        charts.radialChart.rawData = data;
        charts.radialChart.ownershipData = charts.radialChart.processOwnershipData();
        charts.radialChart.render();
    }
}

/**
 * Re-render all charts for theme changes
 */
function rerenderAllCharts() {
    // Canvas-based charts need requestAnimationFrame for immediate theme updates
    if (timelineChart) {
        requestAnimationFrame(() => {
            timelineChart.render();
        });
    }

    if (applicationStatusChart) {
        requestAnimationFrame(() => {
            applicationStatusChart.render();
        });
    }

    // Re-render pie chart with requestAnimationFrame
    if (charts.pieChart) {
        requestAnimationFrame(() => {
            charts.pieChart.render();
        });
    }

    // Re-render bar chart with requestAnimationFrame
    if (charts.barChart) {
        requestAnimationFrame(() => {
            charts.barChart.render();
        });
    }

    // Other non-canvas charts
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.render === 'function' &&
            chart !== charts.pieChart && chart !== charts.barChart) {
            chart.render();
        }
    });

    // Re-render sparklines
    Object.values(sparklines).forEach(sparkline => {
        if (sparkline && typeof sparkline.render === 'function') {
            requestAnimationFrame(() => {
                sparkline.render();
            });
        }
    });

    if (charts.radialChart) {
        charts.radialChart.render();
    }
}

/**
 * Render Customize Columns button and dropdown
 */
function renderCustomizeColumnsButton() {
    const controlsContainer = document.getElementById('table-controls');
    if (!controlsContainer || !dataTable) return;

    const allColumns = dataTable.getAllColumns();
    const visibleColumns = dataTable.getVisibleColumns();

    const buttonHTML = `
        <button class="btn btn-outline customize-columns-btn" id="customize-columns">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
            Customize Columns
            <svg class="chevron-down" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
            </svg>
        </button>
        <div class="columns-dropdown" id="columns-dropdown" hidden>
            <div class="dropdown-header">Toggle Columns</div>
            ${allColumns.map(col => `
                <label class="column-checkbox-label">
                    <input 
                        type="checkbox" 
                        class="column-checkbox" 
                        data-column="${col}"
                        ${visibleColumns.includes(col) ? 'checked' : ''}
                    >
                    <span>${dataTable.getColumnDisplayName(col)}</span>
                </label>
            `).join('')}
        </div>
    `;

    controlsContainer.innerHTML = buttonHTML;

    // Add event listeners
    const customizeBtn = document.getElementById('customize-columns');
    const dropdown = document.getElementById('columns-dropdown');

    customizeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.hidden = !dropdown.hidden;
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== customizeBtn) {
            dropdown.hidden = true;
        }
    });

    // Handle column toggle
    document.querySelectorAll('.column-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const columnName = e.target.dataset.column;
            dataTable.toggleColumn(columnName);
            // Re-render the button to update checkboxes
            setTimeout(() => renderCustomizeColumnsButton(), 100);
        });
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', init);
