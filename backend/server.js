/**
 * @file server.js
 * Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-01-25 20:42:45
 * Current User's Login: jake1318
 */

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const OpenAI = require("openai");
const axios = require("axios");
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

// Function to fetch YouTube results if API key is available
async function getYouTubeResults(query) {
  if (!process.env.YOUTUBE_API_KEY) {
    console.log("YouTube API key not found, skipping video results");
    return [];
  }

  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          maxResults: 3,
          key: process.env.YOUTUBE_API_KEY,
          q: query,
          type: "video",
        },
      }
    );

    return response.data.items.map((item) => ({
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      videoId: item.id.videoId,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch (error) {
    console.error("YouTube API Error:", error);
    return [];
  }
}

// Function to get relevant web results using DuckDuckGo
async function getWebResults(query) {
  try {
    // Using DuckDuckGo Instant Answer API
    const response = await axios.get(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`
    );

    // Filter and format the results
    const results = response.data.RelatedTopics || [];
    return results
      .filter((topic) => topic.FirstURL && topic.Text)
      .slice(0, 3)
      .map((topic) => ({
        title: topic.Text.split(" - ")[0] || topic.Text,
        description: topic.Text,
        url: topic.FirstURL,
      }));
  } catch (error) {
    console.error("Web Search Error:", error);
    return [];
  }
}

// API route to handle OpenAI requests with enhanced results
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Execute all searches in parallel
    const [aiResponse, youtubeResults, webResults] = await Promise.all([
      // OpenAI API call
      openai.chat.completions.create({
        model: "gpt-4", // Ensure the model name matches your subscription
        messages: [{ role: "user", content: prompt }],
      }),
      // YouTube search (if API key is available)
      getYouTubeResults(prompt),
      // Web search
      getWebResults(prompt),
    ]);

    // Format the AI response
    const aiResult = aiResponse.choices[0]?.message?.content?.trim();
    if (!aiResult) {
      return res
        .status(500)
        .json({ error: "Invalid response from OpenAI API." });
    }

    // Send combined results
    res.json({
      aiResponse: aiResult,
      youtubeResults,
      webResults,
    });
  } catch (error) {
    console.error("Error processing request:", error.message);
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
  console.log(
    `YouTube integration: ${
      process.env.YOUTUBE_API_KEY ? "Enabled" : "Disabled"
    }`
  );
});
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);
const morgan = require("morgan");

// Use custom logging format
app.use(
  morgan(":method :url :status :response-time ms - :res[content-length]")
);
