/* eslint-disable @typescript-eslint/no-require-imports */
// Audit-only output routing; no runtime/test assertion changes.
const fs = require('node:fs');
const promises = require('node:fs/promises');
const path = require('node:path');
const { syncBuiltinESMExports } = require('node:module');
const root = '/home/telephoneheater/Work/Theandril';
const source = path.join(root, 'docs/performance');
const target = path.join(root, 'docs/hermes-analysis/qa/legacy-evidence');
function route(value) {
  if (typeof value !== 'string') return value;
  const absolute = path.resolve(value);
  return absolute === source || absolute.startsWith(source + path.sep) ? target + absolute.slice(source.length) : value;
}
for (const api of [fs, promises]) {
  for (const name of ['writeFile', 'writeFileSync', 'mkdir', 'mkdirSync']) {
    if (!api[name]) continue;
    const original = api[name];
    api[name] = function (file, ...args) { return original.call(this, route(file), ...args); };
  }
}
syncBuiltinESMExports();
