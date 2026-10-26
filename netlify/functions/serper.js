/*  Rapid Reach audit proxy
    -------------------------------------------------------------
    The closing deck calls this instead of calling serper.dev
    directly, so the Serper key never ships to the browser and
    never goes into a repo.

    The key is read from the SERPER_KEY environment variable,
    which is set in the Netlify dashboard, not in this file.
    -------------------------------------------------------------  */

const ALLOWED_ORIGINS = [
  'https://grantenyeart.github.io'
];

const ALLOWED_ENDPOINTS = ['search', 'places', 'maps'];

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || '';
  const allowed = ALLOWED_ORIGINS.includes(origin);

  const cors = {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: cors, body: 'Method not allowed' };

  // only the deck may use this, so a stray link cannot burn credits
  if (!allowed) return { statusCode: 403, headers: cors, body: 'Forbidden' };

  const key = process.env.SERPER_KEY;
  if (!key) {
    return { statusCode: 500, headers: cors,
      body: JSON.stringify({ error: 'SERPER_KEY is not set on this site.' }) };
  }

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch (e) { return { statusCode: 400, headers: cors, body: 'Bad JSON' }; }

  const endpoint = String(payload.endpoint || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!ALLOWED_ENDPOINTS.includes(endpoint)) {
    return { statusCode: 400, headers: cors, body: 'Unsupported endpoint' };
  }

  let r;
  try {
    r = await fetch('https://google.serper.dev/' + endpoint, {
      method: 'POST',
      headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload.body || {})
    });
  } catch (e) {
    return { statusCode: 502, headers: cors,
      body: JSON.stringify({ error: 'Could not reach Google results.' }) };
  }

  const text = await r.text();
  return {
    statusCode: r.status,
    headers: { ...cors, 'Content-Type': 'application/json' },
    body: text
  };
};
