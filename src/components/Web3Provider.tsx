import { WagmiProvider, createConfig, http } from "wagmi";
import { base, baseSepolia } from "viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { ReactNode } from "react";

const config = createConfig(
  getDefaultConfig({
    // Your WalletConnect Project ID
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "static-id",
    appName: "Defi Sentinel",
    chains: [base, baseSepolia],
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
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
