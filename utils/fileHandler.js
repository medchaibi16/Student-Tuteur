import { extractTextWithOCRSpace } from './ocrSpace.js';
import pdfParse from 'pdf-parse';

export async function extractText(fileBuffer, fileType) {
    if (fileType === "pdf") {
        try {
            // Extract text from PDF directly
            const data = await pdfParse(fileBuffer);
            return data.text;
        } catch (error) {
            console.error("❌ PDF Parsing Error:", error);
            throw new Error("PDF Parsing Error: " + error.message);
        }
    } else {
        // Use OCR.space for images
        return await extractTextWithOCRSpace(fileBuffer, fileType);
    }
}