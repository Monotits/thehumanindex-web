import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const { secret } = await request.json()

    // Validate secret token
    if (secret !== process.env.REVALIDATE_SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Revalidate paths
    revalidatePath('/')
    revalidatePath('/dashboard')
    revalidatePath('/pulse')

    return Response.json({ revalidated: true, now: Date.now() })
  } catch {
    return Response.json({ error: 'Failed to revalidate' }, { status: 500 })
  }
}
