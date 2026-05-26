/* =============================================================
   Netlify Function — create-github-issue
   Creates a GitHub Issue from an in-app bug report form.

   Setup:
   1. Add GITHUB_TOKEN to Netlify environment variables.
      (Settings → Environment variables)
      The token needs Issues: write scope on the target repo.
   2. Create a "user-report" label in GitHub Issues.
   ============================================================= */

const GITHUB_REPO = 'CHAUDHARYS1/taskmaster-pro';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'GitHub token not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { title, severity, description, steps } = body;
  if (!title || !description) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Title and description are required' }) };
  }

  const lines = [
    `**Severity:** ${severity || 'Bug'}`,
    '',
    '## Description',
    description,
  ];
  if (steps) lines.push('', '## Steps to Reproduce', steps);
  lines.push('', '---', '*Submitted via in-app bug report*');

  let ghResp;
  try {
    ghResp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title: `[${severity || 'Bug'}] ${title}`,
        body: lines.join('\n'),
        labels: ['user-report'],
      }),
    });
  } catch {
    return { statusCode: 502, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Failed to reach GitHub API' }) };
  }

  const result = await ghResp.json();
  if (!ghResp.ok) {
    return { statusCode: 502, headers: CORS_HEADERS, body: JSON.stringify({ error: 'GitHub API error', detail: result?.message }) };
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ number: result.number, url: result.html_url }),
  };
};
