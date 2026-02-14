'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  CreditCard,
  Zap,
  Shield,
  Wallet,
  ArrowLeftRight,
  Check,
  ExternalLink,
  Crown,
} from 'lucide-react'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlanTier = 'free' | 'pro' | 'enterprise'

interface PlanInfo {
  tier: PlanTier
  name: string
  walletsLimit: number
  transactionsLimit: number
  priceMonthly: number
}

interface UsageInfo {
  walletsUsed: number
  transactionsUsed: number
}

interface BillingData {
  plan: PlanInfo
  usage: UsageInfo
  hasStripeCustomer: boolean
}

// ---------------------------------------------------------------------------
// Plan definitions (mirrors server-side constants)
// ---------------------------------------------------------------------------

const PLANS: Record<PlanTier, PlanInfo> = {
  free: {
    tier: 'free',
    name: 'Free',
    walletsLimit: 100,
    transactionsLimit: 1_000,
    priceMonthly: 0,
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    walletsLimit: 1_000,
    transactionsLimit: 50_000,
    priceMonthly: 49,
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    walletsLimit: Infinity,
    transactionsLimit: Infinity,
    priceMonthly: 499,
  },
}

const PLAN_FEATURES: Record<PlanTier, string[]> = {
  free: [
    'Up to 100 smart wallets',
    '1,000 transactions / month',
    'Community support',
    'Basic analytics',
  ],
  pro: [
    'Up to 1,000 smart wallets',
    '50,000 transactions / month',
    'Priority support',
    'Advanced analytics',
    'Webhook integrations',
    'Custom branding',
  ],
  enterprise: [
    'Unlimited smart wallets',
    'Unlimited transactions',
    'Dedicated support',
    'Full analytics suite',
    'SLA guarantees',
    'Custom integrations',
    'On-premise option',
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tierBadgeVariant(tier: PlanTier) {
  switch (tier) {
    case 'enterprise':
      return 'default' as const
    case 'pro':
      return 'secondary' as const
    default:
      return 'outline' as const
  }
}

function formatLimit(value: number): string {
  if (!isFinite(value)) return 'Unlimited'
  return value.toLocaleString()
}

function usagePercent(used: number, limit: number): number {
  if (!isFinite(limit) || limit === 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

function usageColor(percent: number): string {
  if (percent >= 90) return 'text-red-500'
  if (percent >= 75) return 'text-amber-500'
  return 'text-emerald-500'
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

function generateDemoBilling(): BillingData {
  return {
    plan: PLANS.free,
    usage: {
      walletsUsed: 23,
      transactionsUsed: 347,
    },
    hasStripeCustomer: false,
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<PlanTier | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchBillingData() {
      try {
        // In production this would call a /api/billing/status endpoint
        // For the MVP, fall back to demo data
        const res = await fetch('/api/stats')
        if (!res.ok) throw new Error('API error')
        const stats = await res.json()

        if (!cancelled) {
          setBilling({
            plan: PLANS.free,
            usage: {
              walletsUsed: stats.totalWallets ?? 23,
              transactionsUsed: stats.totalTransactions ?? 347,
            },
            hasStripeCustomer: false,
          })
        }
      } catch {
        if (!cancelled) {
          setBilling(generateDemoBilling())
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchBillingData()
    return () => {
      cancelled = true
    }
  }, [])

  // -- Handlers ---------------------------------------------------------------

  const handleUpgrade = async (tier: PlanTier) => {
    const plan = PLANS[tier]
    if (!plan || tier === 'free') return

    setCheckoutLoading(tier)
    try {
      const priceIdEnvMap: Record<string, string | undefined> = {
        pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
        enterprise: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
      }

      const priceId = priceIdEnvMap[tier]
      if (!priceId) {
        toast.error('Stripe is not configured for this plan yet.')
        return
      }

      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed')

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Checkout failed'
      toast.error(message)
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleManageBilling = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Portal creation failed')

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open billing portal'
      toast.error(message)
    } finally {
      setPortalLoading(false)
    }
  }

  // -- Loading state ----------------------------------------------------------

  if (isLoading || !billing) {
    return <BillingSkeleton />
  }

  const { plan, usage } = billing

  const walletPercent = usagePercent(usage.walletsUsed, plan.walletsLimit)
  const txPercent = usagePercent(usage.transactionsUsed, plan.transactionsLimit)

  // -- Render -----------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Billing</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Manage your subscription plan and monitor usage
        </p>
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                {plan.tier === 'enterprise' ? (
                  <Crown className="h-5 w-5 text-primary" />
                ) : plan.tier === 'pro' ? (
                  <Zap className="h-5 w-5 text-primary" />
                ) : (
                  <Shield className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Plan
                  <Badge variant={tierBadgeVariant(plan.tier)}>
                    {plan.name}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {plan.priceMonthly === 0
                    ? 'Free forever'
                    : `$${plan.priceMonthly}/month`}
                </CardDescription>
              </div>
            </div>
            {billing.hasStripeCustomer && (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={portalLoading}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {portalLoading ? 'Opening...' : 'Manage Billing'}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Usage: Wallets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Smart Wallets</span>
              </div>
              <span className={usageColor(walletPercent)}>
                {usage.walletsUsed.toLocaleString()} / {formatLimit(plan.walletsLimit)}
              </span>
            </div>
            <Progress value={walletPercent} />
            <p className="text-xs text-muted-foreground">
              {walletPercent}% of your wallet limit used
            </p>
          </div>

          {/* Usage: Transactions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Transactions this month</span>
              </div>
              <span className={usageColor(txPercent)}>
                {usage.transactionsUsed.toLocaleString()} / {formatLimit(plan.transactionsLimit)}
              </span>
            </div>
            <Progress value={txPercent} />
            <p className="text-xs text-muted-foreground">
              {txPercent}% of your monthly transaction limit used
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(PLANS) as PlanTier[]).map((tier) => {
            const p = PLANS[tier]
            const isCurrentPlan = tier === plan.tier
            const features = PLAN_FEATURES[tier]

            return (
              <Card
                key={tier}
                className={
                  isCurrentPlan
                    ? 'border-primary shadow-md'
                    : ''
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    {isCurrentPlan && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {p.priceMonthly === 0 ? (
                      <span className="text-2xl font-bold text-foreground">Free</span>
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-foreground">
                          ${p.priceMonthly}
                        </span>
                        <span className="text-muted-foreground"> / month</span>
                      </>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <Separator className="mb-4" />
                  <ul className="space-y-2">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : tier === 'free' ? (
                    <Button variant="outline" className="w-full" disabled>
                      Default Plan
                    </Button>
                  ) : tier === 'enterprise' ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleUpgrade('enterprise')}
                      disabled={checkoutLoading === 'enterprise'}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      {checkoutLoading === 'enterprise'
                        ? 'Redirecting...'
                        : 'Contact Sales'}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(tier)}
                      disabled={checkoutLoading === tier}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {checkoutLoading === tier
                        ? 'Redirecting...'
                        : `Upgrade to ${p.name}`}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* FAQ / Info section */}
      <Card>
        <CardHeader>
          <CardTitle>Billing FAQ</CardTitle>
          <CardDescription>Common questions about plans and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">When does my billing cycle reset?</p>
            <p className="text-sm text-muted-foreground">
              Transaction limits reset on the first day of each calendar month. Wallet
              limits are cumulative and do not reset.
            </p>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium">Can I downgrade my plan?</p>
            <p className="text-sm text-muted-foreground">
              Yes. You can downgrade at any time through the Stripe billing portal. The
              change takes effect at the end of your current billing period.
            </p>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium">What happens if I exceed my limits?</p>
            <p className="text-sm text-muted-foreground">
              API requests that exceed your plan limits will receive a 429 rate-limit
              response. Upgrade your plan to increase limits immediately.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function BillingSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-72 mt-2" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-3 w-40" />
          </div>
        </CardContent>
      </Card>
      <div>
        <Skeleton className="h-7 w-36 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-20 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-px w-full mb-4" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
