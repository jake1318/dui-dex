/**
 * @file src/App.tsx
 * Last updated: 2025-01-24 23:00:49
 * Author: jake1318
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./navbar";
import { Footer } from "./footer"; // Ensure the path matches your file structure
import { Home } from "./home"; // Ensure the Home component is correctly implemented
import { SwapInterface } from "./SwapInterface";
import { OrderBookInterface } from "./orderbookinterface";
import { Search } from "./search";
import MindExchangePage from "./mindmarket";
import { PageLayout } from "./pagelayout";
import {
  WalletProvider,
  SuiClientProvider,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui.js/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a new query client
const queryClient = new QueryClient();

// Define network configuration
const { networkConfig } = createNetworkConfig({
  mainnet: { url: getFullnodeUrl("mainnet") },
  testnet: { url: getFullnodeUrl("testnet") },
  devnet: { url: getFullnodeUrl("devnet") },
  localnet: { url: "http://127.0.0.1:9000" },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig}>
        <WalletProvider preferredWallets={["Sui Wallet"]}>
          <Router>
            <div className="app-container">
              {/* Navbar appears on all pages */}
              <Navbar />
              <main className="main-content">
                <Routes>
                  {/* Use fullWidth for hero-style pages */}
                  <Route
                    path="/"
                    element={
                      <PageLayout fullWidth>
                        <Home />
                      </PageLayout>
                    }
                  />
                  <Route
                    path="/home"
                    element={
                      <PageLayout fullWidth>
                        <Home />
                      </PageLayout>
                    }
                  />
                  <Route
                    path="/mind-swap"
                    element={
                      <PageLayout>
                        <SwapInterface />
                      </PageLayout>
                    }
                  />
                  <Route
                    path="/orderbook"
                    element={
                      <PageLayout fullWidth>
                        <OrderBookInterface />
                      </PageLayout>
                    }
                  />
                  <Route
                    path="/mind-search"
                    element={
                      <PageLayout>
                        <Search />
                      </PageLayout>
                    }
                  />
                  <Route
                    path="/mind-exchange"
                    element={
                      <PageLayout>
                        <MindExchangePage />
                      </PageLayout>
                    }
                  />
                </Routes>
              </main>
              {/* Footer appears on all pages */}
              <Footer />
            </div>
          </Router>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;
