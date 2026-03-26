import { useMemo } from 'react'
import { WagmiProvider, http } from 'wagmi'
import { mainnet, base } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig, lightTheme } from '@rainbow-me/rainbowkit'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import '@rainbow-me/rainbowkit/styles.css'
import '@solana/wallet-adapter-react-ui/styles.css'

const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'placeholder_project_id'
const SOLANA_RPC = import.meta.env.VITE_SOLANA_RPC || 'https://api.mainnet-beta.solana.com'

const wagmiConfig = getDefaultConfig({
  appName: 'Mica Energy',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [mainnet, base],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
  },
})

const queryClient = new QueryClient()

export default function WalletProviders({ children }) {
  const solanaWallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  )

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: '#FF0032',
            accentColorForeground: '#fff',
            borderRadius: 'small',
          })}
        >
          <ConnectionProvider endpoint={SOLANA_RPC}>
            <WalletProvider wallets={solanaWallets} autoConnect>
              <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
