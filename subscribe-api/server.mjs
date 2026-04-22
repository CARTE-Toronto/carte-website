import { createServer } from 'node:http';

const PORT = process.env.PORT || 3000;

export async function handleRequest(req, res) {
  if (req.method !== 'POST' || req.url !== '/api/subscribe') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  let data;
  try {
    data = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const { email, firstName, lastName, organization, academicUnit, affiliationTypes } = data;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Valid email required' }));
    return;
  }

  try {
    const response = await fetch(
      `https://api.resend.com/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          first_name: firstName || undefined,
          last_name: lastName || undefined,
          unsubscribed: false,
          properties: {
            ...(organization && { organization }),
            ...(academicUnit && { academic_unit: academicUnit }),
            ...(affiliationTypes?.length && { affiliation_type: affiliationTypes.join(', ') }),
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Resend error:', response.status, err);
      throw new Error(`Resend API error: ${response.status}`);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    console.error('Subscribe error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to subscribe' }));
  }
}

if (process.argv[1]?.endsWith('server.mjs')) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_AUDIENCE_ID) {
    console.error('Fatal: RESEND_API_KEY and RESEND_AUDIENCE_ID must be set');
    process.exit(1);
  }
  createServer(handleRequest).listen(PORT, () =>
    console.log(`Subscribe API listening on port ${PORT}`)
  );
}
