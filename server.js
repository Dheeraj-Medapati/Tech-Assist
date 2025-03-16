require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Serve frontend from "client/dist"
app.use(express.static(path.join(__dirname, "client", "dist")));

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("API key not configured");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro-exp-02-05" });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.post("/api/gemini", async (req, res) => {
  try {
    const text = req.body.text;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const chatSession = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 200,
      },
    });

    const result = await chatSession.sendMessage(text);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Internal server error", message: error.message });
  }
});

app.post("/api/gemini/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided" });

    const base64Image = req.file.buffer.toString("base64");

    const chatSession = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 50,
      },
    });

    const result = await chatSession.sendMessage(
      { inlineData: { mimeType: req.file.mimetype, data: base64Image } },
      "Describe this image"
    );
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("Image API error:", error);
    res.status(500).json({ error: "Image processing failed", message: error.message });
  }
});

// Serve frontend for any other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});