'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Filter, RefreshCw } from "lucide-react"

type LogEntry = {
  id: string
  timestamp: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  statusCode: number
  duration: number
  apiKeyPrefix: string
}

const mockLogs: LogEntry[] = [
  {
    id: 'log_001',
    timestamp: new Date(Date.now() - 15000).toISOString(),
    method: 'POST',
    path: '/api/wallets/create',
    statusCode: 201,
    duration: 342,
    apiKeyPrefix: 'sk_live_7Hx...',
  },
  {
    id: 'log_002',
    timestamp: new Date(Date.now() - 45000).toISOString(),
    method: 'POST',
    path: '/api/transactions/send',
    statusCode: 200,
    duration: 1247,
    apiKeyPrefix: 'sk_live_7Hx...',
  },
  {
    id: 'log_003',
    timestamp: new Date(Date.now() - 72000).toISOString(),
    method: 'GET',
    path: '/api/wallets/0x71C7...976F',
    statusCode: 200,
    duration: 89,
    apiKeyPrefix: 'sk_test_3Qp...',
  },
  {
    id: 'log_004',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    method: 'POST',
    path: '/api/transactions/send',
    statusCode: 400,
    duration: 52,
    apiKeyPrefix: 'sk_test_3Qp...',
  },
  {
    id: 'log_005',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    method: 'GET',
    path: '/api/transactions/0x3a4b...3a4b',
    statusCode: 200,
    duration: 134,
    apiKeyPrefix: 'sk_live_7Hx...',
  },
  {
    id: 'log_006',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    method: 'GET',
    path: '/api/stats',
    statusCode: 200,
    duration: 67,
    apiKeyPrefix: 'sk_live_7Hx...',
  },
  {
    id: 'log_007',
    timestamp: new Date(Date.now() - 310000).toISOString(),
    method: 'POST',
    path: '/api/wallets/create',
    statusCode: 500,
    duration: 2103,
    apiKeyPrefix: 'sk_live_7Hx...',
  },
  {
    id: 'log_008',
    timestamp: new Date(Date.now() - 420000).toISOString(),
    method: 'GET',
    path: '/api/wallets',
    statusCode: 200,
    duration: 156,
    apiKeyPrefix: 'sk_test_3Qp...',
  },
  {
    id: 'log_009',
    timestamp: new Date(Date.now() - 480000).toISOString(),
    method: 'POST',
    path: '/api/transactions/send',
    statusCode: 429,
    duration: 12,
    apiKeyPrefix: 'sk_test_3Qp...',
  },
  {
    id: 'log_010',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    method: 'GET',
    path: '/api/transactions',
    statusCode: 200,
    duration: 203,
    apiKeyPrefix: 'sk_live_7Hx...',
  },
  {
    id: 'log_011',
    timestamp: new Date(Date.now() - 720000).toISOString(),
    method: 'POST',
    path: '/api/wallets/create',
    statusCode: 201,
    duration: 389,
    apiKeyPrefix: 'sk_live_7Hx...',
  },
  {
    id: 'log_012',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    method: 'GET',
    path: '/api/wallets/0xdAC1...1ec7',
    statusCode: 404,
    duration: 43,
    apiKeyPrefix: 'sk_test_3Qp...',
  },
]

function getStatusBadge(statusCode: number) {
  if (statusCode >= 200 && statusCode < 300) {
    return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{statusCode}</Badge>
  }
  if (statusCode >= 400 && statusCode < 500) {
    return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">{statusCode}</Badge>
  }
  return <Badge variant="destructive">{statusCode}</Badge>
}

function getMethodBadge(method: string) {
  const styles: Record<string, string> = {
    GET: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    POST: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    PUT: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    DELETE: 'bg-red-500/10 text-red-600 border-red-500/20',
  }
  return (
    <Badge className={styles[method] || 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20'}>
      {method}
    </Badge>
  )
}

function formatTimestamp(iso: string) {
  const date = new Date(iso)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

type StatusFilter = 'all' | 'success' | 'error'

export default function LogsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())

  const filteredLogs = mockLogs.filter((log) => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'success') return log.statusCode >= 200 && log.statusCode < 400
    if (statusFilter === 'error') return log.statusCode >= 400
    return true
  })

  const refresh = useCallback(() => {
    setLastRefreshed(new Date())
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, refresh])

  const successCount = mockLogs.filter((l) => l.statusCode >= 200 && l.statusCode < 400).length
  const errorCount = mockLogs.filter((l) => l.statusCode >= 400).length
  const avgDuration = Math.round(mockLogs.reduce((sum, l) => sum + l.duration, 0) / mockLogs.length)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Request Logs</h1>
          <p className="text-muted-foreground mt-1">Monitor API requests in real time</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refreshing' : 'Auto-refresh'}
          </Button>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockLogs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In the last hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success / Error</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <span className="text-emerald-600">{successCount}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="text-red-500">{errorCount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((successCount / mockLogs.length) * 100).toFixed(0)}% success rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Duration</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatDuration(avgDuration)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all endpoints</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Requests</CardTitle>
              <CardDescription>
                Last refreshed at {lastRefreshed.toLocaleTimeString()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Errors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>API Key</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell>{getMethodBadge(log.method)}</TableCell>
                  <TableCell className="font-mono text-sm">{log.path}</TableCell>
                  <TableCell>{getStatusBadge(log.statusCode)}</TableCell>
                  <TableCell>
                    <span className={`text-sm ${log.duration > 1000 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                      {formatDuration(log.duration)}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.apiKeyPrefix}
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No requests match the current filter.
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
