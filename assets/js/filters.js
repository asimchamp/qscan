/**
 * Filter Management Module
 * Handles all filtering logic for vulnerability data
 */

export class FilterManager {
    constructor(data) {
        this.originalData = data;
        this.filteredData = data;
        this.filters = {
            owner: null,
            application: null,
            status: null
        };
    }

    /**
     * Set new base data (e.g., after time range filtering)
     */
    setData(data) {
        this.originalData = data;
        this.applyFilters();
    }

    /**
     * Get unique values for a specific field
     */
    getUniqueValues(field) {
        const values = new Set();
        this.originalData.forEach(row => {
            const value = row[field];
            if (value && value.trim()) {
                values.add(value.trim());
            }
        });
        return Array.from(values).sort();
    }

    /**
     * Set a filter value
     */
    setFilter(filterName, value) {
        this.filters[filterName] = value;
        this.applyFilters();
    }

    /**
     * Reset all filters
     */
    reset() {
        this.filters = {
            owner: null,
            application: null,
            status: null
        };
        this.applyFilters();
    }

    /**
     * Apply all active filters
     */
    applyFilters() {
        this.filteredData = this.originalData.filter(row => {
            // Owner filter
            if (this.filters.owner && row['LT Owner'] !== this.filters.owner) {
                return false;
            }

            // Application filter
            if (this.filters.application && row.Application !== this.filters.application) {
                return false;
            }

            // Status filter
            if (this.filters.status && row['Vuln Status'] !== this.filters.status) {
                return false;
            }

            return true;
        });

        return this.filteredData;
    }

    /**
     * Get current filtered data
     */
    getData() {
        return this.filteredData;
    }

    /**
     * Get current filter state
     */
    getFilters() {
        return { ...this.filters };
    }
}

/**
 * Helper functions
 */
function parseYearFromDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.getFullYear();
}

function parseMonthFromDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.getMonth() + 1;
}
