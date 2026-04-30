import { WagmiProvider, createConfig, http } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { ReactNode } from "react";

const config = createConfig(
  getDefaultConfig({
    // Your WalletConnect Project ID
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "static-id",
    appName: "Defi Sentinel",
    chains: [polygon, polygonAmoy],
    transports: {
      [polygon.id]: http(),
      [polygonAmoy.id]: http(),
    },
  })
);

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
