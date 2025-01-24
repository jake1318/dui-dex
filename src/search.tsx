/**
 * @file src/pages/Search.tsx
 * Last updated: 2025-01-24
 * Author: jake1318
 */

import { useState } from "react";
import "./search.css";

const Footer: React.FC = () => (
  <footer className="footer">
    <p>&copy; 2025 Sui Mind. All rights reserved.</p>
  </footer>
);

export function Search() {
  const [query, setQuery] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSearch = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: query }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.result);
      } else {
        setError(data.error || "An error occurred while fetching results.");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Unable to fetch results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mind-search">
        <div className="container">
          <h1 className="title">Mind Search</h1>
          <p className="description">
            Experience the power of AI-enhanced search tailored to your needs.
          </p>
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="Ask anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
            />
            <button
              className="search-button"
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
          {result && (
            <div className="search-result">
              <h2>Search Result:</h2>
              <p>{result}</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
