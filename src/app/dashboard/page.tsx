'use client'

import { useDashboard } from "@/hooks/use-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Wallet, ArrowLeftRight, Zap, TrendingUp } from "lucide-react"
import { TransactionTable } from "@/components/dashboard/transaction-table"

export default function DashboardPage() {
  const { stats, transactions, wallets, isLoading } = useDashboard()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const recentTxs = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor your smart wallets and transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Wallets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalWallets}</div>
            <p className="text-xs text-muted-foreground mt-1">Smart contract wallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingTxs > 0 && <Badge variant="outline" className="mr-1">{stats.pendingTxs} pending</Badge>}
              {stats.successRate}% success rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gas Sponsored</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalGasSponsored} ETH</div>
            <p className="text-xs text-muted-foreground mt-1">Total gas covered for users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.successfulTxs} successful, {stats.failedTxs} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest transaction activity across all wallets</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionTable transactions={recentTxs} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Wallets</CardTitle>
            <CardDescription>Newly created smart wallets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {wallets.slice(0, 5).map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</p>
                    <p className="text-xs text-muted-foreground">{wallet.email}</p>
                  </div>
                  <Badge variant={wallet.deployed ? "default" : "secondary"}>
                    {wallet.deployed ? "Deployed" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72 mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-32 mt-2" /></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2"><CardContent className="pt-6"><Skeleton className="h-64" /></CardContent></Card>
        <Card><CardContent className="pt-6"><Skeleton className="h-64" /></CardContent></Card>
      </div>
    </div>
  )
}
