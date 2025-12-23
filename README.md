#  Student Tutor – AI-Powered Learning Assistant

Student Tutor is a full-stack AI-powered web application designed to help students **understand documents**, **summarize content**, **generate quizzes (QCM)**, and **build personalized study roadmaps**.

This project was built as part of a **Projet de Fin d’Année (PFA)** and focuses on practical AI integration, backend architecture, and real-world system design.

---

##  Features

- 📄 Upload documents (PDF, text, images)
- 🧠 AI-powered text understanding
- ✍️ Automatic summaries
- ❓ Multiple-choice quiz (QCM) generation
- 🗺️ Personalized study roadmaps
- 🔁 Regenerate quizzes dynamically
- 👤 User authentication (Firebase)
- 💾 Save & view AI-generated history
- 🌍 Multi-language support (auto-detected)

---

##  Tech Stack

### Backend
- **Node.js**
- **Express.js**
- **MongoDB Atlas**
- **Firebase Authentication**
- **Gemini AI**
- **Hugging Face Transformers**

### Frontend
- HTML
- CSS
- Vanilla JavaScript

### Cloud & Tools
- Microsoft Azure (App Service)
- Git & GitHub
- dotenv

---

## Architecture Overview
User
│
├── Upload File
│
├── Express Server
│ ├── File extraction
│ ├── Chunking logic
│ ├── AI routing (Gemini / HF)
│ └── Response validation
│
├── Firebase Auth
│
└── MongoDB (Saved history)

 Author

Mohamed Chaibi
Computer Science Student
Interested in AI systems, backend engineering, and system-level optimization
