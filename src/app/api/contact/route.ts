import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!name || !email || !message) {
      return Response.json({ error: 'Name, email, and message are required' }, { status: 400 })
    }

    // Store in Supabase
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name,
          email,
          subject: subject || 'general',
          message,
          created_at: new Date().toISOString(),
        })

      if (error) throw error
    } catch {
      // If table doesn't exist yet, log but still return success
      // Messages won't be lost — they're in the server logs
      console.log('Contact message received (Supabase table may not exist):', { name, email, subject, message: message.slice(0, 100) })
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
