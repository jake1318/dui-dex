/**
 * @file src/App.tsx
 * Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-01-26 23:29:01
 * Current User's Login: jake1318
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { Home } from "./home";
import { SwapInterface } from "./SwapInterface";
import { OrderBookInterface } from "./orderbookinterface";
import { Search } from "./search";
import MindExchangePage from "./mindmarket";
import { PageLayout } from "./pagelayout";
import {
  WalletProvider,
  SuiClientProvider,
  createNetworkConfig,
  useInitializedSuiClient,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui.js/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initializeDeepBook, isDeepBookInitialized } from "./deepbook";
import { Notification } from "./notification";

// Create a new query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Define network configuration
const { networkConfig } = createNetworkConfig({
  mainnet: { url: getFullnodeUrl("mainnet") },
  testnet: { url: getFullnodeUrl("testnet") },
  devnet: { url: getFullnodeUrl("devnet") },
  localnet: { url: "http://127.0.0.1:9000" },
});

// DeepBook initialization component
function DeepBookInitializer() {
  const client = useInitializedSuiClient();
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  useEffect(() => {
    const initialize = async () => {
      if (!client || isDeepBookInitialized()) return;

      try {
        const success = await initializeDeepBook(client);
        if (!success) {
          setInitializationError(
            "Failed to initialize DeepBook. Please try again later."
          );
        }
      } catch (error) {
        console.error("DeepBook initialization error:", error);
        setInitializationError(
          error instanceof Error
            ? error.message
            : "Failed to initialize DeepBook"
        );
      }
    };

    initialize();
  }, [client]);

  if (initializationError) {
    return (
      <Notification
        message={initializationError}
        type="error"
        duration={5000}
        onClose={() => setInitializationError(null)}
      />
    );
  }

  return null;
}

// Main App component with error boundary
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig}>
        <WalletProvider preferredWallets={["Sui Wallet"]}>
          <Router>
            <div className="app-container">
              {/* DeepBook Initializer */}
              <DeepBookInitializer />

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

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export wrapped App with error boundary
export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
