/**
 * @file src/search.tsx
 * Last updated: 2025-01-24 23:33:50
 * Author: jake1318
 */

import React, { useState } from "react";
import "./Search.css";

export function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError("Please enter a search term");
      return;
    }
    setError("");
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <div className="mind-search">
      <div className="container">
        <h1 className="title">Mind Search</h1>
        <p className="description">
          Experience the power of AI-enhanced search tailored to your needs.
        </p>

        <form onSubmit={handleSearch}>
          <div className="search-box">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask anything..."
              className="search-input"
            />
            <button type="submit" className="search-button">
              Search
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </form>

        <div className="search-result">
          <h2>Search Results</h2>
          <p></p>
        </div>
      </div>
    </div>
  );
}
