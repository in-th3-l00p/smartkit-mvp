'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
export interface Transaction {
  id: string
  txHash: string
  userOpHash: string
  walletAddress: string
  to: string
  status: string
  gasSponsored: boolean
  gasCost: string | null
  createdAt: string
}

interface TransactionTableProps {
  transactions: Transaction[]
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  success: "default",
  pending: "outline",
  submitted: "secondary",
  failed: "destructive",
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions yet
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Hash</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Gas</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell className="font-mono text-xs">
              {(tx.txHash || tx.userOpHash).slice(0, 10)}...
            </TableCell>
            <TableCell className="font-mono text-xs">
              {tx.walletAddress.slice(0, 6)}...{tx.walletAddress.slice(-4)}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
            </TableCell>
            <TableCell>
              <Badge variant={statusVariants[tx.status] || "outline"}>
                {tx.status}
              </Badge>
            </TableCell>
            <TableCell>
              {tx.gasSponsored ? (
                <span className="text-green-600 text-xs font-medium">Sponsored</span>
              ) : (
                <span className="text-xs">{tx.gasCost || '-'} ETH</span>
              )}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {new Date(tx.createdAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
