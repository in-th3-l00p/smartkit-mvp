'use client'

import { useState } from 'react'
import { useDashboard } from "@/hooks/use-dashboard"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { TransactionTable } from "@/components/dashboard/transaction-table"
import { SendTransactionDialog } from "@/components/dashboard/send-transaction-dialog"
import { Skeleton } from "@/components/ui/skeleton"

export default function TransactionsPage() {
  const { transactions, isLoading } = useDashboard()
  const [search, setSearch] = useState('')
  const [sendOpen, setSendOpen] = useState(false)

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const filtered = sorted.filter(
    (tx) =>
      tx.userOpHash.toLowerCase().includes(search.toLowerCase()) ||
      tx.txHash?.toLowerCase().includes(search.toLowerCase()) ||
      tx.walletAddress.toLowerCase().includes(search.toLowerCase()) ||
      tx.to.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">View and manage all UserOperations</p>
        </div>
        <Button onClick={() => setSendOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Send Transaction
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by hash, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <TransactionTable transactions={filtered} />
        </CardContent>
      </Card>

      <SendTransactionDialog open={sendOpen} onOpenChange={setSendOpen} />
    </div>
  )
}
