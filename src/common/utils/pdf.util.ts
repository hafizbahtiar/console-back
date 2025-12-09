import PDFDocument from 'pdfkit';

/**
 * Convert data array to PDF buffer
 */
export async function convertToPdf(data: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            resolve(Buffer.concat(buffers));
        });
        doc.on('error', reject);

        // Add title
        doc.fontSize(20).text('Transaction Export', { align: 'center' });
        doc.moveDown();

        if (!data || data.length === 0) {
            doc.fontSize(12).text('No transactions to export.', { align: 'center' });
            doc.end();
            return;
        }

        // Get headers
        const headers = Object.keys(data[0]);

        // Table settings
        const startX = 50;
        let startY = 120;
        const rowHeight = 20;
        const colWidth = (doc.page.width - 100) / headers.length;

        // Draw header row
        doc.fontSize(10).font('Helvetica-Bold');
        headers.forEach((header, index) => {
            doc.text(header, startX + index * colWidth, startY, {
                width: colWidth,
                align: 'left',
            });
        });

        // Draw line under header
        doc.moveTo(startX, startY + rowHeight).lineTo(doc.page.width - 50, startY + rowHeight).stroke();
        startY += rowHeight;

        // Draw data rows
        doc.font('Helvetica').fontSize(9);
        data.forEach((item, rowIndex) => {
            // Check if we need a new page
            if (startY + rowHeight > doc.page.height - 50) {
                doc.addPage();
                startY = 50;
            }

            headers.forEach((header, colIndex) => {
                const value = item[header] || '';
                doc.text(String(value), startX + colIndex * colWidth, startY, {
                    width: colWidth,
                    align: 'left',
                });
            });

            startY += rowHeight;
        });

        doc.end();
    });
}

