// Creates every .env from its .env.example on the first run, then the root .env that Docker
// Compose reads, so that Postgres is published on the port of DATABASE_URL (apps/api/.env), with
// its user and password.
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

import { isPortFree } from './ports.mjs';

const folders = ['apps/api', 'apps/client'];

for (const folder of folders) {
  const example = `${folder}/.env.example`;
  const target = `${folder}/.env`;
  if (existsSync(example) && !existsSync(target)) {
    copyFileSync(example, target);
    console.log(`Created ${target} from ${example}`);
    if (folder === 'apps/api') await prepareDatabaseUrl(target);
  }
}

const databaseUrl = new URL(parseEnv(readFileSync('apps/api/.env', 'utf8')).DATABASE_URL);
writeFileSync(
  '.env',
  [
    '# Written by scripts/setup-env.mjs from DATABASE_URL (apps/api/.env): change it there instead.',
    `POSTGRES_PORT=${databaseUrl.port || 5432}`,
    `POSTGRES_USER=${decodeURIComponent(databaseUrl.username)}`,
    `POSTGRES_PASSWORD=${decodeURIComponent(databaseUrl.password)}`,
    '',
  ].join('\n'),
);

/**
 * The template holds no credentials: each clone gets its own password. Another Postgres often
 * runs on the default port: take the next free one instead.
 */
async function prepareDatabaseUrl(envFile) {
  const content = readFileSync(envFile, 'utf8');
  const url = new URL(parseEnv(content).DATABASE_URL);
  url.username ||= 'stoik';
  url.password ||= randomBytes(18).toString('base64url');
  const preferred = Number(url.port);
  for (let port = preferred; port < preferred + 10; port += 1) {
    if (!(await isPortFree(port))) continue;
    if (port !== preferred)
      console.log(`Port ${preferred} is taken: Postgres will use port ${port}.`);
    url.port = String(port);
    break;
  }
  writeFileSync(envFile, content.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${url}`));
}
