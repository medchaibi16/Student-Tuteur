import express from 'express';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { extractText } from './utils/index.js'; // Import from utils
import { generateAIResponse,divideTextIntoChunks,retryGenerateAIResponse } from './utils/aiProcessor.js'; // Import AI processing

// Load environment variables
dotenv.config();

// Convert __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload()); // Handles file uploads
app.use(express.static(join(__dirname, 'public'))); // Serves static files

// Upload and extract text
app.post("/upload", async (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        const uploadedFile = req.files.file;
        const fileType = uploadedFile.name.split('.').pop().toLowerCase(); // Get file extension
        console.log("File Type:", fileType); // Log the file type

        const extractedText = await extractText(uploadedFile.data, fileType);
        res.json({ text: extractedText });

    } catch (error) {
        console.error("❌ Error extracting text:", error);
        res.status(500).json({ error: "Error extracting text: " + error.message });
    }
});

app.post('/generate', async (req, res) => {
  try {
      const { text, types } = req.body;

      if (!text || !types || !Array.isArray(types) || types.length === 0) {
          return res.status(400).json({ error: 'Missing text or types' });
      }

      const chunks = await divideTextIntoChunks(text);
      const responses = [];

      // Create a map to store processed types and prevent duplicate processing
      const processedTypes = new Map();

      for (const type of types) {
          if (processedTypes.has(type)) {
              console.log(`Skipping duplicate processing for type: ${type}`);
              continue;
          }

          let typeResponses = [];
          for (const chunk of chunks) {
              const response = await retryGenerateAIResponse(chunk, type);
              typeResponses.push(response);
          }

          const finalText = typeResponses.join('\n'); 
          responses.push({ type, content: finalText });
          processedTypes.set(type, finalText); 
      }

      res.json(responses);
  } catch (error) {
      console.error('Error in /generate endpoint:', error);
      res.status(500).json({ error: 'AI processing error', details: error.message });
  }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'html', 'main.html'));
});

// Start Server
app.listen(port, () => {
    console.log(`✅ Server is running at http://localhost:${port}`);
});