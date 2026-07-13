// const { createServer } = require('http');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const app = express();
const PORT = 3000;
const hostname = '127.0.0.1';
const distPath = path.join(process.cwd(), "public");
app.use(express.static(distPath));

// Increase payload limit to handle base64 prescription images
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Set up EJS and Layouts
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout'); // Points to views/layout.ejs

// Serve all static files (CSS, JS, images) from the 'public' folder
// app.use(express.static(distPath));

// Fallback: Send index.html for the root route
app.get('/', (req, res) => {
    // res.sendFile(path.join(distPath, 'index.html'));
    res.render('index', { title: 'Janta Telehealth - Decentralized Rural Micro-Clinics' });
});
// medical prescription parser
app.get('/prescriptionParser', (req, res) => {
  // res.sendFile(path.join(distPath, 'prescriptionParser.html'));
  res.render('prescriptionParser', { title: 'Medical Prescription Parser' });
});

app.listen(PORT, hostname, () => {
  console.log(`Server running at http://${hostname}:${PORT}/`);
});

// const server = createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('Hello World\n');
// });
// server.listen(PORT, hostname, () => {
//   console.log(`Server running at http://${hostname}:${PORT}/`);
// });


// import { createServer as createViteServer } from "vite";
// import { GoogleGenAI, Type } from "@google/genai";
// import dotenv from "dotenv";

// dotenv.config();


// // Lazy initialize the Google GenAI client
// let aiClient: GoogleGenAI | null = null;

// function getGeminiClient(): GoogleGenAI {
//   if (!aiClient) {
//     const apiKey = process.env.GEMINI_API_KEY;
//     if (!apiKey) {
//       throw new Error("GEMINI_API_KEY is not defined. Please add it to your secrets/environment variables.");
//     }
//     aiClient = new GoogleGenAI({
//       apiKey: apiKey,
//       httpOptions: {
//         headers: {
//           'User-Agent': 'aistudio-build',
//         },
//       },
//     });
//   }
//   return aiClient;
// }

// // Structured JSON schema for the prescription parser
// const prescriptionSchema = {
//   type: Type.OBJECT,
//   properties: {
//     patientName: { 
//       type: Type.STRING, 
//       description: "Full name of the patient. If not visible, return null or empty string." 
//     },
//     patientAge: { 
//       type: Type.STRING, 
//       description: "Age of the patient. (e.g. '28', '5 years', or null)" 
//     },
//     patientGender: { 
//       type: Type.STRING, 
//       description: "Gender of the patient. (e.g. 'Male', 'Female', or null)" 
//     },
//     doctorName: { 
//       type: Type.STRING, 
//       description: "Full name of the doctor with credentials (e.g., 'Dr. Jane Smith, MD')." 
//     },
//     doctorSpecialty: { 
//       type: Type.STRING, 
//       description: "Specialty/Department of the doctor (e.g., 'Pediatrician', 'Cardiologist')." 
//     },
//     doctorClinic: { 
//       type: Type.STRING, 
//       description: "Name of the clinic, hospital, or medical center." 
//     },
//     doctorContact: { 
//       type: Type.STRING, 
//       description: "Contact information (Phone number, Address, or Email) of the doctor/clinic." 
//     },
//     prescriptionDate: { 
//       type: Type.STRING, 
//       description: "Date of the prescription (e.g., YYYY-MM-DD, or as written in the text)." 
//     },
//     medicines: {
//       type: Type.ARRAY,
//       description: "List of all medications listed in the prescription.",
//       items: {
//         type: Type.OBJECT,
//         properties: {
//           name: { 
//             type: Type.STRING, 
//             description: "Name of the medicine (brand name or generic)." 
//           },
//           genericName: {
//             type: Type.STRING,
//             description: "The active pharmaceutical ingredient / chemical / salt name (e.g., 'Amoxicillin', 'Atorvastatin', 'Paracetamol')."
//           },
//           ethicalBrandExample: {
//             type: Type.STRING,
//             description: "An example of a popular premium ethical/branded version in India (e.g., 'Calpol 650', 'Augmentin 625 Duo', 'Atorva 10') with its estimated retail price range (e.g., '₹150 for 10 tablets')."
//           },
//           genericBrandExample: {
//             type: Type.STRING,
//             description: "An example of a low-cost generic equivalent or Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) equivalent in India with its estimated low-cost price (e.g., '₹35 for 10 tablets')."
//           },
//           estimatedSavingsPercent: {
//             type: Type.INTEGER,
//             description: "Estimated percentage saved by choosing the PMBJP / low-cost generic brand instead of the ethical brand (e.g., 75)."
//           },
//           dosage: { 
//             type: Type.STRING, 
//             description: "Dosage details (e.g., '500mg', '1 tablet', '5ml')." 
//           },
//           frequency: { 
//             type: Type.STRING, 
//             description: "Frequency of intake (e.g., 'Twice a day', '1-0-1', 'Every 8 hours', 'As needed')." 
//           },
//           duration: { 
//             type: Type.STRING, 
//             description: "Duration of the prescription (e.g., '5 days', '1 week', 'Continuous')." 
//           },
//           instructions: { 
//             type: Type.STRING, 
//             description: "Specific intake guidelines (e.g., 'After meals', 'Avoid dairy', 'Take with warm water')." 
//           }
//         },
//         required: ["name", "genericName", "ethicalBrandExample", "genericBrandExample", "estimatedSavingsPercent"]
//       }
//     },
//     additionalNotes: { 
//       type: Type.STRING, 
//       description: "Other instructions, symptoms, diagnoses, advice, general notes, or next follow-up date." 
//     },
//     confidenceScore: { 
//       type: Type.INTEGER, 
//       description: "Estimated percentage confidence (0-100) on overall transcription readability and medical matching." 
//     }
//   },
//   required: ["patientName", "doctorName", "medicines"]
// };

// // API Endpoint to parse prescription
// app.post("/api/parse-prescription", async (req, res) => {
//   try {
//     const { imageBase64, mimeType, prompt } = req.body;

//     const ai = getGeminiClient();
//     const parts: any[] = [];

//     // Include the base64 image part if provided
//     if (imageBase64 && mimeType) {
//       // Strip out the data:image/...;base64, prefix if it exists
//       const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
//       parts.push({
//         inlineData: {
//           mimeType: mimeType,
//           data: cleanBase64,
//         }
//       });
//     }

//     // Add instructions and prompts
//     let promptText = "Analyze this medical prescription image or textual medical note. " +
//                      "Extract all relevant information as specified in the schema. " +
//                      "Be extremely precise. Handwriting can be difficult to read; use medical knowledge to find the correct pharmaceutical and clinical terms. " +
//                      "If some details are missing, return reasonable defaults or null. " +
//                      "Ensure confidenceScore is a realistic reflection of text legibility and completion.";

//     if (prompt && prompt.trim() !== "") {
//       promptText += `\n\nUser custom request/instructions: ${prompt.trim()}`;
//     }

//     parts.push({ text: promptText });

//     const response = await ai.models.generateContent({
//       model: "gemini-3.5-flash",
//       contents: { parts },
//       config: {
//         responseMimeType: "application/json",
//         responseSchema: prescriptionSchema,
//         systemInstruction: "You are an expert pharmacist and clinical transcription system. Your core directive is to accurately read and parse handwritten or digital prescriptions, patient letters, and medical notes into clear, structured JSON data. Maintain absolute professional accuracy.",
//       },
//     });

//     const parsedText = response.text;
//     if (!parsedText) {
//       throw new Error("Empty response received from Gemini.");
//     }

//     const data = JSON.parse(parsedText);
//     res.json({ success: true, data });
//   } catch (error: any) {
//     console.error("Prescription parsing error:", error);
//     res.status(500).json({ 
//       success: false, 
//       error: error.message || "An error occurred while parsing the prescription. Please verify your API Key and input." 
//     });
//   }
// });

// // API Endpoint to answer follow-up questions about the prescription
// app.post("/api/ask-question", async (req, res) => {
//   try {
//     const { prescriptionData, question, imageBase64, mimeType } = req.body;
//     if (!question) {
//       return res.status(400).json({ success: false, error: "Question is required." });
//     }

//     const ai = getGeminiClient();
//     const parts: any[] = [];

//     if (imageBase64 && mimeType) {
//       const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
//       parts.push({
//         inlineData: {
//           mimeType: mimeType,
//           data: cleanBase64,
//         }
//       });
//     }

//     let promptText = `You are a clinical pharmacologist and medical advisor.
// The user has uploaded a medical prescription which was parsed into the following structured JSON:
// ${JSON.stringify(prescriptionData, null, 2)}

// User's follow-up question: "${question}"

// Provide a professional, extremely helpful, clear, and easy-to-understand answer. 
// Guidelines:
// 1. Speak clearly to the patient (or physician) in a friendly but highly professional tone.
// 2. If they ask about food interactions, drug-drug interactions, side effects, or safety, reference the parsed medicines.
// 3. Keep the advice medically accurate, but structure it with simple bullet points so it is readable.
// 4. **CRITICAL MANDATE**: Include a clear, standard clinical disclaimer at the end of your response, emphasizing that this is an AI transcription helper and they must consult their primary doctor or pharmacist before making any clinical changes.`;

//     parts.push({ text: promptText });

//     const response = await ai.models.generateContent({
//       model: "gemini-3.5-flash",
//       contents: { parts },
//       config: {
//         systemInstruction: "You are a friendly, professional clinical pharmacologist and healthcare assistant. You help patients understand their prescribed medicines, dosages, side effects, and precautions based on their prescription, but you always include a prominent professional disclaimer.",
//       },
//     });

//     res.json({ success: true, answer: response.text });
//   } catch (error: any) {
//     console.error("Prescription follow-up question error:", error);
//     res.status(500).json({ 
//       success: false, 
//       error: error.message || "An error occurred while answering your question." 
//     });
//   }
// });

// // Vite & Static file handling
// async function startServer() {
//   if (process.env.NODE_ENV !== "production") {
//     const vite = await createViteServer({
//       server: { middlewareMode: true },
//       appType: "spa",
//     });
//     app.use(vite.middlewares);
//   } else {
//     const distPath = path.join(process.cwd(), "dist");
//     app.use(express.static(distPath));
//     app.get("*", (req, res) => {
//       res.sendFile(path.join(distPath, "index.html"));
//     });
//   }

//   app.listen(PORT, "0.0.0.0", () => {
//     console.log(`Server running on port ${PORT}`);
//   });
// }

// startServer();
