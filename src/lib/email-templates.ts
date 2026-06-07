/**
 * Email templates for The Human Index newsletter.
 *
 * Single source of truth for outgoing email markup. The PD weekly
 * brief sender re-uses the same {wrap} helper so that the design
 * stays consistent between welcome + weekly emails.
 */

interface BaseProps {
  /** Pre-rendered HTML body — the unique part of the email. */
  body: string;
  /** Plain-text body for clients that prefer it. */
  plainText: string;
  /** Subject line. */
  subject: string;
  /** Unsubscribe URL with token, included in the footer. */
  unsubscribeUrl: string;
  /** Optional pre-header text — shows in inbox preview. */
  preheader?: string;
}

const BASE_URL = 'https://thehumanindex.org';

/**
 * Wrap a body fragment with the canonical Human Index header / footer.
 * Returns a complete <html> document ready for Resend.
 */
export function wrap({ body, plainText, subject, unsubscribeUrl, preheader }: BaseProps): {
  subject: string;
  html: string;
  text: string;
} {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${escape(subject)}</title>
  ${preheader ? `<style>.preheader{display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:transparent;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;}</style>` : ''}
</head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:Georgia,serif;color:#1A1A1A;">
  ${preheader ? `<div class="preheader">${escape(preheader)}</div>` : ''}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAFAF8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#FFFFFF;border:1px solid #E0E0DC;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #E0E0DC;">
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1A1A1A;">
                  The Human Index
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;font-family:Georgia,serif;font-size:17px;line-height:1.6;color:#1A1A1A;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #E0E0DC;background:#F2F2EF;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.5;color:#595956;">
              <p style="margin:0 0 8px;">
                You're getting this email because you subscribed to the Weekly Stress Brief
                at <a href="${BASE_URL}" style="color:#1F4F8A;">thehumanindex.org</a>.
              </p>
              <p style="margin:0;">
                <a href="${unsubscribeUrl}" style="color:#1F4F8A;">Unsubscribe</a>
                &nbsp;·&nbsp;
                <a href="${BASE_URL}/about" style="color:#1F4F8A;">About</a>
                &nbsp;·&nbsp;
                <a href="${BASE_URL}/methodology" style="color:#1F4F8A;">Methodology</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${plainText}

---
Unsubscribe: ${unsubscribeUrl}
The Human Index — ${BASE_URL}`;

  return { subject, html, text };
}

// ── Welcome email ─────────────────────────────────────────────────

export function welcomeEmail(unsubscribeUrl: string) {
  return wrap({
    subject: 'Welcome to The Human Index',
    preheader: 'Your first Weekly Stress Brief lands this Sunday.',
    body: `
      <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:600;line-height:1.2;margin:0 0 16px;color:#1A1A1A;">
        Welcome to The Human Index.
      </h1>
      <p style="margin:0 0 16px;">
        You're now subscribed to the <strong>Weekly Stress Brief</strong> — a short
        Sunday-morning dispatch on what the world's stress signals are doing.
      </p>
      <p style="margin:0 0 16px;">
        Every brief includes:
      </p>
      <ul style="margin:0 0 16px;padding-left:24px;">
        <li style="margin:0 0 6px;"><strong>The week's biggest mover</strong> — the indicator that shifted the most.</li>
        <li style="margin:0 0 6px;"><strong>A country to watch</strong> — where the composite is breaking.</li>
        <li style="margin:0 0 6px;"><strong>Labor signals</strong> — corporate layoff totals from SEC EDGAR + WARN filings.</li>
        <li style="margin:0;"><strong>One piece of long-form analysis</strong> — the Pulse most worth reading.</li>
      </ul>
      <p style="margin:0 0 16px;">
        Five minutes. Every Sunday. No fluff.
      </p>
      <p style="margin:24px 0 0;">
        <a href="${BASE_URL}" style="display:inline-block;background:#1F2937;color:#FAFAF8;padding:12px 24px;text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:500;border-radius:6px;">
          See what we track →
        </a>
      </p>
      <p style="margin:32px 0 0;color:#595956;font-size:14px;">
        The first brief lands the coming Sunday. In the meantime, the live data
        is always at <a href="${BASE_URL}" style="color:#1F4F8A;">thehumanindex.org</a>.
      </p>
    `,
    plainText: `Welcome to The Human Index.

You're now subscribed to the Weekly Stress Brief — a short Sunday-morning dispatch on what the world's stress signals are doing.

Every brief includes:
- The week's biggest mover (the indicator that shifted the most).
- A country to watch (where the composite is breaking).
- Labor signals (corporate layoff totals from SEC EDGAR + WARN).
- One piece of long-form analysis (the Pulse most worth reading).

Five minutes. Every Sunday. No fluff.

The first brief lands the coming Sunday.
In the meantime: ${BASE_URL}
`,
    unsubscribeUrl,
  });
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
