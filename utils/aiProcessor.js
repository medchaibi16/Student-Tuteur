import axios from "axios";
import { encode, decode } from "gpt-3-encoder";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";


dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function divideTextIntoChunks(text, maxTokens = 512) {
  const tokens = encode(text);
  const chunks = [];

  for (let i = 0; i < tokens.length; i += maxTokens) {
    chunks.push(decode(tokens.slice(i, i + maxTokens)));
  }

  return chunks;
}

const SUMMARY_MODEL_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";

async function fetchHuggingFaceSummary(prompt) {
  try {
    const response = await axios.post(
      SUMMARY_MODEL_URL,
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}` } }
    );

    console.log("Hugging Face Summary Response:", response.data);
    return response.data[0]?.summary_text || "No summary generated";
  } catch (error) {
    console.error(`❌ Hugging Face Error:`, error.response?.data || error.message);
    return `Error generating summary: ${error.message}`;
  }
}

async function fetchGeminiMCQ(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" }); 
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini MCQ Response:", text);
    return text;
  } catch (error) {
    console.error(`❌ Gemini Error:`, error);
    return `Error generating MCQs: ${error.message}`;
  }
}

async function detectLanguage(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

  const prompt = `
    Detect the language of the following text and respond with only the language name (e.g., "French", "English", "Arabic"):
    
    ${text}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim(); 
  } catch (error) {
    console.error(`❌ Error detecting language:`, error);
    return "English"; 
  }
}

async function extractKeyFacts(text) {
  const prompt = `Résumé des points clés du texte:\n\n${text}`;
  return await fetchHuggingFaceSummary(prompt);
}

 
async function generateMCQAI(text) {
  const keyFacts = await extractKeyFacts(text);
  const language = await detectLanguage(text); 

  const prompt = `
    Generate 3 multiple-choice questions (MCQs) based on the following key points:
    
    ${keyFacts}
    
    Each question should have 4 options and only one correct answer.
    
    Format them like this:
    Question 1: [Question text]
    A. [Option 1]
    B. [Option 2]
    C. [Option 3]
    D. [Option 4]
    Correct answer: [Correct letter]
    
    The response should be in **${language}**.
  `;

  const rawOutput = await fetchGeminiMCQ(prompt);
  return rawOutput;
}

async function generateStudyRoadmap(topic, text) {
  try {
    const language = await detectLanguage(text); 
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    const prompt = `
      I want to learn about: "${topic}". Provide a structured study roadmap that includes:
      - Essential concepts to master 📌
      - Advanced topics 🔥
      - Recommended resources 📖
      - A weekly study plan 📆

      The response should be in **${language}**.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error(`❌ Gemini Error:`, error);
    return `Error generating roadmap: ${error.message}`;
  }
}


async function generateAIResponse(text, type) {
  if (!text) throw new Error("Input text is required");

  if (type === "qcm") {
    return await generateMCQAI(text);
  }
  else if (type === "roadmap") {
      return await generateStudyRoadmap(text); 
  } else if (type === "summary") {
    return await extractKeyFacts(text);
  }

  throw new Error("Invalid response type");
}
const cache = new Map();

async function retryGenerateAIResponse(text, type, retries = 3) {
  const cacheKey = `${type}-${text}`;
  if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
  }

  for (let attempt = 0; attempt < retries; attempt++) {
      try {
          const result = await generateAIResponse(text, type);
          cache.set(cacheKey, result);
          return result;
      } catch (error) {
          if (error.status === 429 && attempt < retries - 1) {
              const retryAfter = error.errorDetails?.find(detail => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo')?.retryDelay || '20s';
              const waitTime = parseInt(retryAfter) * 1000 || 20000;
              console.warn(`Rate limit hit! Retrying in ${waitTime / 1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
              throw error;
          }
      }
  }
}


export { generateAIResponse, divideTextIntoChunks , retryGenerateAIResponse };
