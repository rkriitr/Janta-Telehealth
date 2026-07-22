import 'dotenv/config'; 
import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import * as geminiUtils from './services/googleAIStudioConnect.js';
// import * as emailUtils from './services/emailService.js';

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const distPath = path.join(process.cwd(), "public");
const uploadDir = path.join(process.cwd(), 'uploads', 'prescriptions');

// Create uploads directory on startup
if (!fs.existsSync(uploadDir)){
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files are allowed.'));
  }
});
/** 
 * node 22.23.1 and npm 10.9.8, both out of support for 32 bit, 
 * upgrade of the system required to use the latest version of both
 */
app.use(express.static(distPath));
// Enable JSON body parsing
app.use(express.json());

// Increase payload limit to handle base64 prescription images
app.use(express.json({ limit: 52428800 }));
app.use(express.urlencoded({ limit: 52428800, extended: true }));

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

app.post('/api/parse-prescription', (req, res, next) => {
  upload.array('images', 2)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || 'Image upload failed.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    let uploadedFiles = req.files;
    if (!uploadedFiles || !Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
        return res.status(400).send('No images uploaded or files are not in array format.');
    } else if (uploadedFiles.length > 2) {
        return res.status(400).send('Please upload only one prescription at a time (front and back, max 2 images).');
    }
    const images = uploadedFiles.map((file) => ({
      path: file.path,
      originalName: file.originalname,
      mimeType: file.mimetype
    }));

    const result = await geminiUtils.textifyImages(images);
    const rawText = result?.reply;

    if (!rawText) {
      return res.status(400).json({ success: false, error: 'No valid response received from Gemini.' });
    }

    let parsedData = rawText;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      // Keep the raw text if the response is not valid JSON.
    }

    return res.json({ success: true, message: 'Prescription parsed successfully.', data: parsedData });
  } catch (error) {
    console.error('Prescription parsing error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while parsing the prescription.',
    });
  }
});

// app.post('/api/email-pitchdeck', async (req, res) => {
//   try {
//     const formData = req.body;
//     // formData should not be empty and should be an object
//     if (!formData || typeof formData !== 'object') {
//       return res.status(400).json({ success: false, error: 'Please fill the form' });
//     }

//     const result = await emailUtils.sendPitchDeckEmail(formData);
//     return res.json({ success: true, message: 'Email sent successfully.', result });
//   } catch (error) {
//     console.error('Email sending failed:', error);
//     return res.status(500).json({ success: false, error: error.message || 'Email could not be sent.' });
//   }
  
// });

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});

// const server = createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('Hello World\n');
// });
// server.listen(PORT, HOST, () => {
//   console.log(`Server running at http://${HOST}:${PORT}/`);
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
