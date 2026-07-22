import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';
import { type } from 'os';
import { json, text } from 'stream/consumers';
// The SDK automatically pulls process.env.API_KEY, 
// when dotenv.config() is called in server.js, so you don't need to pass it here.
const ai = new GoogleGenAI({ apikey: process.env.GEMINI_API_KEY }); 
// const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Secure endpoint for your frontend to call
// array of images is must. prompt is optional. 
// If prompt is not provided, a default prompt will be used to extract 
// information from the prescription images.
// res is respnonse object from express.js. 
// It is used to send back the response to the frontend.
export async function textifyImages(payloadImages) {
    console.log("inside googleAIStudioConnect.js->textifyImages: " + JSON.stringify(payloadImages));
    console.log("GEMINI_API_KEY: " + process.env.GEMINI_API_KEY);
    // Enable CORS by setting the wildcard or specific domain
    // res.set('Access-Control-Allow-Origin', '*');
    // res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    // res.set('Access-Control-Allow-Headers', 'Content-Type');
    // // Handle the browser's preflight OPTIONS request
    // if (req.method === 'OPTIONS') {
    //     //res.set('Access-Control-Max-Age', '3600');
    //     return res.status(204).send('');
    // }
    // const { prompt } = req.body;
    // if (!prompt) {
    //     return res.status(400).json({ error: "Prompt is required" });
    // }
   let prompt = "Analyze this medical prescription image " +
                  "Extract all information as specified in the schema. " +
                  "Be extremely precise. Handwriting can be difficult to read; " +
                  "use medical knowledge to find the correct pharmaceutical and clinical terms. If some details are missing, return null. " +
                  "Ensure confidenceScore is a realistic reflection of text legibility and completion.";

    const images = payloadImages;

    if (!Array.isArray(images) || images.length === 0) {
      throw new Error('Please upload at least one image.');
    }

    const parts = [];
    
    parts.push({ type: 'text', text: prompt });

    for (const image of images) {
      const inlineData = image?.inlineData;
      if (inlineData?.data) {
        parts.push({
          type: 'image',
          mimeType: image.mimeType || 'image/png',
          data: inlineData.data.replace(/^data:image\/\w+;base64,/, '')
        });
      } else if (image?.path) {
        try {
          const fileBuffer = await fs.readFile(image.path);
          const base64Data = fileBuffer.toString('base64');
          parts.push({
            type: 'image',
            mimeType: image.mimeType || 'image/png',
            data: base64Data
          });
        } catch (error) {
          console.error('Failed to read uploaded image from disk:', error);
          throw new Error('Unable to read uploaded image file.');
        } finally {
          try {
            await fs.unlink(image.path);
            console.log(`Successfully deleted temporary file: ${image.path}`);
          } catch (cleanupError) {
            console.warn(`Cleanup failed for ${image.path}:`, cleanupError);
          }
        }
      }
    }

    if (parts.length === 0) {
      throw new Error('No valid image data was received.');
    }
    try {
        const response = await ai.interactions.create({
            model: "gemini-3.5-flash",
            input: [{ 
              parts: parts,
              role: 'user'
            }],
            system_instruction: 'You are an expert pharmacist and clinical transcription system. Your core directive is to accurately read and parse handwritten or digital prescriptions, patient letters, and medical notes into clear, structured JSON data. Maintain absolute professional accuracy.',
            response_format: {
              type: "text",
              mime_type: "application/json", 
              schema: prescriptionSchema
            }
        });

        const outputText = response?.text || response?.output_text || '';
        console.log(outputText);
        return { reply: outputText };
    } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.text ||
          error?.message ||
          'Failed to fetch response from Gemini.';
        console.error("Error communicating with Gemini:", error);
        throw new Error(message);
    }
};

// Structured JSON schema for the prescription parser
const prescriptionSchema = {
  "type": "object",
  "properties": {
    "patientName": { 
      "type": "string", 
      "description": "Full name of the patient. If not visible, return null or empty string." 
    },
    "patientAge": { 
      "type": "string", 
      "description": "Age of the patient. (e.g. '28', '5 years', or null)" 
    },
    "patientGender": { 
      "type": "string", 
      "description": "Gender of the patient. (e.g. 'Male', 'Female', or null)" 
    },
    "doctorName": { 
      "type": "string", 
      "description": "Full name of the doctor with credentials (e.g., 'Dr. Jane Smith, MD')." 
    },
    "doctorSpecialty": { 
      "type": "string", 
      "description": "Specialty/Department of the doctor (e.g., 'Pediatrician', 'Cardiologist')." 
    },
    "doctorClinics": { 
      "type": "array", 
      "description": "Name of the clinic, hospital, or medical center.",
      "items": {
        "type": "object",
        "properties": {
          "clinicName": { 
            "type": "string"
          }
        }
      }
    },
    "doctorContact": { 
      "type": "string", 
      "description": "Contact information (Phone number, Address, or Email) of the doctor/clinic." 
    },
    "prescriptionDate": { 
      "type": "string", 
      "description": "Date of the prescription (e.g., YYYY-MM-DD, or as written in the text)." 
    },
    "medicines": {
      "type": "array",
      "description": "List of all medications listed in the prescription.",
      "items": {
        "type": "object",
        "properties": {
          "name": { 
            "type": "string", 
            "description": "Name of the medicine (brand name or generic)." 
          },
          "salts": { 
            "type": "array",
            "enum": ["PENDING_SYSTEM_EVALUATION"], 
            "nullable": true,
            "description": "CRITICAL: Do not fill. Set this entire object to null. It is processed by an external function. List of active ingredients in the medicine.",
            "items": { 
              "type": "object", 
              "properties": { 
                "name": { 
                  "type": "string" 
                } 
              } 
            }
          },
          "genericName": {
            "type": "string",
            "enum": ["PENDING_SYSTEM_EVALUATION"], 
            "nullable": true,
            "description": "CRITICAL: Do not fill. Set this entire object to null. It is processed by an external function. The active pharmaceutical ingredient / chemical / salt name (e.g., 'Amoxicillin', 'Atorvastatin', 'Paracetamol')."
          },
          "ethicalBrandExample": {
            "type" : "string",
            "enum": ["PENDING_SYSTEM_EVALUATION"],  
            "nullable": true,
            "description": "CRITICAL: Do not fill. Set this entire object to null. It is processed by an external function. An example of a popular premium ethical/branded version in India (e.g., 'Calpol 650', 'Augmentin 625 Duo', 'Atorva 10') with its estimated retail price range (e.g., '₹150 for 10 tablets')."
          },
          "genericBrandExample": {
            "type": "string",
            "enum": ["PENDING_SYSTEM_EVALUATION"],  
            "nullable": true,
            "description": "CRITICAL: Do not fill. Set this entire object to null. It is processed by an external function. An example of a low-cost generic equivalent or Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) equivalent in India with its estimated low-cost price (e.g., '₹35 for 10 tablets')."
          },
          "estimatedSavingsPercent": {
            "type": "integer",
            "enum": ["PENDING_SYSTEM_EVALUATION"], 
            "nullable": true,
            "description": "CRITICAL: Do not fill. Set this entire object to null. It is processed by an external function. Estimated percentage saved by choosing the PMBJP / low-cost generic brand instead of the ethical brand (e.g., 75)."
          },
          "dosage": { 
            "type": "string", 
            "description": "Dosage details (e.g., '500mg', '1 tablet', '5ml')." 
          },
          "frequency": { 
            "type": "string", 
            "description": "Frequency of intake (e.g., 'Twice a day', '1-0-1', 'Every 8 hours', 'As needed')." 
          },
          "duration": { 
            "type": "string", 
            "description": "Duration of the prescription (e.g., '5 days', '1 week', 'Continuous')." 
          },
          "instructions": { 
            "type": "string", 
            "description": "Specific intake guidelines (e.g., 'After meals', 'Avoid dairy', 'Take with warm water')." 
          }
        }
      }
    },
    "additionalNotes": { 
      "type": "string", 
      "description": "Other instructions, symptoms, diagnoses, advice, general notes, or next follow-up date." 
    },
    "confidenceScore": { 
      "type": "integer", 
      "description": "Estimated percentage confidence (0-100) on overall transcription readability and medical matching." 
    }
  }
};