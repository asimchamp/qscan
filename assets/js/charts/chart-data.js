/**
 * Chart Data Processor
 * Transforms CSV data into chart-ready formats
 */

export class ChartDataProcessor {
    constructor(csvData) {
        this.data = csvData;
    }

    /**
     * Get severity distribution for bar/pie charts
     */
    getSeverityDistribution() {
        const groups = {
            Critical: 0,
            High: 0,
            Medium: 0,
            Low: 0
        };

        this.data.forEach(row => {
            const severity = parseInt(row.Severity);
            if (severity === 5) groups.Critical++;
            else if (severity === 4) groups.High++;
            else if (severity === 3 || severity === 2) groups.Medium++;
            else if (severity === 1) groups.Low++;
        });

        return [
            { label: 'Critical', value: groups.Critical, color: 'destructive' },
            { label: 'High', value: groups.High, color: 'warning' },
            { label: 'Medium', value: groups.Medium, color: 'chart-5' },
            { label: 'Low', value: groups.Low, color: 'info' }
        ];
    }

    /**
     * Get monthly vulnerability trends
     */
    getMonthlyTrends(months = 12) {
        const monthlyData = {};

        this.data.forEach(row => {
            const date = new Date(row['First Detected']);
            if (isNaN(date)) return;

            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[key]) {
                monthlyData[key] = {
                    total: 0,
                    active: 0,
                    fixed: 0,
                    timestamp: date.getTime()
                };
            }

            monthlyData[key].total++;
            const status = (row['Vuln Status'] || '').toLowerCase();
            if (status === 'active') monthlyData[key].active++;
            if (status === 'fixed') monthlyData[key].fixed++;
        });

        // Sort by date and get last N months
        const sorted = Object.entries(monthlyData)
            .sort((a, b) => a[1].timestamp - b[1].timestamp)
            .slice(-months);

        const labels = sorted.map(([key]) => key);

        return {
            labels,
            datasets: [
                {
                    label: 'Total',
                    data: sorted.map(([, val]) => val.total),
                    color: 'primary'
                },
                {
                    label: 'Active',
                    data: sorted.map(([, val]) => val.active),
                    color: 'destructive'
                },
                {
                    label: 'Fixed',
                    data: sorted.map(([, val]) => val.fixed),
                    color: 'success'
                }
            ]
        };
    }

    /**
     * Get top applications by vulnerability count
     */
    getTopApplications(limit = 10) {
        const apps = {};

        this.data.forEach(row => {
            const app = row.Application;
            if (app && app.trim()) {
                apps[app] = (apps[app] || 0) + 1;
            }
        });

        return Object.entries(apps)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([label, value]) => ({ label, value }));
    }

    /**
     * Get status distribution over time (for stacked area chart)
     */
    getStatusTrends(months = 12) {
        const monthlyData = {};

        this.data.forEach(row => {
            const date = new Date(row['First Detected']);
            if (isNaN(date)) return;

            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[key]) {
                monthlyData[key] = {
                    active: 0,
                    fixed: 0,
                    verified: 0,
                    inProgress: 0,
                    timestamp: date.getTime()
                };
            }

            const status = (row['Vuln Status'] || '').toLowerCase();
            if (status === 'active') monthlyData[key].active++;
            else if (status === 'fixed') monthlyData[key].fixed++;
            else if (status.includes('verif')) monthlyData[key].verified++;
            else if (status.includes('progress')) monthlyData[key].inProgress++;
        });

        const sorted = Object.entries(monthlyData)
            .sort((a, b) => a[1].timestamp - b[1].timestamp)
            .slice(-months);

        const labels = sorted.map(([key]) => key);

        return {
            labels,
            datasets: [
                {
                    label: 'Active',
                    data: sorted.map(([, val]) => val.active),
                    color: 'destructive'
                },
                {
                    label: 'In Progress',
                    data: sorted.map(([, val]) => val.inProgress),
                    color: 'warning'
                },
                {
                    label: 'Fixed',
                    data: sorted.map(([, val]) => val.fixed),
                    color: 'success'
                },
                {
                    label: 'Verified',
                    data: sorted.map(([, val]) => val.verified),
                    color: 'primary'
                }
            ]
        };
    }

    /**
     * Get sparkline data (last N data points)
     */
    getSparklineData(metric, points = 7) {
        const dailyData = {};

        this.data.forEach(row => {
            const date = new Date(row['First Detected']);
            if (isNaN(date)) return;

            const key = date.toISOString().split('T')[0]; // YYYY-MM-DD

            if (!dailyData[key]) {
                dailyData[key] = {
                    total: 0,
                    active: 0,
                    fixed: 0,
                    critical: 0,
                    timestamp: date.getTime()
                };
            }

            dailyData[key].total++;
            if (row['Vuln Status'] === 'Active') dailyData[key].active++;
            if (row['Vuln Status'] === 'Fixed') dailyData[key].fixed++;
            if (row.Severity === '5') dailyData[key].critical++;
        });

        const sorted = Object.entries(dailyData)
            .sort((a, b) => a[1].timestamp - b[1].timestamp)
            .slice(-points);

        return sorted.map(([, val]) => val[metric] || 0);
    }
}
