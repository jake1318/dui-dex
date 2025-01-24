import { useState } from "react";
import "./mindmarket.css"; // Ensure you have this CSS file linked

// Define the Agent interface
interface Agent {
  id: number;
  name: string;
  description: string;
  price: string;
}

function MindExchangePage() {
  // Use the Agent type for selectedAgent, allowing null as the initial state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const agents: Agent[] = [
    {
      id: 1,
      name: "AI Assistant Pro",
      description: "An AI assistant for scheduling, reminders, and more.",
      price: "5 SUI/hour",
    },
    {
      id: 2,
      name: "Data Analyzer Bot",
      description: "Analyzes and visualizes complex datasets.",
      price: "10 SUI/hour",
    },
    {
      id: 3,
      name: "Creative Writer AI",
      description: "Generates articles, scripts, and creative content.",
      price: "7 SUI/hour",
    },
    {
      id: 4,
      name: "Code Review Guru",
      description:
        "Performs detailed code reviews and provides improvement suggestions.",
      price: "8 SUI/hour",
    },
  ];

  const handleHire = (agent: Agent) => {
    alert(`Hired ${agent.name} for ${agent.price}. Placeholder logic.`);
    setSelectedAgent(agent);
  };

  return (
    <div className="mind-exchange">
      <div className="exchange-container">
        <h1 className="title">Mind Exchange</h1>
        <p className="description">
          Select and hire from our marketplace of powerful AI agents.
        </p>
        <div className="agents-grid">
          {agents.map((agent) => (
            <div key={agent.id} className="agent-card">
              <h3>{agent.name}</h3>
              <p>{agent.description}</p>
              <p className="price">{agent.price}</p>
              <button className="hire-button" onClick={() => handleHire(agent)}>
                Hire Agent
              </button>
            </div>
          ))}
        </div>
        {selectedAgent && (
          <div className="selected-agent">
            <h2>Selected Agent:</h2>
            <p>{selectedAgent.name}</p>
            <p>{selectedAgent.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MindExchangePage;
