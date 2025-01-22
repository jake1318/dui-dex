import { ConnectButton, SuiClientProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SwapInterface } from "./SwapInterface";
import { OrderbookInterface } from "./orderbookinterface"; // Add this import
import { Navigation } from "./navigation";

const queryClient = new QueryClient();

const networks = {
  mainnet: {
    url: getFullnodeUrl("mainnet"),
  },
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="mainnet">
        <WalletProvider>
          <Router>
            <div className="w-full min-h-screen bg-gray-900 text-white p-4">
              <div className="container mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <Navigation />
                  <ConnectButton />
                </div>
                <Routes>
                  <Route path="/" element={<SwapInterface />} />
                  <Route path="/trade" element={<OrderbookInterface />} />{" "}
                  {/* Add this route */}
                </Routes>
              </div>
            </div>
          </Router>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;
