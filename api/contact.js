export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey      = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey)      return res.status(500).json({ error: "BREVO_API_KEY is not configured." });
  if (!senderEmail) return res.status(500).json({ error: "BREVO_SENDER_EMAIL is not configured." });

  const { name, email, subject, message } = req.body;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const safe = (str) => str.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  try {
    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept":       "application/json",
        "api-key":      apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender:    { name: "The Corner Office", email: senderEmail },
        to:        [{ email: "kellyandrei16@gmail.com", name: "Kelly" }],
        replyTo:   { email: email.trim(), name: name.trim() },
        subject:   `[C/O Support] ${subject}`,
        htmlContent: `
          <div style="font-family:Georgia,serif;max-width:600px;padding:24px;color:#2D2824;">
            <h2 style="font-size:18px;color:#3E2723;margin-bottom:4px;">New Support Request</h2>
            <p style="font-size:10px;color:#8C7355;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:24px;">
              The Corner Office · Support
            </p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:11px;color:#8C7355;width:80px;">FROM</td>
                <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;">${safe(name.trim())} &lt;${safe(email.trim())}&gt;</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-size:11px;color:#8C7355;">SUBJECT</td>
                <td style="padding:8px 0;font-size:13px;">${safe(subject)}</td>
              </tr>
            </table>
            <div style="background:#F4F1EA;padding:16px;border-left:3px solid #8C7355;">
              <p style="font-size:13px;line-height:1.8;margin:0;white-space:pre-wrap;">${safe(message.trim())}</p>
            </div>
            <p style="font-size:10px;color:#aaa;margin-top:24px;">
              Reply to this email to respond directly to the sender.
            </p>
          </div>
        `,
      }),
    });

    if (!brevoRes.ok) {
      const errText = await brevoRes.text();
      console.error("Brevo error:", errText);
      return res.status(500).json({ error: "Failed to send. Please try again." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("contact handler:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
