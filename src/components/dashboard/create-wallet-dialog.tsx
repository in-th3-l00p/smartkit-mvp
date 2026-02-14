'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useDashboardStore } from "@/store/dashboard-store"

interface CreateWalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWalletDialog({ open, onOpenChange }: CreateWalletDialogProps) {
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const addWallet = useDashboardStore((s) => s.addWallet)

  const handleCreate = async () => {
    if (!email || !userId) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/wallets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      })
      const wallet = await res.json()

      if (!res.ok) throw new Error(wallet.error)

      addWallet(wallet)
      toast.success('Wallet created!', {
        description: `Address: ${wallet.address.slice(0, 10)}...`,
      })
      setEmail('')
      setUserId('')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to create wallet')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Smart Wallet</DialogTitle>
          <DialogDescription>
            Create a new ERC-4337 smart contract wallet. The address is deterministic and deployment is lazy.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              placeholder="user_123"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Wallet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
