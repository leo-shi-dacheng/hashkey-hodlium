'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { hashkeyTestnet, hashkey } from 'wagmi/chains';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 创建React Query客户端
const queryClient = new QueryClient()

export const config = createConfig(getDefaultConfig({
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  appName: "HashKey Staking",
  appDescription: "HashKey staking",
  chains: [hashkey],
  transports: {
    [hashkey.id]: http(hashkey.rpcUrls.default.http[0]),
    // [hashkeyTestnet.id]: http(hashkeyTestnet.rpcUrls.default.http[0])
  },
  ssr: true,
  syncConnectedChain: true,
  batch: {
    multicall: false
  }
}))

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="auto" mode="dark">
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
      <ToastContainer position="top-right" autoClose={5000} />
    </WagmiProvider>
  );
}