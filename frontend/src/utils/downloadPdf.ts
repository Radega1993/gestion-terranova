import { pdf } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

/**
 * Genera un PDF en memoria y lo descarga, evitando PDFViewer (que bloquea el navegador con muchos datos).
 */
export async function downloadPdfDocument(
    documentElement: ReactElement,
    filename: string,
): Promise<void> {
    const blob = await pdf(documentElement).toBlob();
    const url = URL.createObjectURL(blob);
    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } finally {
        URL.revokeObjectURL(url);
    }
}
