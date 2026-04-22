import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { handleRequest } from './server.mjs';

let server;
let port;
let mockFetch;
const realFetch = fetch;

before(async () => {
  global.fetch = async (url, options) => {
    if (url.includes('resend.com')) return mockFetch(url, options);
    return realFetch(url, options);
  };
  server = createServer(handleRequest);
  await new Promise(resolve => server.listen(0, resolve));
  port = server.address().port;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
});

const post = (body) =>
  fetch(`http://localhost:${port}/api/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

test('returns 400 when email is missing', async () => {
  const res = await post({ firstName: 'Jane' });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.error, 'Valid email required');
});

test('returns 400 when email is invalid format', async () => {
  const res = await post({ email: 'notanemail' });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.error, 'Valid email required');
});

test('returns 200 on successful subscription', async () => {
  mockFetch = async () => ({ ok: true, json: async () => ({ id: 'contact_123' }) });
  const res = await post({ email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.deepEqual(json, { success: true });
});

test('sends correct payload to Resend', async () => {
  let capturedBody;
  mockFetch = async (url, options) => {
    capturedBody = JSON.parse(options.body);
    return { ok: true, json: async () => ({}) };
  };

  await post({
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    organization: 'UofT',
    academicUnit: 'Engineering',
    affiliationTypes: ['Graduate Student', 'Faculty'],
  });

  assert.equal(capturedBody.email, 'jane@example.com');
  assert.equal(capturedBody.first_name, 'Jane');
  assert.equal(capturedBody.last_name, 'Smith');
  assert.equal(capturedBody.unsubscribed, false);
  assert.equal(capturedBody.properties.organization, 'UofT');
  assert.equal(capturedBody.properties.academic_unit, 'Engineering');
  assert.equal(capturedBody.properties.affiliation_type, 'Graduate Student, Faculty');
});

test('returns 500 when Resend API fails', async () => {
  mockFetch = async () => ({ ok: false, status: 422, json: async () => ({ message: 'Invalid' }) });
  const res = await post({ email: 'bad@example.com' });
  assert.equal(res.status, 500);
  const json = await res.json();
  assert.equal(json.error, 'Failed to subscribe');
});

test('returns 404 for unknown routes', async () => {
  const res = await fetch(`http://localhost:${port}/other`, { method: 'POST', body: '{}' });
  assert.equal(res.status, 404);
});
