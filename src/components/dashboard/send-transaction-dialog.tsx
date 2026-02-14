'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface SendTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  walletAddress?: string
}

export function SendTransactionDialog({ open, onOpenChange, walletAddress }: SendTransactionDialogProps) {
  const [to, setTo] = useState('')
  const [value, setValue] = useState('0')
  const [data, setData] = useState('0x')
  const [fromAddress, setFromAddress] = useState(walletAddress || '')
  const [isLoading, setIsLoading] = useState(false)
  const handleSend = async () => {
    if (!fromAddress || !to) {
      toast.error('Please fill in required fields')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: fromAddress,
          to,
          value,
          data,
          sponsored: true,
        }),
      })
      const tx = await res.json()

      if (!res.ok) throw new Error(tx.error)

      toast.success('Transaction submitted!', {
        description: `UserOp: ${tx.userOpHash.slice(0, 10)}...`,
      })
      setTo('')
      setValue('0')
      setData('0x')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to send transaction')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Transaction</DialogTitle>
          <DialogDescription>
            Send a gasless transaction from a smart wallet. Gas will be sponsored.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!walletAddress && (
            <div className="space-y-2">
              <Label htmlFor="from">From Wallet</Label>
              <Input
                id="from"
                placeholder="0x..."
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="to">To Address</Label>
            <Input
              id="to"
              placeholder="0x..."
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Value (wei)</Label>
            <Input
              id="value"
              placeholder="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              placeholder="0x"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
