import express from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { extractText } from './utils/index.js'; // Import from utils
import { generateAIResponse,divideTextIntoChunks,retryGenerateAIResponse } from './utils/aiProcessor.js'; // Import AI processing
import bcrypt from 'bcrypt'; 

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

const firebaseConfig = {
    apiKey: "AIzaSyB83xddXBrCSbZfR1BG2J571mGFme7QYvQ",
    authDomain: "pfaa-138f0.firebaseapp.com",
    projectId: "pfaa-138f0",
    storageBucket: "pfaa-138f0.firebasestorage.app",
    messagingSenderId: "747818517047",
    appId: "1:747818517047:web:8b448bca4bb0e4903075b2"
  };
  
  // Initialize Firebase
  const firebaseApp = initializeApp(firebaseConfig);
  const auth = getAuth(firebaseApp);

  const uri = "mongodb+srv://user:user@cluster0.vfxsetx.mongodb.net/?appName=Cluster0";
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  
  let collection;
  (async () => {
    try {
      const clientConnection = await client.connect();
      const database = clientConnection.db('PFA');
      collection = database.collection('usersdata');
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  })();
  

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

    const responses = [];
    const processedTypes = new Map();

    for (const type of types) {
      if (processedTypes.has(type)) {
        console.log(`Skipping duplicate processing for type: ${type}`);
        continue;
      }

      let typeResponses = [];

      if (type === "summary") {
        const chunks = await divideTextIntoChunks(text);
        for (const chunk of chunks) {
          const response = await retryGenerateAIResponse(chunk, type);
          typeResponses.push(response);
        }
      } else {
        // Send full input as a single chunk for non-summary types
        const response = await retryGenerateAIResponse(text, type);
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


app.post('/register', async (req, res) => {
    try {
      if (!collection) {
        return res.status(500).json({ message: 'Database not initialized. Please try again later.' });
      }
  
      const {
        firstName,
        secondName,
        email,
        password,
      } = req.body;
  
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (firebaseError) {
        console.error('Firebase registration error:', firebaseError.message);
        return res.status(400).json({ success: false, message: `Firebase registration error: ${firebaseError.message}` });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const userData = {
        firstName,
        secondName,
        email,
        password: hashedPassword, 
      };
  
      const result = await collection.insertOne(userData);
      console.log('User data inserted:', result);
  
      res.status(201).json({
        success: true,
        message: 'User registered successfully!',
        redirectUrl: '/login'
      });
    } catch (error) {
      console.error('Error inserting user data:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  app.post('/save-output', async (req, res) => {
    const { email, aiOutput } = req.body;
  
    try {
      const result = await collection.updateOne(
        { email: email },
        { $push: { aiOutputs: aiOutput } } 
      );
  
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json({ message: 'AI output added to history successfully' });
    } catch (err) {
      console.error("Saving error:", err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  app.post('/get-saved-prompts', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await collection.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const prompts = user.aiOutputs || []; // default to empty array
    res.json({ prompts });
  } catch (err) {
    console.error("Error fetching prompts:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

  

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'html', 'main.html'));
});
app.get('/register', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'html', 'register.html'));
  });
app.get('/login', (req, res) => {
   res.sendFile(join(__dirname, 'public', 'html', 'login.html'));
});
// Start Server
app.listen(port, () => {
    console.log(`✅ Server is running at http://localhost:${port}`);
});