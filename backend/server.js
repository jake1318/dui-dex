const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config(); // Load environment variables

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, "../dist")));

// Verify the OpenAI API key exists
if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY is not set in the .env file.");
  process.exit(1);
}

// Initialize OpenAI API client
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log("OpenAI client initialized successfully.");
} catch (error) {
  console.error("Error initializing OpenAI client:", error.message);
  process.exit(1);
}

// API route to handle OpenAI requests
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Make the API call to OpenAI
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4", // Ensure the model name matches your subscription
      messages: [{ role: "user", content: prompt }],
    });

    // Respond with the result
    const result = chatCompletion.choices[0]?.message?.content?.trim();
    if (!result) {
      return res
        .status(500)
        .json({ error: "Invalid response from OpenAI API." });
    }

    res.json({ result });
  } catch (error) {
    console.error("Error with OpenAI API:", error.message);
    res.status(500).json({
      error:
        error.response?.data?.error?.message ||
        "Failed to process request. Please try again later.",
    });
  }
});

// Fallback to serve frontend (SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
