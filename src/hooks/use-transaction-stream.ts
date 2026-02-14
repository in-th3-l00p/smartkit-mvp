'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface TransactionUpdate {
  id: string
  userOpHash: string
  txHash: string | null
  status: 'success' | 'failed'
  gasCost: string | null
}

interface UseTransactionStreamOptions {
  apiKey: string
  apiUrl?: string
  walletAddress?: string
  onTransaction?: (tx: TransactionUpdate) => void
}

export function useTransactionStream({
  apiKey,
  apiUrl = '/api',
  walletAddress,
  onTransaction,
}: UseTransactionStreamOptions) {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<TransactionUpdate | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const connect = useCallback(() => {
    const params = new URLSearchParams()
    if (walletAddress) params.set('walletAddress', walletAddress)
    const url = `${apiUrl}/transactions/stream?${params.toString()}`

    // EventSource doesn't support custom headers, so we use fetch-based SSE
    const abortController = new AbortController()

    fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok || !response.body) {
          throw new Error('SSE connection failed')
        }

        setConnected(true)
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const block of lines) {
            const eventMatch = block.match(/event: (\w+)/)
            const dataMatch = block.match(/data: (.+)/)
            if (eventMatch && dataMatch) {
              const event = eventMatch[1]
              try {
                const data = JSON.parse(dataMatch[1])
                if (event === 'transaction') {
                  setLastEvent(data)
                  onTransaction?.(data)
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      })
      .catch(() => {
        setConnected(false)
        // Auto-reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 5000)
      })

    return abortController
  }, [apiKey, apiUrl, walletAddress, onTransaction])

  useEffect(() => {
    const controller = connect()
    return () => {
      controller.abort()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])

  return { connected, lastEvent }
}
