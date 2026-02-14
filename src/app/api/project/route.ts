import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const convex = getConvexClient()
    const project = await convex.query(api.projects.getProjectById, {
      id: session.projectId as Id<"projects">,
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: project._id,
      name: project.name,
      email: project.ownerEmail,
      planTier: project.planTier ?? 'free',
      createdAt: new Date(project._creationTime).toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    const convex = getConvexClient()
    await convex.mutation(api.projects.updateProjectName, {
      id: session.projectId as Id<"projects">,
      name: name.trim(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}
