import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const output = resolve('.vercel/output');
const config = JSON.parse(await readFile(`${output}/config.json`, 'utf8'));
assert.equal(config.version, 3);
assert.ok(config.routes.some((route) => route.src === '/(.*)' && route.dest === '/__server'));
const functionConfig = JSON.parse(await readFile(`${output}/functions/__server.func/.vc-config.json`, 'utf8'));
assert.equal(functionConfig.runtime, 'nodejs22.x');
assert.equal(functionConfig.supportsResponseStreaming, true);
const { default: handler } = await import(pathToFileURL(`${output}/functions/__server.func/index.mjs`).href);

const home = await handler.fetch(new Request('https://electror.vercel.app/'));
assert.equal(home.status, 200);
const html = await home.text();
assert.ok(html.includes('Wattwise'));
const assets = [...html.matchAll(/(?:src|href)="([^" ]+)"/g)]
  .map((match) => new URL(match[1], 'https://electror.vercel.app').pathname)
  .filter((path) => path.startsWith('/_next/static/'));
assert.ok(assets.length > 0);
for (const path of assets) await access(`${output}/static${path}`);

const badRequest = await handler.fetch(new Request('https://electror.vercel.app/api/forecast?zone=invalid&horizon=24'));
assert.equal(badRequest.status, 400);
assert.equal((await badRequest.json()).code, 'BAD_REQUEST');

const apiKey = process.env.ELECTRICITY_MAPS_API_KEY;
const originalFetch = globalThis.fetch;
try {
  delete process.env.ELECTRICITY_MAPS_API_KEY;
  const missingConfig = await handler.fetch(new Request('https://electror.vercel.app/api/forecast?zone=FR&horizon=24'));
  assert.equal(missingConfig.status, 503);
  assert.equal((await missingConfig.json()).code, 'CONFIG_MISSING');

  // Exercise the success path without a real token or external API requests.
  process.env.ELECTRICITY_MAPS_API_KEY = 'vercel-smoke-test-only';
  const calledEndpoints = new Set();
  globalThis.fetch = async (input, options) => {
    const url = new URL(input instanceof Request ? input.url : input);
    assert.equal(url.origin, 'https://api.electricitymaps.com');
    assert.equal(options.headers['auth-token'], 'vercel-smoke-test-only');
    calledEndpoints.add(url.pathname);
    const point = { datetime: '2030-01-01T00:00:00.000Z', value: 50, unit: 'EUR/MWh', source: 'nordpool.com' };
    const payload = url.pathname.endsWith('/history')
      ? { zone: 'FR', history: [point] }
      : url.pathname.includes('/carbon-intensity/')
        ? { zone: 'FR', forecast: [{ datetime: point.datetime, carbonIntensity: 40 }] }
        : { zone: 'FR', data: [point] };
    return Response.json(payload);
  };
  const success = await handler.fetch(new Request('https://electror.vercel.app/api/forecast?zone=FR&horizon=24'));
  assert.equal(success.status, 200);
  const data = await success.json();
  assert.equal(data.price.data[0].value, 50);
  assert.equal(data.carbon.forecast[0].carbonIntensity, 40);
  assert.deepEqual(data.unavailableSignals, []);
  assert.equal(calledEndpoints.size, 5);
} finally {
  globalThis.fetch = originalFetch;
  if (apiKey !== undefined) process.env.ELECTRICITY_MAPS_API_KEY = apiKey;
  else delete process.env.ELECTRICITY_MAPS_API_KEY;
}

console.log('Vercel : fonction Node 22, accueil, ressources statiques et route API validés.');
