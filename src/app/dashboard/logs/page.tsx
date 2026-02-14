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
  method: string
  path: string
  statusCode: number
  duration: number
  apiKeyPrefix: string
}

type LogStats = {
  total: number
  successCount: number
  errorCount: number
  avgDuration: number
}

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
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<LogStats>({ total: 0, successCount: 0, errorCount: 0, avgDuration: 0 })
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setStats(data.stats)
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
    setLastRefreshed(new Date())
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchLogs])

  const filteredLogs = logs.filter((log) => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'success') return log.statusCode >= 200 && log.statusCode < 400
    if (statusFilter === 'error') return log.statusCode >= 400
    return true
  })

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
          <Button variant="outline" size="sm" onClick={fetchLogs}>
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
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success / Error</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <span className="text-emerald-600">{stats.successCount}</span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="text-red-500">{stats.errorCount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0
                ? `${((stats.successCount / stats.total) * 100).toFixed(0)}% success rate`
                : 'No data yet'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Duration</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatDuration(stats.avgDuration)}</div>
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
          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Loading logs...
            </div>
          ) : (
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
                      {logs.length === 0
                        ? 'No request logs yet. Logs will appear when API requests are made.'
                        : 'No requests match the current filter.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
