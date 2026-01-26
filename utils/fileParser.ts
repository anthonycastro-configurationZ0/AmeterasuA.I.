import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

export const parsePdf = async (file: File): Promise<string> => {
    // Moved this line from the top level to inside the function.
    // This prevents a crash on startup by ensuring the pdfjs-dist library is fully initialized
    // before we try to configure it.
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // The 'item' can be a TextItem or a TextMarkedContent. We are interested in TextItem which has 'str'.
            fullText += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
        } catch(e) {
            console.error(`Error processing page ${i}:`, e);
            fullText += `[Error processing page ${i}]\n`;
        }
    }
    return fullText;
};

export const parseDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
};