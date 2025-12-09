import * as ExcelJS from 'exceljs';

/**
 * Convert data array to Excel buffer
 */
export async function convertToExcel(data: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    if (!data || data.length === 0) {
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer as ArrayBuffer);
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Add headers
    worksheet.addRow(headers);

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data rows
    data.forEach((item) => {
        const row = headers.map((header) => item[header] || '');
        worksheet.addRow(row);
    });

    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
        if (!column) return;
        let maxLength = 0;
        const col = worksheet.getColumn(index + 1);
        if (col) {
            col.eachCell({ includeEmpty: true }, (cell) => {
                if (cell && cell.value) {
                    const columnLength = cell.value.toString().length;
                    if (columnLength > maxLength) {
                        maxLength = columnLength;
                    }
                }
            });
            col.width = maxLength < 10 ? 10 : maxLength + 2;
        }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
}

