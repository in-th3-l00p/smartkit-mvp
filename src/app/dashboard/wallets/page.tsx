'use client'

import { useState } from 'react'
import Link from "next/link"
import { useDashboard } from "@/hooks/use-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Plus, Search, ExternalLink } from "lucide-react"
import { CreateWalletDialog } from "@/components/dashboard/create-wallet-dialog"
import { Skeleton } from "@/components/ui/skeleton"

export default function WalletsPage() {
  const { wallets, isLoading } = useDashboard()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = wallets.filter(
    (w) =>
      w.address.toLowerCase().includes(search.toLowerCase()) ||
      w.email.toLowerCase().includes(search.toLowerCase()) ||
      w.userId.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallets</h1>
          <p className="text-muted-foreground mt-1">Manage smart contract wallets</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Wallet
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by address, email, or user ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-mono text-sm">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </TableCell>
                  <TableCell>{wallet.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{wallet.userId}</TableCell>
                  <TableCell>
                    <Badge variant={wallet.deployed ? "default" : "secondary"}>
                      {wallet.deployed ? "Deployed" : "Counterfactual"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(wallet.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/wallets/${wallet.address}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {search ? 'No wallets match your search' : 'No wallets created yet'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateWalletDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
