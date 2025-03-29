import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const OCR_API_KEY = process.env.OCR_API_KEY;

export async function extractTextWithOCRSpace(fileBuffer, fileType) {
    const ocrUrl = "https://api.ocr.space/parse/image";

    // Map file extensions to MIME types
    const mimeTypes = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        pdf: "application/pdf",
    };

    // Get the MIME type for the file
    const mimeType = mimeTypes[fileType];
    if (!mimeType) {
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Format the base64 string
    const base64Image = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    console.log("Base64 Image:", base64Image.slice(0, 100) + "..."); // Log the first 100 characters of the base64 string

    try {
        const response = await fetch(ocrUrl, {
            method: "POST",
            headers: {
                "apikey": OCR_API_KEY,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                base64image: base64Image,
                language: "eng",
                isOverlayRequired: false,
                filetype: fileType.toUpperCase()
            })
        });

        const data = await response.json();
        console.log("OCR API Response:", data); // Log the full response

        if (data.IsErroredOnProcessing) {
            throw new Error(data.ErrorMessage || "OCR API processing error.");
        }

        if (data.ParsedResults && data.ParsedResults.length > 0) {
            return data.ParsedResults[0].ParsedText;
        } else {
            throw new Error("OCR API returned no text.");
        }
    } catch (error) {
        console.error("❌ OCR API Error:", error);
        throw new Error("OCR API Error: " + error.message);
    }
}