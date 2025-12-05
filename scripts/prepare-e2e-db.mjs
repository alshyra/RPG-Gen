#!/usr/bin/env node
/*
 * prepare-e2e-db.mjs
 * Simple CLI to prepare the backend DB for E2E tests.
 * - Supports creating a number of characters (default 2)
 * - Optionally cleans existing characters
 *
 * Usage examples:
 *   # create 2 characters against http://localhost
 *   node ./scripts/prepare-e2e-db.mjs --url http://localhost --count 2
 *
 *   # cleanup (delete) all characters for the synthetic E2E user
 *   node ./scripts/prepare-e2e-db.mjs --url http://localhost --cleanup
 */

import process from 'node:process';

const argv = process.argv.slice(2);
const opts = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--url' && argv[i + 1]) {
    opts.url = argv[++i];
  } else if (a === '--count' && argv[i + 1]) {
    opts.count = parseInt(argv[++i], 10);
  } else if (a === '--cleanup') {
    opts.cleanup = true;
  } else if (a === '--ready') {
    // create a fully-ready character (hp, stats, equipped weapon)
    opts.ready = true;
  } else if (a === '--with-chat') {
    // append an assistant message with a combat_start instruction so combat initializes on history load
    opts.withChat = true;
  } else if (a === '--help' || a === '-h') {
    console.log(`Usage: node scripts/prepare-e2e-db.mjs [--url <API_URL>] [--count <n>] [--cleanup]`);
    process.exit(0);
  }
}

const API_URL = opts.url || process.env.API_URL || 'http://localhost';
const COUNT = Number.isInteger(opts.count) ? opts.count : 2;

const log = (...args) => console.log('[prepare-e2e-db]', ...args);

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  return { status: res.status, body: json, raw: text };
}

async function main() {
  log(`Using API_URL=${API_URL}`);

  // check server
  try {
    const ping = await request('/api/characters', { method: 'GET' });
    if (ping.status >= 400) {
      log('Warning: GET /api/characters returned', ping.status, ping.body || ping.raw);
    }
  } catch (e) {
    console.error('Failed to reach backend at', API_URL, e.message || e);
    process.exit(2);
  }

  // Optionally cleanup existing characters
  if (opts.cleanup) {
    log('Fetching existing characters to delete...');
    const list = await request('/api/characters', { method: 'GET' });
    if (list.status !== 200) {
      log('Failed to list characters, status:', list.status);
    } else {
      const chars = list.body || [];
      log(`Found ${chars.length} characters. Deleting...`);
      for (const c of chars) {
        try {
          const del = await request(`/api/characters/${c.characterId}`, { method: 'DELETE' });
          log('Deleted', c.characterId, 'status', del.status);
        } catch (e) {
          log('Failed to delete', c?.characterId, e?.message || e);
        }
      }
    }

    log('Cleanup finished');
    return;
  }

  // Create COUNT characters and set a friendly name for each
  const created = [];
  for (let i = 1; i <= COUNT; i++) {
    try {
      log('Creating character', i, '...');
      const create = await request('/api/characters', { method: 'POST', body: { world: 'dnd' } });
      if (![200, 201].includes(create.status)) {
        log('Failed to create character ', create.status, create.body || create.raw);
        continue;
      }

      const characterId = create.body?.characterId || create.body?.id || null;
      if (!characterId) {
        log('Created response missing characterId:', create.body);
        continue;
      }

      // update with a clear name so UI shows it
      const name = `e2e-${new Date().toISOString().replace(/[:.]/g, '')}-${i}`;
      const updateBody = { name };

      // If --ready provided, set typical D&D starter stats and HP, equip a starter weapon
      if (opts.ready) {
        updateBody.hp = 12;
        updateBody.hpMax = 12;
        updateBody.proficiency = 2;
        updateBody.scores = { Str: 14, Dex: 14, Con: 12, Int: 10, Wis: 10, Cha: 10 };
        updateBody.portrait = '/images/portraits/default.png';
        updateBody.world = 'dnd';
        updateBody.state = 'created';
      }

      await request(`/api/characters/${characterId}`, { method: 'PUT', body: updateBody });
      log('Created characterId', characterId, 'name', name);
      created.push({ characterId, name });

      // If ready, add a starter weapon and equip it
      if (opts.ready) {
        try {
          // Add a rapier (starter weapon) to inventory and mark as equipped
          const invResp = await request(`/api/characters/${characterId}/inventory`, {
            method: 'POST',
            body: {
              definitionId: 'weapon-rapier',
              name: 'Rapier',
              qty: 1,
              equipped: true,
              meta: { type: 'weapon' },
            },
          });
          if (![200, 201].includes(invResp.status)) {
            log('Failed to add inventory for', characterId, invResp.status, invResp.body || invResp.raw);
          } else {
            // Ensure equipped via equip endpoint (some controllers expect definitionId equip)
            await request(`/api/characters/${characterId}/inventory/equip`, { method: 'POST', body: { definitionId: 'weapon-rapier' } });
          }
        } catch (e) {
          log('Failed to add/equip starter weapon', e?.message || e);
        }
      }

      // Optionally start combat directly via the combat API
      if (opts.withChat) {
        try {
          // Start combat directly via the combat API
          const combatStartBody = {
            combat_start: [
              { name: 'Goblin', hp: 7, ac: 13, attack_bonus: 4, damage_dice: '1d6', damage_bonus: 2 },
            ],
          };
          const combatResp = await request(`/api/combat/${characterId}/start`, { method: 'POST', body: combatStartBody });
          if (![200, 201].includes(combatResp.status)) {
            log('Failed to start combat for', characterId, combatResp.status, combatResp.body || combatResp.raw);
          } else {
            log('Started combat for', characterId);
          }
        } catch (e) {
          log('Failed to start combat for', characterId, e?.message || e);
        }
      }
    } catch (e) {
      log('Error creating character', e?.message || e);
    }
  }

  log('Done. Created', created.length, 'characters');
  console.table(created);
}

main().catch((e) => {
  console.error('Unexpected error', e);
  process.exit(2);
});
