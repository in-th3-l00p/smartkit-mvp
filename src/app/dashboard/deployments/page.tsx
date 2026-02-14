'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Box, CheckCircle, XCircle, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export default function DeploymentsPage() {
  const deployments = useQuery(api.deployments.getAllDeployments)
  const isLoading = deployments === undefined

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success('Address copied!')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deployments</h1>
        <p className="text-muted-foreground mt-1">Contract deployment records across all chains</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Deployed Contracts</CardTitle>
          </div>
          <CardDescription>
            Smart contracts deployed as part of SmartKit infrastructure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Chain ID</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Tx Hash</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(deployments ?? []).map((d) => (
                <TableRow key={d._id}>
                  <TableCell className="font-medium">{d.contractName}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {d.address.slice(0, 6)}...{d.address.slice(-4)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{d.chainId}</Badge>
                  </TableCell>
                  <TableCell>
                    {d.verified ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {d.txHash ? `${d.txHash.slice(0, 8)}...${d.txHash.slice(-6)}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => copyAddress(d.address)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(deployments ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No deployment records yet. Run the seed script to import existing deployments.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
