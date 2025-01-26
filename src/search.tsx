/**
 * @file src/search.tsx
 * Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-01-25 20:38:45
 * Current User's Login: jake1318
 */

import React, { useState } from "react";
import "./Search.css";

interface YouTubeResult {
  title: string;
  description: string;
  thumbnail: string;
  videoId: string;
  url: string;
}

interface WebResult {
  title: string;
  description: string;
  url: string;
}

interface SearchResponse {
  aiResponse: string;
  youtubeResults: YouTubeResult[];
  webResults: WebResult[];
  error?: string;
}

export function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError("Please enter a search term");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: searchQuery
        }),
      });
      
      const data: SearchResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setSearchResult(data);
      setError("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to process your search. Please try again.";
      
      setError(errorMessage);
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mind-search">
      <div className="container">
        <h1 className="title">AI-Powered Search</h1>
        <p className="description">
          Get comprehensive results powered by AI, including relevant videos and web resources
        </p>

        <form onSubmit={handleSearch}>
          <div className="search-box">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask anything..."
              className="search-input"
              disabled={loading}
            />
            <button 
              type="submit" 
              className="search-button"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </form>

        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Processing your request...</p>
          </div>
        )}

        {searchResult && (
          <div className="results-grid">
            {/* AI Response */}
            <div className="result-container ai-response">
              <h2>AI Response</h2>
              <div className="result-content">
                {searchResult.aiResponse}
              </div>
            </div>

            {/* YouTube Results */}
            {searchResult.youtubeResults.length > 0 && (
              <div className="result-container youtube-results">
                <h2>Related Videos</h2>
                <div className="videos-grid">
                  {searchResult.youtubeResults.map((video, index) => (
                    <div key={video.videoId} className="video-card">
                      <a href={video.url} target="_blank" rel="noopener noreferrer">
                        <img src={video.thumbnail} alt={video.title} />
                        <h3>{video.title}</h3>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Web Results */}
            {searchResult.webResults.length > 0 && (
              <div className="result-container web-results">
                <h2>Related Resources</h2>
                <div className="web-links">
                  {searchResult.webResults.map((result, index) => (
                    <a 
                      key={index} 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="web-link-card"
                    >
                      <h3>{result.title}</h3>
                      <p>{result.description}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}