/**
 * CSV utility functions for converting data to CSV format
 */

/**
 * Escape a CSV field value
 */
function escapeCsvField(value: any): string {
    if (value === null || value === undefined) {
        return '';
    }

    const stringValue = String(value);

    // If the value contains comma, quote, or newline, wrap it in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

/**
 * Convert an array of objects to CSV string
 */
export function convertToCsv(data: any[]): string {
    if (!data || data.length === 0) {
        return '';
    }

    // Get all unique keys from all objects
    const keys = new Set<string>();
    data.forEach((item) => {
        if (item && typeof item === 'object') {
            Object.keys(item).forEach((key) => keys.add(key));
        }
    });

    const headers = Array.from(keys);

    // Build CSV rows
    const rows: string[] = [];

    // Header row
    rows.push(headers.map(escapeCsvField).join(','));

    // Data rows
    data.forEach((item) => {
        const row = headers.map((key) => {
            const value = item[key];
            // Handle nested objects and arrays
            if (value && typeof value === 'object') {
                if (Array.isArray(value)) {
                    return escapeCsvField(JSON.stringify(value));
                }
                return escapeCsvField(JSON.stringify(value));
            }
            return escapeCsvField(value);
        });
        rows.push(row.join(','));
    });

    return rows.join('\n');
}

/**
 * Convert nested object/array structure to flat CSV format
 * This handles complex nested data structures by flattening them
 */
export function convertNestedToCsv(data: any): string {
    if (!data || typeof data !== 'object') {
        return '';
    }

    const sections: string[] = [];

    // Process each top-level section
    Object.keys(data).forEach((sectionName) => {
        const sectionData = data[sectionName];

        if (Array.isArray(sectionData)) {
            if (sectionData.length > 0) {
                sections.push(`\n## ${sectionName.toUpperCase()}\n`);
                sections.push(convertToCsv(sectionData));
            }
        } else if (sectionData && typeof sectionData === 'object') {
            // Convert single object to array for CSV
            sections.push(`\n## ${sectionName.toUpperCase()}\n`);
            sections.push(convertToCsv([sectionData]));
        }
    });

    return sections.join('\n');
}

