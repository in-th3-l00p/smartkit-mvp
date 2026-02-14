'use client'

import { useEffect, useState } from 'react'
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Send, Copy, ExternalLink } from "lucide-react"
import { TransactionTable } from "@/components/dashboard/transaction-table"
import { SendTransactionDialog } from "@/components/dashboard/send-transaction-dialog"
import { toast } from "sonner"
import type { Wallet, Transaction } from "@/store/dashboard-store"

export default function WalletDetailPage() {
  const params = useParams()
  const address = params.address as string
  const [wallet, setWallet] = useState<(Wallet & { transactions: Transaction[] }) | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sendOpen, setSendOpen] = useState(false)

  useEffect(() => {
    async function fetchWallet() {
      try {
        const res = await fetch(`/api/wallets/${address}`)
        if (res.ok) {
          setWallet(await res.json())
        }
      } catch (error) {
        console.error('Failed to fetch wallet:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchWallet()
  }, [address])

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    toast.success('Address copied!')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Wallet not found</p>
        <Link href="/dashboard/wallets">
          <Button variant="outline" className="mt-4">Back to Wallets</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/wallets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wallet Details</h1>
          <div className="flex items-center gap-2 mt-2">
            <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{wallet.address}</code>
            <Button variant="ghost" size="sm" onClick={copyAddress}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <Button onClick={() => setSendOpen(true)}>
          <Send className="h-4 w-4 mr-2" /> Send Transaction
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={wallet.deployed ? "default" : "secondary"} className="text-base">
              {wallet.deployed ? "Deployed" : "Counterfactual"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{wallet.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{new Date(wallet.createdAt).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>{wallet.transactions?.length || 0} transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionTable transactions={wallet.transactions || []} />
        </CardContent>
      </Card>

      <SendTransactionDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        walletAddress={wallet.address}
      />
    </div>
  )
}
