const SERVICE_LABELS = {
  'office-furniture': 'Office Furniture',
  'home-furniture': 'Home Furniture',
  'carpentry': 'Joinery & Woodwork',
  'partitions': 'Interior Partitions',
  'fitout': 'Finishings',
  'kitchens': 'Kitchens',
  'curtains': 'Curtains & Drapery',
  'carpets-parquet': 'Carpets & Parquet',
  'lighting': 'Lighting',
  'multiple': 'Multiple Services',
};

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { fullName, phone, email, service, message } = req.body || {};

  if (!fullName || !String(fullName).trim()) {
    return res.status(400).json({ error: 'Please enter your full name.' });
  }
  if (!email || !isValidEmail(String(email).trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || 'info@silvertouchqatar.com';
  const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Silver Touch Qatar Website <onboarding@resend.dev>';

  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured in the environment.');
    return res.status(500).json({ error: 'Email service is not configured yet. Please contact us directly.' });
  }

  const serviceLabel = SERVICE_LABELS[service] || 'Not specified';

  const html = `
    <h2>New enquiry from silvertouchqatar.com</h2>
    <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone) || 'Not provided'}</p>
    <p><strong>Service needed:</strong> ${escapeHtml(serviceLabel)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, '<br>') || 'No message provided'}</p>
  `;

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: String(email).trim(),
        subject: `New enquiry from ${fullName}`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('Resend API error:', errText);
      return res.status(502).json({ error: 'Failed to send your message. Please try again or contact us directly.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again or contact us directly.' });
  }
}
