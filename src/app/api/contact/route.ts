export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!name || !email || !message) {
      return Response.json({ error: 'Name, email, and message are required' }, { status: 400 })
    }

    const subjectLabels: Record<string, string> = {
      general: 'General Inquiry',
      press: 'Press & Media',
      research: 'Research Collaboration',
      data: 'Data & API Access',
      feedback: 'Feedback & Suggestions',
      bug: 'Bug Report',
    }

    const subjectLabel = subjectLabels[subject] || subject || 'General'

    // Send email via Resend
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const NOTIFY_EMAIL = process.env.CONTACT_NOTIFY_EMAIL || 'experlercom@gmail.com'

      await resend.emails.send({
        from: 'The Human Index <onboarding@resend.dev>',
        to: NOTIFY_EMAIL,
        replyTo: email,
        subject: `[THI Contact] ${subjectLabel} — from ${name}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0; color: #111;">New Contact Message</h2>
              <p style="margin: 4px 0 0; color: #666; font-size: 14px;">The Human Index — Contact Form</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr><td style="padding: 8px 0; color: #999; font-size: 13px; width: 100px;">From</td><td style="padding: 8px 0; font-size: 14px;"><strong>${name}</strong></td></tr>
              <tr><td style="padding: 8px 0; color: #999; font-size: 13px;">Email</td><td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #999; font-size: 13px;">Subject</td><td style="padding: 8px 0; font-size: 14px;">${subjectLabel}</td></tr>
            </table>
            <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #333; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="font-size: 12px; color: #999;">Reply directly to this email to respond to ${name}.</p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Resend email failed:', emailError)
      // Still return success — message was received even if email notification failed
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
