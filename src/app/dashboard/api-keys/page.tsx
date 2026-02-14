'use client'

import { useState } from 'react'
import { useDashboard } from "@/hooks/use-dashboard"
import { useProject } from "@/hooks/use-project"
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Copy, Key } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export default function ApiKeysPage() {
  const { apiKeys, isLoading } = useDashboard()
  const { projectId } = useProject()
  const createApiKeyAuthed = useMutation(api.apiKeys.createApiKeyAuthed)
  const [createOpen, setCreateOpen] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('API key copied!')
  }

  const handleCreate = async () => {
    if (!keyName) {
      toast.error('Please enter a name')
      return
    }
    if (!projectId) return
    setIsCreating(true)
    try {
      const rawKey = `sk_live_${crypto.randomUUID().replace(/-/g, '')}`
      const keyPrefix = rawKey.slice(0, 12)

      const encoder = new TextEncoder()
      const data = encoder.encode(rawKey)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      await createApiKeyAuthed({
        projectId,
        keyHash,
        keyPrefix,
        name: keyName,
      })

      setNewlyCreatedKey(rawKey)
      toast.success('API key created!', { description: 'Make sure to copy your key now.' })
      setKeyName('')
      setCreateOpen(false)
    } catch {
      toast.error('Failed to create API key')
    } finally {
      setIsCreating(false)
    }
  }

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
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">Manage your SmartKit API keys</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Key
        </Button>
      </div>

      {newlyCreatedKey && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Your new API key (copy it now, it won&apos;t be shown again):</p>
                <p className="font-mono text-sm mt-1 break-all">{newlyCreatedKey}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { copyKey(newlyCreatedKey); setNewlyCreatedKey(null) }}>
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Use these keys to authenticate with the SmartKit API. Keep them secret!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key Prefix</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      {apiKey.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {apiKey.key}{'*'.repeat(20)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{apiKey.requestCount}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(apiKey.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : 'Never'}
                  </TableCell>
                </TableRow>
              ))}
              {apiKeys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No API keys yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>Create a new API key for authenticating with SmartKit.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="keyName">Key Name</Label>
            <Input
              id="keyName"
              placeholder="e.g., Production, Development"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
