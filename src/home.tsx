/**
 * @file src/pages/Home.tsx
 * Last updated: 2025-01-24 04:53:52
 * Author: jake1318
 */

import { Link } from "react-router-dom";
import "./home.css";

export function Home() {
  return (
    <div className="home-container">
      <HeroSection />
      <CombinedSection />
    </div>
  );
}

function HeroSection() {
  const handleExploreClick = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="home" className="hero-section">
      <h1 className="hero-title">Sui Mind - AI Meets Blockchain</h1>
      <p className="hero-subtitle">
        Revolutionizing AI Applications on the Sui Network
      </p>
      <button onClick={handleExploreClick} className="cta-button">
        Explore Sui Mind
      </button>
    </section>
  );
}

function CombinedSection() {
  return (
    <section id="combined-section" className="combined-section">
      <Features />
      <Community />
      <Contact />
    </section>
  );
}

function Features() {
  return (
    <div id="features" className="features">
      <h2 className="section-title">The SUI Mind Application Stack</h2>
      <div className="feature-grid">
        <Feature
          title="Mind Search"
          description="Sui Mind is a sophisticated AI-powered search engine that leverages the Sui blockchain to deliver real-time, secure, and highly accurate search results tailored for you."
          link="/mind-search"
        />
        <Feature
          title="Mind Swap"
          description="Sui Mind integrates a token swapping platform that allows users to trade various tokens on the Sui blockchain. Sui Mind token holders ($SUI-M) enjoy reduced transaction fees, enhancing the affordability and convenience of asset management."
          link="/mind-swap"
        />
        <Feature
          title="Mind Exchange"
          description="The AI Agent Marketplace serves as a decentralized hub for developers to showcase, trade, and deploy AI agents. Powered by smart contracts, this marketplace ensures secure transactions, transparent ratings, and royalties for AI creators."
          link="/mind-exchange"
        />
      </div>
    </div>
  );
}

interface FeatureProps {
  title: string;
  description: string;
  link: string;
}

function Feature({ title, description, link }: FeatureProps) {
  return (
    <Link to={link} className="feature-card">
      <div className="feature">
        <h3 className="feature-title">{title}</h3>
        <p className="feature-description">{description}</p>
      </div>
    </Link>
  );
}

function Community() {
  return (
    <div className="community">
      <h2 className="section-title">Community</h2>
      <p className="section-description">
        Join the Sui Mind community for updates and collaboration.
      </p>
      <div className="social-icons">
        <a
          href="https://x.com/Sui__Mind"
          target="_blank"
          rel="noreferrer"
          className="social-icon"
        >
          Follow us on
          <img src="/X logo.png" alt="X Logo" className="x-logo" />
        </a>
      </div>
    </div>
  );
}

function Contact() {
  return (
    <div id="contact" className="contact">
      <h2 className="section-title">Contact Us</h2>
      <p className="section-description">
        We'd love to hear from you. Fill out the form below to get in touch!
      </p>
      <form
        id="contactForm"
        action="contact.php"
        method="POST"
        className="contact-form"
      >
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          required
          className="form-input"
        />
        <textarea
          name="message"
          placeholder="Your Message"
          required
          className="form-textarea"
        />
        <button type="submit" className="submit-button">
          Send
        </button>
      </form>
    </div>
  );
}
