import { NextResponse } from 'next/server'
import { z, ZodSchema } from 'zod'

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse }

export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      ),
    }
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      ),
    }
  }

  return { success: true, data: result.data }
}
