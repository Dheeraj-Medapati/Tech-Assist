require("dotenv").config();
console.log(process.env.GEMINI_API_KEY);
const express = require("express");
const fetch = require("node-fetch");
const multer = require("multer");
const app = express();
const port = 3001;


app.use(express.json());
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed."));
    }
  },
});

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("API key not configured");
  process.exit(1); // Exit if API key is not set
}

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-pro-exp-02-05",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

app.get("/", (req, res) => {
  res.send(
    "🚀 Server is running! Use /api/gemini for text and /api/gemini/image for image processing."
  );
});

app.post("/api/gemini", async (req, res) => {
  try {
    if (!req.body.text) {
      return res.status(400).json({ error: "No text provided in request body" });
    }

    const chatSession = model.startChat({
      generationConfig,
      history: [],
      safetySettings: safetySettings,
    });

    const result = await chatSession.sendMessage(req.body.text);
    const reply = result.response.text();

    if (!reply) {
      return res.status(500).json({ error: "No response from Gemini API" });
    }

    res.json({ reply });
  } catch (error) {
    console.error("API error:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

app.post("/api/gemini/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }
    const base64Image = req.file.buffer.toString("base64");

    const chatSession = model.startChat({
      generationConfig,
      history: [],
      safetySettings: safetySettings,
    });

    const result = await chatSession.sendMessage({
      inlineData: {
        mimeType: req.file.mimetype,
        data: base64Image,
      },
    }, "Describe this image");

    const reply = result.response.text();

    if (!reply) {
      return res.status(500).json({ error: "No response from Gemini API" });
    }
    res.json({ reply });
  } catch (error) {
    console.error("Image API error:", error);
    res.status(500).json({ error: "Image processing failed" });
  }
});

// Multer error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res
      .status(400)
      .json({ error: "File upload error", details: err.message });
  } else if (err) {
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
  next();
});

app.listen(port, () => {
  console.log(`✅ Server listening at http://localhost:${port}`);
});