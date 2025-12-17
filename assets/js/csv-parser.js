/**
 * CSV Parser Module
 * RFC 4180 compliant parser for vulnerability data
 */

export async function loadCSV(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load CSV: ${response.statusText}`);
        }
        const text = await response.text();
        return parseCSV(text);
    } catch (error) {
        console.error('Error loading CSV:', error);
        throw error;
    }
}

export function parseCSV(text) {
    const lines = [];
    let currentLine = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                currentField += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote mode
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Field separator
            currentLine.push(currentField.trim());
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            // Line separator
            if (currentField || currentLine.length > 0) {
                currentLine.push(currentField.trim());
                if (currentLine.some(field => field.length > 0)) {
                    lines.push(currentLine);
                }
                currentLine = [];
                currentField = '';
            }
            // Skip \r in \r\n
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
        } else {
            currentField += char;
        }
    }

    // Handle last field/line
    if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim());
        if (currentLine.some(field => field.length > 0)) {
            lines.push(currentLine);
        }
    }

    if (lines.length === 0) {
        return [];
    }

    // First line is headers
    const headers = lines[0];
    const data = [];

    // Convert remaining lines to objects
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.length === 0) continue;

        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = line[index] || '';
        });
        data.push(obj);
    }

    return data;
}

/**
 * Normalize vulnerability data
 */
export function normalizeData(data) {
    return data.map(row => ({
        ...row,
        // Normalize severity (1-5 scale to text)
        severityText: getSeverityText(row.Severity),
        // Normalize status
        statusNormalized: normalizeStatus(row['Vuln Status']),
        // Parse dates
        firstDetected: parseDate(row['First Detected']),
        lastDetected: parseDate(row['Last Detected']),
        // Extract year and month
        year: parseDate(row['First Detected'])?.getFullYear(),
        month: parseDate(row['First Detected'])?.getMonth() + 1,
    }));
}

function getSeverityText(severity) {
    const level = parseInt(severity);
    if (level === 5) return 'Critical';
    if (level === 4) return 'High';
    if (level === 3 || level === 2) return 'Medium';
    if (level === 1) return 'Low';
    return 'Unknown';
}

function normalizeStatus(status) {
    if (!status) return 'Unknown';
    const lower = status.toLowerCase().trim();

    if (lower === 'active') return 'Open';
    if (lower === 'fixed') return 'Fixed';
    if (lower.includes('progress')) return 'In Progress';
    if (lower.includes('verif')) return 'Verified';

    return status;
}

function parseDate(dateStr) {
    if (!dateStr) return null;

    // Try multiple date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date;
    }

    return null;
}

/**
 * Get unique values for a field
 */
export function getUniqueValues(data, field) {
    const values = new Set();
    data.forEach(row => {
        if (row[field]) {
            values.add(row[field]);
        }
    });
    return Array.from(values).sort();
}
