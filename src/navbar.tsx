/**
 * @file src/navbar.tsx
 * Last updated: 2025-01-24 23:11:24
 * Author: jake1318
 */

import { Link } from "react-router-dom";
import { CustomWalletButton } from "./customwalletbutton";
import "./Navbar.css";

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        {/* Entire logo (image + text) wrapped in a single Link to avoid nesting issues */}
        <Link to="/home" className="logo-container">
          <img src="/Design_2.png" alt="Sui Mind Logo" className="logo-image" />
          <span className="logo-text">Sui Mind</span>
        </Link>

        {/* Navigation links centered */}
        <div className="nav-center">
          <ul className="nav-links">
            <li className="nav-item">
              <Link to="/mind-search" className="nav-link">
                Mind Search
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/mind-swap" className="nav-link">
                Mind Swap
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/mind-exchange" className="nav-link">
                Mind Exchange
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/orderbook" className="nav-link">
                DEX
              </Link>
            </li>
          </ul>
        </div>

        {/* Wallet button aligned to the right */}
        <div className="nav-right">
          <CustomWalletButton />
        </div>
      </div>
    </nav>
  );
}
