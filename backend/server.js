/**
 * @file server.js
 * Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-01-26 02:51:17
 * Current User's Login: jake1318
 */

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const OpenAI = require("openai");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
require("dotenv").config(); // Load environment variables

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Log but don't exit
});

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan(":method :url :status :response-time ms - :res[content-length]"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    openai: !!process.env.OPENAI_API_KEY,
    youtube: !!process.env.YOUTUBE_API_KEY
  });
});

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, "../dist")));

// Initialize OpenAI API client
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("Warning: OPENAI_API_KEY is not set.");
  }
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
  });
  console.log("OpenAI client initialized.");
} catch (error) {
  console.error("Error initializing OpenAI client:", error.message);
  // Don't exit, just log the error
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
    const response = await axios.get(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`
    );

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
  if (!openai || !process.env.OPENAI_API_KEY) {
    return res.status(503).json({ 
      error: "OpenAI service is not available. Please check your configuration." 
    });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Execute all searches in parallel
    const [aiResponse, youtubeResults, webResults] = await Promise.all([
      openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      }),
      getYouTubeResults(prompt),
      getWebResults(prompt),
    ]);

    const aiResult = aiResponse.choices[0]?.message?.content?.trim();
    if (!aiResult) {
      return res.status(500).json({ error: "Invalid response from OpenAI API." });
    }

    res.json({
      aiResponse: aiResult,
      youtubeResults,
      webResults,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      error: error.response?.data?.error?.message || "Failed to process request. Please try again later.",
    });
  }
});

// Serve index.html for all other routes (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// Start the server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Set' : 'Not set'}`);
  console.log(`YouTube integration: ${process.env.YOUTUBE_API_KEY ? "Enabled" : "Disabled"}`);
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});