import { ConnectButton } from '@rainbow-me/rainbowkit'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export default function ConnectWalletScreen() {
  return (
    <div className="noise-overlay min-h-screen bg-cream">
      <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-2.5 h-2.5 bg-red-mica shrink-0" />
            <p className="font-mono text-[10px] tracking-[0.3em] text-gray-500">Use Mica</p>
          </div>

          <h1 className="font-display font-extralight text-3xl md:text-4xl text-gray-900 mb-3 leading-tight">
            Connect your wallet
          </h1>
          <p className="font-mono text-sm text-gray-600 leading-relaxed mb-10">
            Your wallet is your identity. Connect to access the mica dashboard,
            manage API keys, and subscribe to a plan.
          </p>

          <div className="space-y-6">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] text-gray-500 uppercase mb-3">
                EVM &mdash; Ethereum &middot; Base
              </p>
              <ConnectButton label="Connect EVM wallet" showBalance={false} />
            </div>

            <div className="border-t border-dashed border-[var(--gray-border)] pt-6">
              <p className="font-mono text-[10px] tracking-[0.22em] text-gray-500 uppercase mb-3">
                Solana
              </p>
              <WalletMultiButton />
            </div>
          </div>

          <p className="font-mono text-[11px] text-gray-400 mt-8 text-center leading-relaxed">
            By connecting, you agree to sign a message to verify ownership.
            <br />No gas fees for authentication.
          </p>
        </div>
      </div>
    </div>
  )
}
