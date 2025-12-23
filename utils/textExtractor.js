import axios from 'axios';
import FormData from 'form-data'; 

export async function extractText(file) {
    if (!file) throw new Error("No file provided");

    const formData = new FormData();
    formData.append("apikey", "your_key_here");  
    formData.append("file", file.data, file.name); 
    formData.append("language", "eng");
    formData.append("isOverlayRequired", false);
    formData.append("filetype", file.name.split('.').pop()); 

    try {
        const response = await axios.post("https://api.ocr.space/parse/image", formData, {
            headers: formData.getHeaders(), 
        });

        console.log("OCR API Full Response:", response.data); 

        if (!response.data.ParsedResults || response.data.ParsedResults.length === 0) {
            throw new Error("OCR API returned an empty response.");
        }

        return response.data.ParsedResults[0].ParsedText || "No text found";
    } catch (error) {
        console.error("OCR API Error:", error.response?.data || error.message);
        throw new Error("OCR API Error: " + error.message);
    }
}
