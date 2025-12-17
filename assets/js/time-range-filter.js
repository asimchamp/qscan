/**
 * Time Range Filter Component
 * Handles year/month range selection for dashboard filtering
 */

export class TimeRangeFilter {
    constructor(onRangeChange) {
        this.onRangeChange = onRangeChange;
        this.fromYear = null;
        this.fromMonth = null;
        this.toYear = null;
        this.toMonth = null;
        this.isOpen = false;

        this.init();
    }

    init() {
        this.bindElements();
        this.populateMonths();
        this.setupEventListeners();
    }

    bindElements() {
        this.trigger = document.getElementById('time-range-trigger');
        this.dropdown = document.getElementById('time-range-dropdown');
        this.valueDisplay = document.getElementById('time-range-value');
        this.fromYearSelect = document.getElementById('from-year');
        this.fromMonthSelect = document.getElementById('from-month');
        this.toYearSelect = document.getElementById('to-year');
        this.toMonthSelect = document.getElementById('to-month');
        this.quickButtons = document.querySelectorAll('.btn-time-quick');
    }

    /**
     * Populate year dropdowns with available years
     */
    populateYears(years) {
        if (!years || years.length === 0) return;

        const sortedYears = [...years].sort((a, b) => b - a); // Descending

        [this.fromYearSelect, this.toYearSelect].forEach(select => {
            select.innerHTML = '<option value="">Year</option>';
            sortedYears.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                select.appendChild(option);
            });
        });

        // Set default range to last 12 months
        this.setDefaultRange(sortedYears);
    }

    /**
     * Populate month dropdowns
     */
    populateMonths() {
        const months = [
            { value: '1', label: 'January' },
            { value: '2', label: 'February' },
            { value: '3', label: 'March' },
            { value: '4', label: 'April' },
            { value: '5', label: 'May' },
            { value: '6', label: 'June' },
            { value: '7', label: 'July' },
            { value: '8', label: 'August' },
            { value: '9', label: 'September' },
            { value: '10', label: 'October' },
            { value: '11', label: 'November' },
            { value: '12', label: 'December' }
        ];

        [this.fromMonthSelect, this.toMonthSelect].forEach(select => {
            select.innerHTML = '<option value="">Month</option>';
            months.forEach(month => {
                const option = document.createElement('option');
                option.value = month.value;
                option.textContent = month.label;
                select.appendChild(option);
            });
        });
    }

    /**
     * Set default time range (last 12 months)
     */
    setDefaultRange(years) {
        if (years.length === 0) return;

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1; // 1-12

        // Calculate 12 months ago
        let fromYear = currentYear;
        let fromMonth = currentMonth - 11;

        if (fromMonth <= 0) {
            fromMonth += 12;
            fromYear--;
        }

        // Set values
        this.fromYearSelect.value = fromYear;
        this.fromMonthSelect.value = fromMonth;
        this.toYearSelect.value = currentYear;
        this.toMonthSelect.value = currentMonth;

        this.updateState();
        this.updateDisplayText();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Dropdown toggle
        if (this.trigger) {
            this.trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.dropdown?.contains(e.target) && e.target !== this.trigger) {
                this.closeDropdown();
            }
        });

        // Date selectors
        [this.fromYearSelect, this.fromMonthSelect, this.toYearSelect, this.toMonthSelect].forEach(select => {
            select?.addEventListener('change', () => this.handleDateChange());
        });

        // Quick action buttons
        this.quickButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const months = btn.getAttribute('data-months');
                this.setQuickRange(months);

                // Update active state
                this.quickButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Close dropdown after quick selection
                setTimeout(() => this.closeDropdown(), 200);
            });
        });
    }

    /**
     * Toggle dropdown open/close
     */
    toggleDropdown() {
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            this.openDropdown();
        } else {
            this.closeDropdown();
        }
    }

    /**
     * Open dropdown
     */
    openDropdown() {
        this.isOpen = true;
        this.trigger?.classList.add('active');
        this.dropdown?.classList.add('active');
    }

    /**
     * Close dropdown
     */
    closeDropdown() {
        this.isOpen = false;
        this.trigger?.classList.remove('active');
        this.dropdown?.classList.remove('active');
    }

    /**
     * Update display text
     */
    updateDisplayText() {
        if (!this.valueDisplay) return;

        if (!this.fromYear || !this.toYear) {
            this.valueDisplay.textContent = 'All time';
            return;
        }

        const fromMonth = this.getMonthName(this.fromMonth);
        const toMonth = this.getMonthName(this.toMonth);

        const text = `${fromMonth} ${this.fromYear} - ${toMonth} ${this.toYear}`;
        this.valueDisplay.textContent = text;
    }

    /**
     * Get month name
     */
    getMonthName(month) {
        if (!month) return '';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[month - 1] || '';
    }

    /**
     * Handle date selection change
     */
    handleDateChange() {
        this.updateState();
        this.updateDisplayText();

        // Clear active quick button
        this.quickButtons.forEach(b => b.classList.remove('active'));

        // Validate range
        if (!this.isValidRange()) {
            console.warn('Invalid date range: "To" date must be after "From" date');
            return;
        }

        // Trigger callback
        if (this.onRangeChange) {
            this.onRangeChange(this.getRange());
        }
    }

    /**
     * Update internal state
     */
    updateState() {
        this.fromYear = this.fromYearSelect.value ? parseInt(this.fromYearSelect.value) : null;
        this.fromMonth = this.fromMonthSelect.value ? parseInt(this.fromMonthSelect.value) : null;
        this.toYear = this.toYearSelect.value ? parseInt(this.toYearSelect.value) : null;
        this.toMonth = this.toMonthSelect.value ? parseInt(this.toMonthSelect.value) : null;
    }

    /**
     * Set quick date range
     */
    setQuickRange(months) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        if (months === 'all') {
            // Set to all available data
            this.fromYearSelect.value = '';
            this.fromMonthSelect.value = '';
            this.toYearSelect.value = '';
            this.toMonthSelect.value = '';
        } else {
            const monthsAgo = parseInt(months);
            let fromYear = currentYear;
            let fromMonth = currentMonth - monthsAgo + 1;

            while (fromMonth <= 0) {
                fromMonth += 12;
                fromYear--;
            }

            this.fromYearSelect.value = fromYear;
            this.fromMonthSelect.value = fromMonth;
            this.toYearSelect.value = currentYear;
            this.toMonthSelect.value = currentMonth;
        }

        this.handleDateChange();
    }

    /**
     * Validate date range
     */
    isValidRange() {
        if (!this.fromYear || !this.fromMonth || !this.toYear || !this.toMonth) {
            return true; // Allow empty (means all data)
        }

        const fromDate = new Date(this.fromYear, this.fromMonth - 1);
        const toDate = new Date(this.toYear, this.toMonth - 1);

        return toDate >= fromDate;
    }

    /**
     * Get current date range
     */
    getRange() {
        return {
            fromYear: this.fromYear,
            fromMonth: this.fromMonth,
            toYear: this.toYear,
            toMonth: this.toMonth,
            isAll: !this.fromYear || !this.toYear
        };
    }

    /**
     * Clear/reset range
     */
    clear() {
        this.fromYearSelect.value = '';
        this.fromMonthSelect.value = '';
        this.toYearSelect.value = '';
        this.toMonthSelect.value = '';
        this.quickButtons.forEach(b => b.classList.remove('active'));
        this.handleDateChange();
    }
}
