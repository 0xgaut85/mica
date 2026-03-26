import { PLANS } from './useAppStore'

export default function BillingSection({ subscription }) {
  if (!subscription) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="w-2 h-2 bg-red-mica shrink-0" />
          <p className="font-mono text-[10px] tracking-[0.25em] text-gray-500 uppercase">Billing</p>
        </div>
        <p className="font-mono text-[11px] text-gray-400">No active subscription.</p>
      </div>
    )
  }

  const plan = PLANS[subscription.plan]
  const validUntil = new Date(subscription.validUntil)
  const now = new Date()
  const daysLeft = Math.max(0, Math.ceil((validUntil - now) / (1000 * 60 * 60 * 24)))
  const isExpiring = daysLeft <= 5

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="w-2 h-2 bg-red-mica shrink-0" />
        <p className="font-mono text-[10px] tracking-[0.25em] text-gray-500 uppercase">Billing</p>
      </div>

      <div className="border border-dashed border-[var(--gray-border)] bg-white/40 p-5 space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="font-mono text-[10px] tracking-[0.15em] text-gray-500 uppercase">Plan</span>
          <span className="font-display font-light text-gray-900">{plan?.name}</span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className="font-mono text-[10px] tracking-[0.15em] text-gray-500 uppercase">Status</span>
          <span className={`font-mono text-[11px] ${isExpiring ? 'text-red-mica' : 'text-green-700'}`}>
            {daysLeft > 0 ? 'Active' : 'Expired'}
          </span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className="font-mono text-[10px] tracking-[0.15em] text-gray-500 uppercase">Valid until</span>
          <span className="font-mono text-[11px] text-gray-700">{validUntil.toLocaleDateString()}</span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className="font-mono text-[10px] tracking-[0.15em] text-gray-500 uppercase">Days remaining</span>
          <span className={`font-mono text-[11px] ${isExpiring ? 'text-red-mica font-bold' : 'text-gray-700'}`}>
            {daysLeft}
          </span>
        </div>

        {subscription.asset && (
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[10px] tracking-[0.15em] text-gray-500 uppercase">Paid with</span>
            <span className="font-mono text-[11px] text-gray-700">{subscription.asset}</span>
          </div>
        )}

        {isExpiring && daysLeft > 0 && (
          <p className="font-mono text-[11px] text-red-mica pt-2 border-t border-dashed border-[var(--gray-border)]">
            Your subscription expires soon. Renew from the pricing section above.
          </p>
        )}
      </div>
    </div>
  )
}
