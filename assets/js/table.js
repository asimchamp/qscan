/**
 * Data Table Module
 * Handles table rendering, pagination, and expandable rows
 * Following shadcn/ui design patterns with customizable columns
 */

export class DataTable {
  constructor(containerId, rowsPerPage = 10) {
    this.container = document.getElementById(containerId);
    this.rowsPerPage = rowsPerPage;
    this.currentPage = 1;
    this.data = [];
    this.totalPages = 0;
    this.expandedRows = new Set();

    // Default visible columns
    this.visibleColumns = ['Severity', 'Title', 'IP', 'Owner', 'Vuln Status', 'First Detected'];
    this.allColumns = [];
  }

  /**
   * Set data and render
   */
  setData(data) {
    this.data = data;
    this.totalPages = Math.ceil(data.length / this.rowsPerPage);
    this.currentPage = 1;
    this.expandedRows.clear();

    // Extract all unique column names from data
    if (data.length > 0) {
      this.allColumns = Object.keys(data[0]);
    }

    this.render();
  }

  /**
   * Render current page
   */
  render() {
    if (!this.container) return;

    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = Math.min(startIndex + this.rowsPerPage, this.data.length);
    const pageData = this.data.slice(startIndex, endIndex);

    let html = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th class="th-expand"></th>
`;

    // Dynamically render column headers based on visible columns
    this.visibleColumns.forEach(col => {
      html += `              <th>${this.getColumnDisplayName(col)}</th>\n`;
    });

    html += `
            </tr>
          </thead>
          <tbody>
    `;

    if (pageData.length === 0) {
      html += `
        <tr>
          <td colspan="${this.visibleColumns.length + 1}" class="empty-state">
            No vulnerabilities found
          </td>
        </tr>
      `;
    } else {
      pageData.forEach((row, idx) => {
        const rowIndex = startIndex + idx;
        const isExpanded = this.expandedRows.has(rowIndex);

        html += `
          <tr class="table-row ${isExpanded ? 'expanded' : ''}" data-row-index="${rowIndex}">
            <td class="td-expand">
              <button class="expand-btn" data-row-index="${rowIndex}" title="${isExpanded ? 'Collapse' : 'Expand'} row">
                <svg class="chevron-icon ${isExpanded ? 'expanded' : ''}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </td>
`;

        // Dynamically render cells based on visible columns
        this.visibleColumns.forEach(col => {
          const value = row[col];
          html += `            <td>${this.formatCellValue(col, value, row)}</td>\n`;
        });

        html += `          </tr>\n`;

        // Add expanded row content if this row is expanded
        if (isExpanded) {
          html += this.renderExpandedRow(row);
        }
      });
    }

    html += `
          </tbody>
        </table>
      </div>
      <div class="table-footer">
        <div class="table-footer-info">
          <span class="row-count">${this.data.length} total rows</span>
        </div>
        <div class="table-footer-pagination">
          <div class="pagination-info">
            Page ${this.currentPage} of ${this.totalPages || 1}
          </div>
          <div class="pagination-controls">
            <button class="btn-pagination" id="first-page" ${this.currentPage === 1 ? 'disabled' : ''} title="First page">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
              </svg>
            </button>
            <button class="btn-pagination" id="prev-page" ${this.currentPage === 1 ? 'disabled' : ''} title="Previous page">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button class="btn-pagination" id="next-page" ${this.currentPage >= this.totalPages ? 'disabled' : ''} title="Next page">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 5l7 7-7 7"/>
              </svg>
            </button>
            <button class="btn-pagination" id="last-page" ${this.currentPage >= this.totalPages ? 'disabled' : ''} title="Last page">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  /**
   * Render expanded row content with categorized CSV fields
   */
  renderExpandedRow(row) {
    // Define field categories
    const categories = {
      'Details': ['Owner', 'Application', 'Title', 'Tracking Method', 'Type', 'statusNormalized', 'month', 'year'],
      'Machine': ['IP', 'DNS', 'NetBIOS', 'IP Status', 'OS', 'UID', 'QID', 'Port', 'Protocol', 'FQDN', 'IP Interfaces', 'QG Host ID', 'OG Host ID'],
      'Vulnerability': ['CVE ID', 'SSL', 'Vendor Reference', 'Bugtraq ID', 'Impact', 'Results', 'First Detected', 'Last Detected', 'Times Detected', 'Date Last Fixed', 'severityText', 'Vuln Status', 'Ticket State', 'Solution']
    };

    // Organize fields by category
    const categorizedFields = {};
    Object.keys(categories).forEach(category => {
      categorizedFields[category] = [];
    });

    // Categorize all fields
    Object.entries(row).forEach(([key, value]) => {
      let categorized = false;
      for (const [category, fields] of Object.entries(categories)) {
        if (fields.includes(key)) {
          categorizedFields[category].push([key, value]);
          categorized = true;
          break;
        }
      }
      // If field doesn't fit any category, add to Details
      if (!categorized && !this.visibleColumns.includes(key)) {
        categorizedFields['Details'].push([key, value]);
      }
    });

    // Render sections
    let sectionsHTML = '';
    Object.entries(categorizedFields).forEach(([category, fields]) => {
      if (fields.length > 0) {
        sectionsHTML += `
                    <div class="field-section">
                        <div class="section-header">${category}</div>
                        <div class="section-fields">
                            ${fields.map(([key, value]) => `
                                <div class="field-row">
                                    <span class="field-label">${this.getColumnDisplayName(key)}:</span>
                                    <span class="field-value">${this.escapeHtml(value || '-')}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
      }
    });

    return `
          <tr class="expanded-row-content">
            <td colspan="${this.visibleColumns.length + 1}">
              <div class="expanded-details">
                ${sectionsHTML}
              </div>
            </td>
          </tr>
        `;
  }

  /**
   * Get display name for column
   */
  getColumnDisplayName(col) {
    const displayNames = {
      'IP': 'IP Address',
      'Vuln Status': 'Status',
      'First Detected': 'Detected On'
    };
    return displayNames[col] || col;
  }

  /**
   * Format cell value based on column type
   */
  formatCellValue(col, value, row) {
    if (col === 'Severity') {
      return this.getSeverityBadge(value);
    } else if (col === 'Vuln Status') {
      return this.getStatusBadge(value);
    } else if (col === 'Title') {
      return `<div class="table-cell-title" title="${this.escapeHtml(value || '')}">${this.escapeHtml(this.truncate(value || '', 60))}</div>`;
    } else if (col === 'IP') {
      return `<span class="table-cell-mono">${this.escapeHtml(value || '')}</span>`;
    } else if (col === 'First Detected') {
      return `<span class="table-cell-date">${this.formatDate(value)}</span>`;
    }
    return this.escapeHtml(value || '-');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Expand/collapse buttons
    document.querySelectorAll('.expand-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rowIndex = parseInt(btn.dataset.rowIndex);
        this.toggleRowExpansion(rowIndex);
      });
    });

    // Pagination
    document.getElementById('first-page')?.addEventListener('click', () => this.goToPage(1));
    document.getElementById('prev-page')?.addEventListener('click', () => this.prevPage());
    document.getElementById('next-page')?.addEventListener('click', () => this.nextPage());
    document.getElementById('last-page')?.addEventListener('click', () => this.goToPage(this.totalPages));
  }

  /**
   * Toggle row expansion
   */
  toggleRowExpansion(rowIndex) {
    if (this.expandedRows.has(rowIndex)) {
      this.expandedRows.delete(rowIndex);
    } else {
      this.expandedRows.add(rowIndex);
    }
    this.render();
  }

  /**
   * Toggle column visibility
   */
  toggleColumn(columnName) {
    const index = this.visibleColumns.indexOf(columnName);
    if (index > -1) {
      this.visibleColumns.splice(index, 1);
    } else {
      this.visibleColumns.push(columnName);
    }
    this.render();
  }

  /**
   * Get all available columns
   */
  getAllColumns() {
    return this.allColumns;
  }

  /**
   * Get visible columns
   */
  getVisibleColumns() {
    return this.visibleColumns;
  }

  /**
   * Navigation methods
   */
  goToPage(page) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.expandedRows.clear(); // Clear expanded rows when changing pages
      this.render();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.expandedRows.clear();
      this.render();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.expandedRows.clear();
      this.render();
    }
  }

  /**
   * Get severity badge HTML (monochrome for consistency)
   */
  getSeverityBadge(severity) {
    const level = parseInt(severity);
    let text = 'Low';

    if (level === 5) text = 'Critical';
    else if (level === 4) text = 'High';
    else if (level === 3) text = 'Medium';
    else if (level === 2 || level === 1) text = 'Low';

    return `<span class="badge badge-severity">${text}</span>`;
  }

  /**
   * Get status badge HTML with dot indicator
   */
  getStatusBadge(status) {
    if (!status) return '<span class="badge"><span class="badge-dot"></span>Unknown</span>';

    const lower = status.toLowerCase().trim();
    let dotClass = 'badge-dot-default';
    let text = status;

    if (lower === 'active') {
      dotClass = 'badge-dot-in-progress';
      text = 'In Progress';
    } else if (lower === 'fixed') {
      dotClass = 'badge-dot-done';
      text = 'Done';
    } else if (lower.includes('progress')) {
      dotClass = 'badge-dot-in-progress';
      text = 'In Progress';
    } else if (lower.includes('verif')) {
      dotClass = 'badge-dot-done';
      text = 'Verified';
    }

    return `<span class="badge badge-status"><span class="badge-dot ${dotClass}"></span>${text}</span>`;
  }

  /**
   * Format date
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Truncate text
   */
  truncate(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
