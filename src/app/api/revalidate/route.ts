import { revalidatePath } from 'next/cache'

// Fail-closed auth: if the secret env var is not configured, every request is
// rejected. Accepts REVALIDATE_SECRET (legacy name) or REVALIDATION_SECRET
// (the name documented in .env.example) so a deploy with either works.
function isAuthorized(secret: unknown): boolean {
  const configured = process.env.REVALIDATE_SECRET || process.env.REVALIDATION_SECRET
  return Boolean(configured) && secret === configured
}

export async function POST(request: Request) {
  try {
    const { secret } = await request.json()

    if (!isAuthorized(secret)) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Revalidate paths
    revalidatePath('/')
    revalidatePath('/countries')
    revalidatePath('/pulse')

    return Response.json({ revalidated: true, now: Date.now() })
  } catch {
    return Response.json({ error: 'Failed to revalidate' }, { status: 500 })
  }
}

// GET version — requires the same secret via ?secret= (previously
// unauthenticated, which allowed anyone to force-bust the homepage cache).
export async function GET(request: Request) {
  try {
    const secret = new URL(request.url).searchParams.get('secret')
    if (!isAuthorized(secret)) {
      return new Response('Unauthorized', { status: 401 })
    }
    revalidatePath('/')
    return Response.json({ revalidated: true, path: '/', now: Date.now() })
  } catch {
    return Response.json({ error: 'Failed to revalidate' }, { status: 500 })
  }
}
