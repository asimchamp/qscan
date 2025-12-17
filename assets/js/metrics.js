/**
 * Metrics Calculator Module
 * Computes dashboard metrics and deltas
 */

export class MetricsCalculator {
    constructor(data) {
        this.data = data;
    }

    /**
     * Update data source
     */
    setData(data) {
        this.data = data;
    }

    /**
     * Get total vulnerabilities count
     */
    getTotalVulnerabilities() {
        return this.data.length;
    }

    /**
     * Get active vulnerabilities count
     */
    getActiveCount() {
        return this.data.filter(row =>
            row['Vuln Status'] && row['Vuln Status'].toLowerCase() === 'active'
        ).length;
    }

    /**
     * Get fixed vulnerabilities count
     */
    getFixedCount() {
        return this.data.filter(row =>
            row['Vuln Status'] && row['Vuln Status'].toLowerCase() === 'fixed'
        ).length;
    }

    /**
     * Get critical vulnerabilities count
     */
    getCriticalCount() {
        return this.data.filter(row =>
            row.Severity === '5'
        ).length;
    }

    /**
     * Calculate month-over-month delta
     */
    getDelta(metric, period = 'month') {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Get current month data
        const currentData = this.data.filter(row => {
            const date = parseDate(row['First Detected']);
            if (!date) return false;
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        // Get previous month data
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const prevData = this.data.filter(row => {
            const date = parseDate(row['First Detected']);
            if (!date) return false;
            return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
        });

        const currentValue = this.getMetricValue(metric, currentData);
        const prevValue = this.getMetricValue(metric, prevData);

        if (prevValue === 0) {
            return currentValue > 0 ? 100 : 0;
        }

        const delta = ((currentValue - prevValue) / prevValue) * 100;
        return Math.round(delta);
    }

    /**
     * Get metric value for specific dataset
     */
    getMetricValue(metric, data) {
        const calc = new MetricsCalculator(data);

        switch (metric) {
            case 'total':
                return calc.getTotalVulnerabilities();
            case 'active':
                return calc.getActiveCount();
            case 'fixed':
                return calc.getFixedCount();
            case 'critical':
                return calc.getCriticalCount();
            default:
                return 0;
        }
    }

    /**
     * Get all metrics at once
     */
    getAllMetrics() {
        return {
            total: {
                value: this.getTotalVulnerabilities(),
                delta: this.getDelta('total')
            },
            active: {
                value: this.getActiveCount(),
                delta: this.getDelta('active')
            },
            fixed: {
                value: this.getFixedCount(),
                delta: this.getDelta('fixed')
            },
            critical: {
                value: this.getCriticalCount(),
                delta: this.getDelta('critical')
            }
        };
    }
}

/**
 * Helper function to parse dates
 */
function parseDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format delta with sign
 */
export function formatDelta(delta) {
    const sign = delta > 0 ? '↗' : delta < 0 ? '↘' : '';
    const value = Math.abs(delta);
    return `${sign} ${value}%`;
}
