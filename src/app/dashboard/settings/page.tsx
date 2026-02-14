'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Settings, Globe, Key, Bell, Plus, Trash2, Save, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { config } from '@/lib/config'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WebhookEntry {
  id: string
  url: string
}

// ---------------------------------------------------------------------------
// Settings Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  // -- Project name state ---------------------------------------------------
  const [projectName, setProjectName] = useState('My SmartKit Project')
  const [isSavingName, setIsSavingName] = useState(false)

  // -- Webhook state --------------------------------------------------------
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([])
  const [newWebhookUrl, setNewWebhookUrl] = useState('')

  // -- Handlers: project name -----------------------------------------------

  const handleSaveProjectName = async () => {
    if (!projectName.trim()) {
      toast.error('Project name cannot be empty')
      return
    }
    setIsSavingName(true)
    try {
      // TODO: wire up to PATCH /api/project endpoint
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('Project name updated')
    } catch {
      toast.error('Failed to update project name')
    } finally {
      setIsSavingName(false)
    }
  }

  // -- Handlers: webhooks ---------------------------------------------------

  const handleAddWebhook = () => {
    const trimmed = newWebhookUrl.trim()
    if (!trimmed) {
      toast.error('Please enter a webhook URL')
      return
    }
    try {
      new URL(trimmed)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }
    if (webhooks.some((w) => w.url === trimmed)) {
      toast.error('This webhook URL is already registered')
      return
    }
    setWebhooks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), url: trimmed },
    ])
    setNewWebhookUrl('')
    toast.success('Webhook URL added')
  }

  const handleRemoveWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id))
    toast.success('Webhook URL removed')
  }

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success('Copied to clipboard')
  }

  // -- Render ---------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Manage your project configuration and integrations
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Project Name */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Project Name</CardTitle>
          </div>
          <CardDescription>
            The display name used to identify this project in the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="projectName">Name</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <Button onClick={handleSaveProjectName} disabled={isSavingName}>
              <Save className="h-4 w-4 mr-2" />
              {isSavingName ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Webhook URLs */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Webhook URLs</CardTitle>
          </div>
          <CardDescription>
            Register endpoints to receive real-time notifications for wallet and
            transaction events. Payloads are signed with HMAC-SHA256.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new webhook */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="webhookUrl">New Webhook URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhooks/smartkit"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddWebhook()
                }}
              />
            </div>
            <Button onClick={handleAddWebhook}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <Separator />

          {/* Registered webhooks list */}
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No webhook URLs registered yet. Add one above to start receiving
              event notifications.
            </div>
          ) : (
            <div className="space-y-2">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <span className="text-sm font-mono truncate mr-4">
                    {webhook.url}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveWebhook(webhook.id)}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Environment Info */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Environment</CardTitle>
          </div>
          <CardDescription>
            Current chain configuration and deployed contract addresses.
            These values are read-only and determined by your environment
            variables.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chain */}
            <div className="space-y-1">
              <Label className="text-muted-foreground">Chain</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {config.chain.name}
                </span>
                <Badge variant="secondary">ID {config.chain.id}</Badge>
              </div>
            </div>

            {/* RPC URL */}
            <div className="space-y-1">
              <Label className="text-muted-foreground">RPC URL</Label>
              <p className="text-sm font-mono truncate">{config.rpcUrl}</p>
            </div>

            {/* EntryPoint */}
            <div className="space-y-1">
              <Label className="text-muted-foreground">
                EntryPoint (ERC-4337)
              </Label>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono truncate">
                  {config.entryPointAddress}
                </p>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleCopyAddress(config.entryPointAddress)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Factory */}
            <div className="space-y-1">
              <Label className="text-muted-foreground">Factory Address</Label>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono truncate">
                  {config.factoryAddress}
                </p>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleCopyAddress(config.factoryAddress)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Paymaster */}
            <div className="space-y-1">
              <Label className="text-muted-foreground">Paymaster Address</Label>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono truncate">
                  {config.paymasterAddress}
                </p>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleCopyAddress(config.paymasterAddress)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
