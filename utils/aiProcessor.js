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
const HF_API_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn";
const HF_API_KEY = "your_key_here";

async function fetchHuggingFaceSummary(prompt) {
  try {
    console.log("Sending request to Hugging Face Router API...");
    
    const response = await axios.post(
      HF_API_URL,
      { 
        inputs: prompt,
        parameters: {
          max_length: 500,
          min_length: 100,
          do_sample: false,
        }
      },
      { 
        headers: { 
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 45000
      }
    );

    console.log("✅ Hugging Face Summary Response received:", response.data);
    
    // Handle the response format
    if (Array.isArray(response.data) && response.data[0]?.summary_text) {
      return response.data[0].summary_text;
    } else if (response.data?.summary_text) {
      return response.data.summary_text;
    } else if (response.data?.generated_text) {
      return response.data.generated_text;
    } else {
      console.log("Unexpected response format:", response.data);
      return "No summary generated";
    }
  } catch (error) {
    console.error(`❌ Hugging Face Error:`, error.response?.data || error.message);
    return `Error: ${error.response?.data?.error || error.message}`;
  }
}

async function fetchGeminiMCQ(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
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
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `Extract the 5-7 most important factual points from the following text. Return ONLY the key facts as a bullet point list, no explanations:
    
    TEXT: "${text.substring(0, 3000)}"
    
    KEY FACTS:`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error extracting key facts:", error);
    // Fallback to original text
    return text.substring(0, 1000);
  }
}
 
async function generateMCQAI(text, attemptCount = 0) {
  try {
    const language = await detectLanguage(text);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const wordCount = text.split(/\s+/).length;
    const numberOfQuestions = Math.min(8, Math.max(4, Math.floor(wordCount / 200)));

    // Diverse question styles (less chaotic, more varied)
    const questionStyles = [
      "historical chronology",
      "technological cause-effect", 
      "economic impacts",
      "social consequences",
      "unexpected outcomes",
      "key innovations",
      "future predictions",
      "comparison between eras",
      "major turning points",
      "cultural transformations"
    ];

    // Pre-shuffle answer distribution for maximum randomness
    const answerLetters = ['A', 'B', 'C', 'D'];
    const shuffledAnswers = [];
    for (let i = 0; i < numberOfQuestions; i++) {
      shuffledAnswers.push(answerLetters[Math.floor(Math.random() * answerLetters.length)]);
    }

    const selectedStyles = questionStyles
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const prompt = `
      Generate ${numberOfQuestions} DIVERSE and VARIED multiple-choice questions.
      This is generation attempt #${attemptCount + 1} - make them DIFFERENT from previous sets!
      
      TEXT: "${text.substring(0, 4000)}"
      
      DIVERSITY REQUIREMENTS:
      - Focus on these aspects: ${selectedStyles.join(', ')}
      - Ensure answers are randomly distributed like this: ${shuffledAnswers.join(', ')}
      - Include different question types: factual, analytical, comparative
      - Cover various time periods: 1960s-1980s, 1990s, 2000s, 2010s-present, future
      - Test different knowledge levels: basic facts, connections, implications
      
      QUESTION VARIETY:
      - 2 questions about historical events and chronology
      - 2 questions about technological developments  
      - 2 questions about social/economic impacts
      - 1 question about future trends
      - 1 question comparing different eras
      
      FORMAT REQUIREMENTS:
      - ALWAYS show the correct answer in [brackets] like: Correct answer: [A]
      - Make options clear and distinct
      - Ensure only ONE correct answer per question
      - Use normal numbering (1, 2, 3...)
      
      ANSWER DISTRIBUTION: Must match this pattern: ${shuffledAnswers.join(', ')}
      
      Make the questions ENGAGING and THOUGHT-PROVOKING but not confusing!
      
      LANGUAGE: ${language}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Validate that answers are showing properly
    const output = response.text();
    if (!output.includes('Correct answer: [')) {
      console.log("Answers not showing properly, regenerating...");
      return await generateMCQAI(text, attemptCount); // Retry once
    }
    
    return output;
  } catch (error) {
    console.error("Error in generateMCQAI:", error);
    return `Error generating MCQs: ${error.message}`;
  }
}

function validateMCQRelevance(mcqText, originalText) {
  const originalKeywords = originalText.toLowerCase().split(/\s+/).slice(0, 50);
  const mcqLower = mcqText.toLowerCase();
  
  let relevanceScore = 0;
  originalKeywords.forEach(keyword => {
    if (keyword.length > 4 && mcqLower.includes(keyword)) {
      relevanceScore++;
    }
  });
  
  return relevanceScore > 5; // At least 5 relevant keywords
}

async function generateMCQAIWithValidation(text) {
  let attempts = 0;
  const maxAttempts = 2;
  
  while (attempts < maxAttempts) {
    const mcqOutput = await generateMCQAI(text);
    
    if (validateMCQRelevance(mcqOutput, text)) {
      return mcqOutput;
    }
    
    attempts++;
    console.log(`MCQ attempt ${attempts} failed relevance check, retrying...`);
  }
  
  return "Unable to generate relevant MCQs. Please try with a different text.";
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

// Only update the retryGenerateAIResponse function call
async function retryGenerateAIResponse(text, type, retries = 3, isRegeneration = false) {
  const cacheKey = `${type}-${text}-${isRegeneration ? 'regen' : 'initial'}`;
  
  // Only cache initial generations, not regenerations
  if (cache.has(cacheKey) && !isRegeneration) {
    return cache.get(cacheKey);
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await generateAIResponse(text, type, isRegeneration);
      
      // Only cache if it's the first generation
      if (!isRegeneration) {
        cache.set(cacheKey, result);
      }
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

async function generateStudyRoadmap(text) {
  try {
    const language = await detectLanguage(text);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Create a comprehensive study roadmap based on the following text. Structure it as follows:

      TEXT: "${text.substring(0, 3500)}"

      STUDY ROADMAP STRUCTURE:
      
      📚 **FOUNDATIONAL CONCEPTS** (Prerequisites to understand first)
      - List 3-5 fundamental concepts needed before diving deeper
      - Explain why each is important for understanding this topic
      
      🎯 **CORE LEARNING OBJECTIVES** (What you should be able to do after studying)
      - 4-6 main skills or knowledge areas to master
      - Make them specific and measurable
      
      📅 **STUDY PHASES & TIMELINE**
      
      Phase 1: Basics & Fundamentals (Week 1-2)
      - Key topics to cover
      - Recommended resources (books, videos, articles)
      - Practice exercises
      
      Phase 2: Intermediate Concepts (Week 3-4)  
      - Deeper topics to explore
      - Hands-on projects or activities
      - Assessment methods
      
      Phase 3: Advanced Applications (Week 5-6)
      - Real-world applications
      - Complex problem-solving
      - Integration with related fields
      
      🔧 **STUDY STRATEGIES & TIPS**
      - Effective learning methods for this topic
      - Common pitfalls to avoid
      - How to test your understanding
      - Recommended study schedule
      
      📊 **ASSESSMENT CHECKPOINTS**
      - How to know you're making progress
      - Self-testing methods
      - When to move to the next phase
      
      🚀 **NEXT STEPS & FURTHER LEARNING**
      - Related topics to explore after mastery
      - Advanced specializations
      - Communities and resources for continued learning

      Make the roadmap practical, actionable, and tailored to the specific content.
      LANGUAGE: ${language}
      
      Format with clear sections and emojis for better readability.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating study roadmap:", error);
    return `Error generating study roadmap: ${error.message}`;
  }
}


export { generateAIResponse, divideTextIntoChunks , retryGenerateAIResponse ,  generateMCQAIWithValidation as generateMCQAI ,generateStudyRoadmap };
