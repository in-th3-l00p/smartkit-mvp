import { NextRequest, NextResponse } from 'next/server'
import { db, type ApiKey } from '@/lib/db/schema'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    return NextResponse.json(db.apiKeys)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    const apiKey: ApiKey = {
      id: uuidv4(),
      key: `sk_test_${uuidv4().replace(/-/g, '')}`,
      name,
      userId: 'user_demo1',
      createdAt: new Date(),
      lastUsed: null,
      requestCount: 0,
    }

    db.apiKeys.push(apiKey)
    return NextResponse.json(apiKey, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}
